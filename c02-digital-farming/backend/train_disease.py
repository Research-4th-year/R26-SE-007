import tensorflow as tf
from tensorflow.keras import layers, models
# pyrefly: ignore [missing-import]
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os
import numpy as np

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(os.path.dirname(BASE_DIR), 'datasets', 'rice_leaf_disease')
MODELS_DIR = os.path.join(BASE_DIR, 'models')

os.makedirs(MODELS_DIR, exist_ok=True)

# Image parameters
IMG_HEIGHT = 224
IMG_WIDTH = 224
BATCH_SIZE = 32

def train_cnn():
    print("Preparing data for CNN Training...")
    
    # We expect subdirectories like: Bacterial Blight, Brown Spot, Leaf Blast, Healthy
    if not os.path.exists(DATASETS_DIR):
        print(f"Dataset directory not found: {DATASETS_DIR}")
        return

    # Data augmentation for training
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        validation_split=0.2 # 20% validation split
    )

    train_generator = train_datagen.flow_from_directory(
        DATASETS_DIR,
        target_size=(IMG_HEIGHT, IMG_WIDTH),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training'
    )

    validation_generator = train_datagen.flow_from_directory(
        DATASETS_DIR,
        target_size=(IMG_HEIGHT, IMG_WIDTH),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation'
    )
    
    num_classes = len(train_generator.class_indices)
    print(f"Classes found: {train_generator.class_indices}")

    # Build CNN Model
    print("Building CNN Model...")
    model = models.Sequential([
        # pyrefly: ignore [unexpected-keyword]
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=(IMG_HEIGHT, IMG_WIDTH, 3)),
        layers.MaxPooling2D(2, 2),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D(2, 2),
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D(2, 2),
        layers.Flatten(),
        layers.Dense(512, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(optimizer='adam',
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])

    # Train the model
    print("Training Model... (this may take a while)")
    epochs = 10 # Set to 10 for demonstration, increase for production
    
    history = model.fit(
        train_generator,
        validation_data=validation_generator,
        epochs=epochs
    )

    # Evaluate
    loss, accuracy = model.evaluate(validation_generator)
    print(f"\n--- CNN Model Evaluation ---")
    print(f"Validation Accuracy: {accuracy*100:.2f}%")

    # Save the model
    model_path = os.path.join(MODELS_DIR, 'disease_model.h5')
    model.save(model_path)
    print(f"\nModel saved to {model_path}")
    
    # Save class indices
    import json
    with open(os.path.join(MODELS_DIR, 'disease_classes.json'), 'w') as f:
        json.dump(train_generator.class_indices, f)

if __name__ == "__main__":
    train_cnn()
