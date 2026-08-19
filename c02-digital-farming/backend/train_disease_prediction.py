import os
import time
import json
import shutil
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import tensorflow as tf
# pyrefly: ignore [missing-import]
from tensorflow.keras.applications import (
    MobileNetV2,
    EfficientNetB0,
    ResNet50
)
from tensorflow.keras.layers import (
    Dense,
    GlobalAveragePooling2D,
    Dropout
)
from tensorflow.keras.models import Model

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10
SEED = 42

def train_specific_model(
    name,
    model_class,
    preprocess_fn,
    train_dataset,
    val_dataset,
    class_names,
    img_size,
    epochs,
    models_dir
):
    print(f"\n{'=' * 40}")
    print(f"Training {name}")
    print(f"{'=' * 40}")

    # Data augmentation
    data_augmentation = tf.keras.Sequential([
        tf.keras.layers.RandomFlip(
            "horizontal",
            seed=SEED
        ),
        tf.keras.layers.RandomRotation(
            0.2,
            seed=SEED
        ),
        tf.keras.layers.RandomZoom(
            0.2,
            seed=SEED
        )
    ])

    # Load ImageNet pretrained model
    base_model = model_class(
        input_shape=img_size + (3,),
        include_top=False,
        weights="imagenet"
    )

    base_model.trainable = False

    # Build model
    inputs = tf.keras.Input(
        shape=img_size + (3,)
    )

    x = data_augmentation(inputs)
    x = preprocess_fn(x)
    x = base_model(x, training=False)
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.2)(x)

    outputs = Dense(len(class_names), activation="softmax")(x)

    model = Model(inputs, outputs)

    # Compile model
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    # Stop when validation loss stops improving
    early_stopping = tf.keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=3,
        restore_best_weights=True
    )

    model_filename = (f"{name.lower()}_disease_prediction_model.keras")

    model_path = os.path.join(models_dir, model_filename)

    # Save best model
    checkpoint = tf.keras.callbacks.ModelCheckpoint(
        model_path,
        monitor="val_loss",
        save_best_only=True
    )

    start_time = time.time()

    history = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=epochs,
        callbacks=[early_stopping,checkpoint]
    )

    training_time = time.time() - start_time

    # Evaluate best model
    best_model = tf.keras.models.load_model( model_path, compile=True)

    val_loss, val_accuracy = best_model.evaluate(val_dataset, verbose=0)

    # Get best validation result
    best_epoch = history.history["val_loss"].index(
        min(history.history["val_loss"])
    ) + 1

    best_val_loss = history.history["val_loss"][best_epoch - 1]
    best_val_accuracy = history.history["val_accuracy"][best_epoch - 1]
    train_accuracy = history.history["accuracy"][best_epoch - 1]

    print(f"\nBest Epoch: {best_epoch}")
    print(f"Validation Accuracy: {best_val_accuracy * 100:.2f}%")
    print(f"Validation Loss: {best_val_loss:.4f}")

    return {
        "name": name,
        "best_epoch": best_epoch,
        "train_accuracy": float(train_accuracy),
        "val_accuracy": float(val_accuracy),
        "val_loss": float(val_loss),
        "parameters": model.count_params(),
        "training_time": float(training_time),
        "model_path": model_path
    }


def build_and_train_model():

    BASE_DIR = os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
    DATASET_DIR = os.path.join(
        BASE_DIR,
        "dataset",
        "RiceLeafsDisease"
    )
    TRAIN_DIR = os.path.join(
        DATASET_DIR,
        "train"
    )

    VAL_DIR = os.path.join(
        DATASET_DIR,
        "validation"
    )
    MODELS_DIR = os.path.join(
        os.path.dirname(
            os.path.abspath(__file__)
        ),
        "models"
    )
    os.makedirs(
        MODELS_DIR,
        exist_ok=True
    )
    print("\nLoading datasets...")

    # Load training dataset
    train_dataset = (
        tf.keras.utils.image_dataset_from_directory(
            TRAIN_DIR,
            shuffle=True,
            seed=SEED,
            batch_size=BATCH_SIZE,
            image_size=IMG_SIZE
        )
    )

    # Validation data should not be shuffled
    val_dataset = (
        tf.keras.utils.image_dataset_from_directory(
            VAL_DIR,
            shuffle=False,
            batch_size=BATCH_SIZE,
            image_size=IMG_SIZE
        )
    )

    class_names = train_dataset.class_names

    print(f"Classes: {class_names}")

    # Save class names
    with open(
        os.path.join(MODELS_DIR, "disease_classes.json"), "w"
    ) as f:
        json.dump(
            class_names, f, indent=4
        )

    models_to_train = [
        {
            "name": "MobileNetV2",
            "model_class": MobileNetV2,
            "preprocess_fn":
                tf.keras.applications
                .mobilenet_v2
                .preprocess_input
        },
        {
            "name": "EfficientNetB0",
            "model_class": EfficientNetB0,
            "preprocess_fn":
                tf.keras.applications
                .efficientnet
                .preprocess_input
        },
        {
            "name": "ResNet50",
            "model_class": ResNet50,
            "preprocess_fn":
                tf.keras.applications
                .resnet50
                .preprocess_input
        }
    ]

    results = []

    # Train all three CNN models
    for model_config in models_to_train:

        result = train_specific_model(
            name=model_config["name"],
            model_class=model_config["model_class"],
            preprocess_fn=model_config["preprocess_fn"],
            train_dataset=train_dataset,
            val_dataset=val_dataset,
            class_names=class_names,
            img_size=IMG_SIZE,
            epochs=EPOCHS,
            models_dir=MODELS_DIR
        )

        results.append(result)

    print(f"\n{'=' * 40}")
    print("MODEL COMPARISON")
    print(f"{'=' * 40}")

    for result in results:
        print(f"\n{result['name']}")
        print(
            f"Validation Accuracy: "
            f"{result['val_accuracy'] * 100:.2f}%"
        )
        print(
            f"Validation Loss: "
            f"{result['val_loss']:.4f}"
        )
        print(
            f"Parameters: "
            f"{result['parameters']:,}"
        )
        print(
            f"Training Time: "
            f"{result['training_time']:.2f} seconds"
        )

    # Select best model
    best_model = max(
        results,
        key=lambda x: x["val_accuracy"]
    )

    print(f"\n{'=' * 40}")
    print("BEST MODEL")
    print(f"{'=' * 40}")

    print(f"Best model: {best_model['name']}")

    print(f"Validation Accuracy: " f"{best_model['val_accuracy'] * 100:.2f}%")

    # Copy best model for API
    source_model_path = best_model["model_path"]

    destination_model_path = os.path.join(
        MODELS_DIR,
        "disease_prediction_model.keras"
    )

    shutil.copy2(source_model_path, destination_model_path)

    print(
        f"Best model copied to: "
        f"{destination_model_path}"
    )

    # Save comparison results
    comparison_path = os.path.join(
        MODELS_DIR,
        "disease_model_comparison.json"
    )

    with open(
        comparison_path,
        "w"
    ) as f:
        json.dump(
            {
                "models": results,
                "best_model": best_model["name"]
            },
            f,
            indent=4
        )

    print(
        f"Comparison saved to: "
        f"{comparison_path}"
    )


if __name__ == "__main__":
    tf.random.set_seed(SEED)
    build_and_train_model()