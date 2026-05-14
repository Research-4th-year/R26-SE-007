import tensorflow as tf
import os
import config

def representative_data_gen():
    """
    Generator function for INT8 quantization.
    We need to provide a small representative dataset so TFLite can calibrate
    the dynamic range of activations.
    """
    dataset = tf.keras.utils.image_dataset_from_directory(
        config.DATASETS_DIR,
        validation_split=0.2,
        subset="validation",
        seed=config.SEED,
        image_size=(config.IMG_HEIGHT, config.IMG_WIDTH),
        batch_size=1
    )
    
    # Take 100 samples for calibration
    for input_value, _ in dataset.take(100):
        # Preprocessing matching training (Rescaling)
        # Note: In hybrid model, rescaling is the first layer, so we can just pass the raw input 
        # IF the TFLite model includes the Rescaling layer.
        yield [input_value]

def export_tflite():
    print(f"Loading Keras model from {config.MODEL_SAVE_PATH}")
    if not os.path.exists(config.MODEL_SAVE_PATH):
        print("Model file not found. Train the model first.")
        return
        
    model = tf.keras.models.load_model(config.MODEL_SAVE_PATH, compile=False)
    
    # 1. Standard FP32 TFLite Export
    print("\n--- Exporting Standard FP32 TFLite Model ---")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    # Enable TF ops in case some layers need it
    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS, 
        tf.lite.OpsSet.SELECT_TF_OPS
    ]
    tflite_model_fp32 = converter.convert()
    
    tflite_path_fp32 = config.TFLITE_MODEL_PATH
    with open(tflite_path_fp32, 'wb') as f:
        f.write(tflite_model_fp32)
    print(f"Saved FP32 TFLite model to: {tflite_path_fp32}")
    
    # 2. INT8 Quantized TFLite Export (Best for Mobile/Edge TPU)
    print("\n--- Exporting INT8 Quantized TFLite Model ---")
    converter_quant = tf.lite.TFLiteConverter.from_keras_model(model)
    converter_quant.optimizations = [tf.lite.Optimize.DEFAULT]
    converter_quant.representative_dataset = representative_data_gen
    # Ensure fully quantized
    converter_quant.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    converter_quant.inference_input_type = tf.uint8  # or tf.int8
    converter_quant.inference_output_type = tf.uint8 # or tf.int8
    
    try:
        tflite_model_quant = converter_quant.convert()
        tflite_path_quant = config.TFLITE_MODEL_PATH.replace(".tflite", "_quantized.tflite")
        with open(tflite_path_quant, 'wb') as f:
            f.write(tflite_model_quant)
        print(f"Saved Quantized TFLite model to: {tflite_path_quant}")
    except Exception as e:
        print(f"Quantization failed (often due to missing representative data or unsupported ops for INT8): {e}")

if __name__ == "__main__":
    export_tflite()
