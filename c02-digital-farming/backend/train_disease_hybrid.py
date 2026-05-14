import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, regularizers
# pyrefly: ignore [missing-import]
from tensorflow.keras.applications import MobileNetV2, InceptionV3
from tensorflow.keras.callbacks import (
    EarlyStopping, ModelCheckpoint, ReduceLROnPlateau, TensorBoard
)
from sklearn.utils.class_weight import compute_class_weight
import datetime
# pyrefly: ignore [missing-import]
import cv2

import config

# Enable mixed precision for faster training on compatible GPUs
try:
    policy = tf.keras.mixed_precision.Policy('mixed_float16')
    tf.keras.mixed_precision.set_global_policy(policy)
    print("Mixed precision enabled.")
except Exception as e:
    print(f"Mixed precision not enabled: {e}")

# Apply CLAHE and lighting simulation using tf.numpy_function
def apply_clahe_and_lighting(image):
    def _process(img):
        # Ensure image is uint8
        img = np.clip(img * 255.0, 0, 255).astype(np.uint8)
        # Convert to LAB for CLAHE
        lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl,a,b))
        img = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)
        
        # Simulated lighting variation (random gamma)
        gamma = np.random.uniform(0.8, 1.2)
        invGamma = 1.0 / gamma
        table = np.array([((i / 255.0) ** invGamma) * 255
                          for i in np.arange(0, 256)]).astype("uint8")
        img = cv2.LUT(img, table)
        
        # Convert back to float32 [0, 1]
        return img.astype(np.float32) / 255.0

    processed_img = tf.numpy_function(_process, [image], tf.float32)
    processed_img.set_shape(image.shape)
    return processed_img

def build_dataset(data_dir):
    print(f"Loading dataset from: {data_dir}")
    if not os.path.exists(data_dir):
        raise FileNotFoundError(f"Dataset directory not found: {data_dir}")

    train_ds = tf.keras.utils.image_dataset_from_directory(
        data_dir,
        validation_split=0.2,
        subset="training",
        seed=config.SEED,
        image_size=(config.IMG_HEIGHT, config.IMG_WIDTH),
        batch_size=config.BATCH_SIZE,
        label_mode='categorical'
    )

    val_ds = tf.keras.utils.image_dataset_from_directory(
        data_dir,
        validation_split=0.2,
        subset="validation",
        seed=config.SEED,
        image_size=(config.IMG_HEIGHT, config.IMG_WIDTH),
        batch_size=config.BATCH_SIZE,
        label_mode='categorical'
    )
    
    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"Classes found ({num_classes}): {class_names}")

    # Save class indices
    class_indices = {class_name: i for i, class_name in enumerate(class_names)}
    with open(config.CLASSES_JSON_PATH, 'w') as f:
        json.dump(class_indices, f)
        
    return train_ds, val_ds, num_classes, class_names

def compute_weights(train_ds, num_classes):
    print("Computing class weights to handle imbalance...")
    labels = []
    for _, y in train_ds.unbatch():
        labels.append(np.argmax(y.numpy()))
    
    class_weights = compute_class_weight(
        class_weight='balanced',
        classes=np.unique(labels),
        y=labels
    )
    weight_dict = dict(enumerate(class_weights))
    print(f"Class weights: {weight_dict}")
    return weight_dict

def get_data_augmentation():
    return tf.keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(config.ROTATION_RANGE),
        layers.RandomZoom(config.ZOOM_RANGE),
        layers.RandomTranslation(config.WIDTH_SHIFT, config.HEIGHT_SHIFT),
        layers.RandomContrast(0.2),
        layers.RandomBrightness(0.2),
        layers.GaussianNoise(0.1) # Added noise
    ], name="data_augmentation")

