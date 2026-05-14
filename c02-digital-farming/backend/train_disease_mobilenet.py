import os
import tensorflow as tf
# pyrefly: ignore [missing-import]
from tensorflow.keras.preprocessing.image import ImageDataGenerator
# pyrefly: ignore [missing-import]
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np

# Configuration
DATASET_DIR = "datasets/rice_leaf_disease/"
MODELS_DIR = "models/"
MODEL_SAVE_PATH = os.path.join(MODELS_DIR, "disease_model.h5")
BATCH_SIZE = 32
IMG_SIZE = (224, 224)
EPOCHS = 15

def build_model(num_classes):
    print("Building MobileNetV2 model...")
    # 1. Use MobileNetV2 base
    base_model = MobileNetV2(
        weights='imagenet', 
        include_top=False, 
        input_shape=IMG_SIZE + (3,)
    )
    
    # Freeze base layers
    base_model.trainable = False

    # Add custom classification head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    predictions = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)

    # Compile with Adam and categorical_crossentropy
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

def train():
    if not os.path.exists(DATASET_DIR):
        print(f"Error: Dataset directory {DATASET_DIR} does not exist.")
        return
        
    os.makedirs(MODELS_DIR, exist_ok=True)

    # 2. Preprocess & Data Augmentation
    print("Loading dataset and setting up data augmentation...")
    datagen = ImageDataGenerator(
        rescale=1./255,           # Normalize pixel values
        rotation_range=20,        # Data augmentation
        zoom_range=0.2,
        horizontal_flip=True,
        validation_split=0.2      # 80/20 split
    )

    train_generator = datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training'
    )

    val_generator = datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation',
        shuffle=False
    )

    num_classes = len(train_generator.class_indices)
    print(f"Found {num_classes} classes: {train_generator.class_indices}")

    # Save class indices for backend usage
    import json
    with open(os.path.join(MODELS_DIR, 'disease_classes.json'), 'w') as f:
        # Save as {class_name: index} -> we might invert it later or use as is
        json.dump(train_generator.class_indices, f)

    # 3. Train model
    model = build_model(num_classes)
    
    print("Starting training...")
    history = model.fit(
        train_generator,
        epochs=EPOCHS,
        validation_data=val_generator
    )

    # 4. Evaluate
    print("Evaluating model...")
    val_loss, val_accuracy = model.evaluate(val_generator)
    print(f"Validation Accuracy: {val_accuracy:.4f}")
    
    print("\nConfusion Matrix & Classification Report:")
    val_generator.reset()
    predictions = model.predict(val_generator)
    y_pred = np.argmax(predictions, axis=1)
    y_true = val_generator.classes
    
    class_labels = list(train_generator.class_indices.keys())
    print(confusion_matrix(y_true, y_pred))
    print(classification_report(y_true, y_pred, target_names=class_labels))

    # 5. Save model
    print(f"Saving model to {MODEL_SAVE_PATH}...")
    model.save(MODEL_SAVE_PATH)
    print("Training complete!")

if __name__ == "__main__":
    train()
