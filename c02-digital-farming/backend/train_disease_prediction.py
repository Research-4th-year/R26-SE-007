import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
import json

# Ignore warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

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
        
    # Preprocessing & Data Augmentation
    data_augmentation = tf.keras.Sequential([
        tf.keras.layers.RandomFlip('horizontal'),
        tf.keras.layers.RandomRotation(0.2),
        tf.keras.layers.RandomZoom(0.2),
    ])
    
    # Base Model (MobileNetV2)
    preprocess_input = tf.keras.applications.mobilenet_v2.preprocess_input
    base_model = MobileNetV2(input_shape=IMG_SIZE + (3,),
                             include_top=False,
                             weights='imagenet')
                             
    base_model.trainable = False  # Freeze base model
    
    # Custom Head
    inputs = tf.keras.Input(shape=IMG_SIZE + (3,))
    x = data_augmentation(inputs)
    x = preprocess_input(x)
    x = base_model(x, training=False)
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.2)(x)
    outputs = Dense(len(class_names), activation='softmax')(x)
    
    model = Model(inputs, outputs)
    
    # Compile
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
                  
    print("\nStarting Training...")
    early_stopping = tf.keras.callbacks.EarlyStopping(
        monitor='val_loss', 
        patience=3, 
        restore_best_weights=True
    )
    
    history = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=EPOCHS,
        callbacks=[early_stopping]
    )
    
    # Save Model
    model_path = os.path.join(MODELS_DIR, 'disease_prediction_model.keras')
    model.save(model_path)
    print(f"\nModel saved successfully at {model_path}")

if __name__ == "__main__":
    # pyright: reportMissingImports=false
    build_and_train_model()