def build_hybrid_model(num_classes):
    print("Building Hybrid Model (MobileNetV2 + InceptionV3)...")
    inputs = layers.Input(shape=config.INPUT_SHAPE)
    
    # Preprocessing and Augmentation
    x = layers.Rescaling(1./255)(inputs)
    x = get_data_augmentation()(x)
    
    # Stream 1: MobileNetV2
    mobilenet = MobileNetV2(
        input_shape=config.INPUT_SHAPE,
        include_top=False,
        weights='imagenet'
    )
    mobilenet._name = "mobilenetv2_base"
    mobilenet.trainable = False
    
    # Stream 2: InceptionV3
    inception = InceptionV3(
        input_shape=config.INPUT_SHAPE,
        include_top=False,
        weights='imagenet'
    )
    inception._name = "inceptionv3_base"
    inception.trainable = False
    
    # Needs resizing for InceptionV3 if not 299x299 (MobileNet is fine with 224x224)
    # However, InceptionV3 supports down to 75x75. We use 224x224 for both.
    
    # Pass inputs through both bases
    # Note: Keras applications expect specific preprocessing, but we used Rescaling(1./255) 
    # which is close enough for both if we rescale to [-1, 1] for MobileNet/Inception, 
    # but for simplicity and standard practice, using 1./255 works reasonably well.
    # A more precise way is to use their respective preprocess_input functions.
    
    # MobileNet expects [-1, 1]
    mn_input = layers.Lambda(lambda x: (x * 2) - 1.0)(x)
    out_mn = mobilenet(mn_input)
    out_mn = layers.GlobalAveragePooling2D()(out_mn)
    
    # Inception expects [-1, 1]
    inc_input = layers.Lambda(lambda x: (x * 2) - 1.0)(x)
    out_inc = inception(inc_input)
    out_inc = layers.GlobalAveragePooling2D()(out_inc)
    
    # Feature Fusion
    merged = layers.Concatenate()([out_mn, out_inc])
    
    # Custom Head
    merged = layers.BatchNormalization()(merged)
    merged = layers.Dense(
        512, 
        activation='relu', 
        kernel_regularizer=regularizers.l2(config.L2_REGULARIZATION)
    )(merged)
    merged = layers.BatchNormalization()(merged)
    merged = layers.Dropout(config.DROPOUT_RATE)(merged)
    
    merged = layers.Dense(
        256, 
        activation='relu', 
        kernel_regularizer=regularizers.l2(config.L2_REGULARIZATION)
    )(merged)
    merged = layers.Dropout(config.DROPOUT_RATE / 2)(merged)
    
    # Output layer (Mixed precision compatibility -> dtype=float32)
    outputs = layers.Dense(num_classes, activation='softmax', dtype='float32')(merged)
    
    model = models.Model(inputs, outputs)
    return model

def train_model():
    # 1. Dataset Preparation
    train_ds, val_ds, num_classes, class_names = build_dataset(config.DATASETS_DIR)
    
    # Apply custom map function for CLAHE and lighting to training data
    # (Optional: can be slow, uncomment if needed)
    # train_ds = train_ds.map(lambda x, y: (apply_clahe_and_lighting(x), y), num_parallel_calls=tf.data.AUTOTUNE)
    
    # Optimize dataset pipeline
    train_ds = train_ds.prefetch(buffer_size=tf.data.AUTOTUNE)
    val_ds = val_ds.prefetch(buffer_size=tf.data.AUTOTUNE)
    
    class_weights = compute_weights(train_ds, num_classes)
    
    # 2. Build Model
    model = build_hybrid_model(num_classes)
    
    # 3. Compile Model
    lr_schedule = tf.keras.optimizers.schedules.CosineDecay(
        initial_learning_rate=config.INITIAL_LEARNING_RATE,
        decay_steps=config.INITIAL_EPOCHS * (len(train_ds)),
        alpha=0.01
    )
    
    optimizer = tf.keras.optimizers.Adam(learning_rate=lr_schedule, clipnorm=1.0)
    
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall(name='recall')]
    )
    
    model.summary()

    # 4. Callbacks
    log_dir = os.path.join(config.LOGS_DIR, "fit", datetime.datetime.now().strftime("%Y%m%d-%H%M%S"))
    callbacks = [
        TensorBoard(log_dir=log_dir, histogram_freq=1),
        ModelCheckpoint(config.MODEL_SAVE_PATH, save_best_only=True, monitor='val_accuracy', mode='max'),
        EarlyStopping(monitor='val_loss', patience=7, restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6)
    ]

    # 5. Phase 1: Train Top Layers (Frozen Bases)
    print("\n--- PHASE 1: Training Top Layers ---")
    history_initial = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=config.INITIAL_EPOCHS,
        class_weight=class_weights,
        callbacks=callbacks
    )

    # 6. Phase 2: Fine-Tuning
    print("\n--- PHASE 2: Fine-Tuning ---")
    
    # Unfreeze the last 40 layers of Inception and MobileNet
    mobilenet = model.get_layer("mobilenetv2_base")
    mobilenet.trainable = True
    for layer in mobilenet.layers[:-40]:
        layer.trainable = False
        
    inception = model.get_layer("inceptionv3_base")
    inception.trainable = True
    for layer in inception.layers[:-40]:
        layer.trainable = False

    # Recompile with lower learning rate
    optimizer_ft = tf.keras.optimizers.Adam(learning_rate=config.FINE_TUNE_LEARNING_RATE, clipnorm=1.0)
    model.compile(
        optimizer=optimizer_ft,
        loss='categorical_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall(name='recall')]
    )

    history_fine = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=config.TOTAL_EPOCHS,
        initial_epoch=history_initial.epoch[-1],
        class_weight=class_weights,
        callbacks=callbacks
    )

    print(f"\nTraining Complete. Best model saved to: {config.MODEL_SAVE_PATH}")
    return model, history_fine

if __name__ == "__main__":
    # Ensure reproducibility
    tf.keras.utils.set_random_seed(config.SEED)
    tf.config.experimental.enable_op_determinism()
    
    train_model()
