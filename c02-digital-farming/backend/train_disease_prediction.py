import os
import time
import tensorflow as tf
# pyrefly: ignore [missing-import]
from tensorflow.keras.applications import MobileNetV2, EfficientNetB0, ResNet50
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
import json

# Ignore warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

def train_specific_model(name, model_class, preprocess_fn, train_dataset, val_dataset, class_names, img_size, epochs, models_dir):
    print(f"\n{'='*40}")
    print(f"Training {name}")
    print(f"{'='*40}")
    
    # Preprocessing & Data Augmentation
    data_augmentation = tf.keras.Sequential([
        tf.keras.layers.RandomFlip('horizontal'),
        tf.keras.layers.RandomRotation(0.2),
        tf.keras.layers.RandomZoom(0.2),
    ])
    
    base_model = model_class(
        input_shape=img_size + (3,),
        include_top=False,
        weights='imagenet'
    )
    base_model.trainable = False  # Freeze base model
    
    # Custom Head
    inputs = tf.keras.Input(shape=img_size + (3,))
    x = data_augmentation(inputs)
    x = preprocess_fn(x)
    x = base_model(x, training=False)
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.2)(x)
    outputs = Dense(len(class_names), activation='softmax')(x)
    
    model = Model(inputs, outputs)
    
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
                  
    early_stopping = tf.keras.callbacks.EarlyStopping(
        monitor='val_loss', 
        patience=3, 
        restore_best_weights=True
    )
    
    start_time = time.time()
    history = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=epochs,
        callbacks=[early_stopping]
    )
    training_time = time.time() - start_time
    
    model_path = os.path.join(models_dir, f"{name.lower()}_disease_prediction_model.h5")
    model.save(model_path)
    print(f"{name} saved successfully at {model_path}")
    
    # Get best validation accuracy and loss
    best_epoch_idx = history.history['val_loss'].index(min(history.history['val_loss']))
    best_val_acc = history.history['val_accuracy'][best_epoch_idx]
    best_val_loss = history.history['val_loss'][best_epoch_idx]
    
    return {
        "name": name,
        "val_accuracy": best_val_acc,
        "val_loss": best_val_loss,
        "parameters": model.count_params(),
        "training_time": training_time
    }

def build_and_train_model():
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATASET_DIR = os.path.join(BASE_DIR, 'dataset', 'RiceLeafsDisease')
    TRAIN_DIR = os.path.join(DATASET_DIR, 'train')
    VAL_DIR = os.path.join(DATASET_DIR, 'validation')
    
    MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    # Parameters
    IMG_SIZE = (224, 224)
    BATCH_SIZE = 32
    EPOCHS = 10
    
    print("Loading datasets...")
    train_dataset = tf.keras.utils.image_dataset_from_directory(
        TRAIN_DIR,
        shuffle=True,
        batch_size=BATCH_SIZE,
        image_size=IMG_SIZE
    )
    
    val_dataset = tf.keras.utils.image_dataset_from_directory(
        VAL_DIR,
        shuffle=True,
        batch_size=BATCH_SIZE,
        image_size=IMG_SIZE
    )
    
    class_names = train_dataset.class_names
    print(f"Found classes: {class_names}")
    
    # Save class names mapping for the API
    with open(os.path.join(MODELS_DIR, 'disease_classes.json'), 'w') as f:
        json.dump(class_names, f)
        
    models_to_train = [
        {
            "name": "MobileNetV2",
            "model_class": MobileNetV2,
            "preprocess_fn": tf.keras.applications.mobilenet_v2.preprocess_input
        },
        {
            "name": "EfficientNetB0",
            "model_class": EfficientNetB0,
            "preprocess_fn": tf.keras.applications.efficientnet.preprocess_input
        },
        {
            "name": "ResNet50",
            "model_class": ResNet50,
            "preprocess_fn": tf.keras.applications.resnet50.preprocess_input
        }
    ]
    
    results = []
    
    for m in models_to_train:
        result = train_specific_model(
            name=m["name"],
            model_class=m["model_class"],
            preprocess_fn=m["preprocess_fn"],
            train_dataset=train_dataset,
            val_dataset=val_dataset,
            class_names=class_names,
            img_size=IMG_SIZE,
            epochs=EPOCHS,
            models_dir=MODELS_DIR
        )
        results.append(result)
        
    print(f"\n{'='*40}")
    print("MODEL COMPARISON")
    print(f"{'='*40}\n")
    
    for r in results:
        print(r["name"])
        print(f"Validation Accuracy: {r['val_accuracy']*100:.2f}%")
        print(f"Validation Loss: {r['val_loss']:.4f}")
        print(f"Parameters: {r['parameters']}")
        print(f"Training Time: {r['training_time']:.2f} seconds\n")
        
    print(f"{'='*40}")
    print("BEST MODEL")
    print(f"{'='*40}")
    
    best_model = max(results, key=lambda x: x["val_accuracy"])
    print(f"Best model based on validation accuracy:\n{best_model['name']}")

if __name__ == "__main__":
    # pyright: reportMissingImports=false
    build_and_train_model()
