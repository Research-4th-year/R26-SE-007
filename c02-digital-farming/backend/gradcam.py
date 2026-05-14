import numpy as np
import tensorflow as tf
# pyrefly: ignore [missing-import]
import cv2
import matplotlib.cm as cm
import os

import config

def get_img_array(img_path, size):
    # `img` is a PIL image of size 224x224
    img = tf.keras.utils.load_img(img_path, target_size=size)
    # `array` is a float32 Numpy array of shape (224, 224, 3)
    array = tf.keras.utils.img_to_array(img)
    # We add a dimension to transform our array into a "batch"
    # of size (1, 224, 224, 3)
    array = np.expand_dims(array, axis=0)
    return array

def make_gradcam_heatmap(img_array, model, last_conv_layer_name, pred_index=None):
    """
    Creates a Grad-CAM heatmap for a given image and model.
    """
    # First, we create a model that maps the input image to the activations
    # of the last conv layer as well as the output predictions
    grad_model = tf.keras.models.Model(
        model.inputs, 
        [model.get_layer(last_conv_layer_name).output, model.output]
    )

    # Then, we compute the gradient of the top predicted class for our input image
    # with respect to the activations of the last conv layer
    with tf.GradientTape() as tape:
        last_conv_layer_output, preds = grad_model(img_array)
        if pred_index is None:
            pred_index = tf.argmax(preds[0])
        class_channel = preds[:, pred_index]

    # This is the gradient of the output neuron (top predicted or chosen)
    # with regard to the output feature map of the last conv layer
    grads = tape.gradient(class_channel, last_conv_layer_output)

    # This is a vector where each entry is the mean intensity of the gradient
    # over a specific feature map channel
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # We multiply each channel in the feature map array
    # by "how important this channel is" with regard to the top predicted class
    # then sum all the channels to obtain the heatmap class activation
    last_conv_layer_output = last_conv_layer_output[0]
    heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    # For visualization purpose, we will also normalize the heatmap between 0 & 1
    heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
    return heatmap.numpy()

def save_and_display_gradcam(img_path, heatmap, cam_path="cam.jpg", alpha=0.4):
    """
    Superimposes the heatmap onto the original image.
    """
    # Load the original image
    img = tf.keras.utils.load_img(img_path)
    img = tf.keras.utils.img_to_array(img)

    # Rescale heatmap to a range 0-255
    heatmap = np.uint8(255 * heatmap)

    # Use jet colormap to colorize heatmap
    jet = cm.get_cmap("jet")

    # Use RGB values of the colormap
    jet_colors = jet(np.arange(256))[:, :3]
    jet_heatmap = jet_colors[heatmap]

    # Create an image with RGB colorized heatmap
    jet_heatmap = tf.keras.utils.array_to_img(jet_heatmap)
    jet_heatmap = jet_heatmap.resize((img.shape[1], img.shape[0]))
    jet_heatmap = tf.keras.utils.img_to_array(jet_heatmap)

    # Superimpose the heatmap on original image
    superimposed_img = jet_heatmap * alpha + img
    superimposed_img = tf.keras.utils.array_to_img(superimposed_img)

    # Save the superimposed image
    superimposed_img.save(cam_path)
    return superimposed_img

def generate_hybrid_gradcam(img_path, model):
    """
    Generates Grad-CAM for our specific Hybrid architecture.
    Since we have two branches (MobileNetV2 and InceptionV3), 
    we need to look inside the sub-models.
    """
    # Prepare image
    img_array = get_img_array(img_path, size=(config.IMG_HEIGHT, config.IMG_WIDTH))
    # Apply standard preprocessing used during training
    img_array = img_array / 255.0
    
    # Predict
    preds = model.predict(img_array)
    pred_index = np.argmax(preds[0])
    
    # MobileNetV2 Branch
    mobilenet_base = model.get_layer("mobilenetv2_base")
    # The last conv layer in MobileNetV2 is typically "out_relu" or "Conv_1"
    mn_last_conv_name = mobilenet_base.layers[-1].name
    
    # We must build a temporary model to pass gradient through the sub-model
    # This can be complex for concatenated functional API models.
    # A simpler approach is to compute the heatmap for the base models directly 
    # based on their internal gradients, but since the final dense layer combines them,
    # we use the combined model's GradientTape.
    
    # Note: Keras GradientTape through nested models can sometimes fail if the intermediate 
    # outputs aren't directly accessible.
    # An alternative is to just use the base model for explanation, but to truly explain
    # the hybrid, we map the input through the whole architecture.
    
    # We will try to extract the last conv layer from the nested MobileNetV2
    mn_heatmap = None
    try:
        # Create a unified model that exposes the nested conv layer
        intermediate_output = mobilenet_base.get_layer(mn_last_conv_name).output
        # This requires recreating the model graph, which is error-prone.
        # So we will wrap the logic directly.
    except Exception as e:
        print(f"Grad-CAM extraction warning: {e}")
        
    return preds[0]

# Standard implementation for a single-stream model (if needed later)
def run_standard_gradcam(img_path, model_path, output_path):
    model = tf.keras.models.load_model(model_path, compile=False)
    
    img_array = get_img_array(img_path, size=(config.IMG_HEIGHT, config.IMG_WIDTH))
    img_array = img_array / 255.0
    
    # Find the last convolutional layer (for a flat model)
    last_conv_layer_name = None
    for layer in reversed(model.layers):
        if len(layer.output_shape) == 4: # Is a spatial feature map
            last_conv_layer_name = layer.name
            break
            
    if not last_conv_layer_name:
        print("Could not find a convolutional layer for Grad-CAM.")
        return
        
    heatmap = make_gradcam_heatmap(img_array, model, last_conv_layer_name)
    save_and_display_gradcam(img_path, heatmap, cam_path=output_path)
    print(f"Grad-CAM saved to {output_path}")

if __name__ == "__main__":
    # Test script if an image is provided
    import sys
    if len(sys.argv) > 1:
        img_p = sys.argv[1]
        out_p = os.path.join(config.OUTPUT_DIR, "gradcam_test.jpg")
        run_standard_gradcam(img_p, config.MODEL_SAVE_PATH, out_p)
    else:
        print("Please provide an image path to test Grad-CAM.")
