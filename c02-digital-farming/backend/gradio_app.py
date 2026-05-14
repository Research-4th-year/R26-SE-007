# pyrefly: ignore [missing-import]
import gradio as gr
import tensorflow as tf
import numpy as np
import json
import os
# pyrefly: ignore [missing-import]
import cv2
import tempfile
import requests
from PIL import Image

import config
from gradcam import run_standard_gradcam, make_gradcam_heatmap, save_and_display_gradcam, get_img_array
from recommendation_engine import RecommendationEngine

# API Configuration
API_BASE_URL = "http://localhost:8000"

# Load Model for local disease inference (to keep Grad-CAM fast)
print(f"Loading Disease Model from {config.MODEL_SAVE_PATH}...")
try:
    model = tf.keras.models.load_model(config.MODEL_SAVE_PATH, compile=False)
except Exception as e:
    print(f"Failed to load disease model locally. Error: {e}")
    model = None

# Load Classes
try:
    with open(config.CLASSES_JSON_PATH, 'r') as f:
        class_indices = json.load(f)
        classes = {v: k for k, v in class_indices.items()}
except Exception as e:
    print(f"Failed to load classes. Error: {e}")
    classes = {0: "Bacterial Blight", 1: "Brown Spot", 2: "Healthy", 3: "Leaf Blast"}

engine = RecommendationEngine()

def get_metrics(model_type):
    try:
        response = requests.get(f"{API_BASE_URL}/metrics/{model_type}")
        if response.status_code == 200:
            data = response.json()
            if "error" in data:
                return "Metrics not available yet. Please train the model."
            
            if model_type == 'yield':
                return (f"### 📊 Model Reliability (Yield Regressor)\n"
                        f"- **RMSE:** {data.get('rmse', 'N/A')} kg/ha\n"
                        f"- **MAE:** {data.get('mae', 'N/A')} kg/ha\n"
                        f"- **R² Score:** {data.get('r2_score', 'N/A')}")
            else:
                return (f"### 📊 Model Reliability ({model_type.title()} Classifier)\n"
                        f"- **Accuracy:** {data.get('accuracy', 'N/A')}%\n"
                        f"- **Precision:** {data.get('precision', 'N/A')}%\n"
                        f"- **Recall:** {data.get('recall', 'N/A')}%\n"
                        f"- **F1-Score:** {data.get('f1_score', 'N/A')}%")
        return "Failed to fetch metrics."
    except:
        return "Backend API not reachable for metrics."

def predict_disease(image):
    if model is None:
        return "Model not loaded.", None, "Please train the model first."

    temp_dir = tempfile.mkdtemp()
    img_path = os.path.join(temp_dir, "temp_img.jpg")
    image.save(img_path)

    img_array = get_img_array(img_path, size=(config.IMG_HEIGHT, config.IMG_WIDTH))
    img_array = img_array / 255.0
    
    preds = model.predict(img_array)
    pred_idx = np.argmax(preds[0])
    confidence = float(preds[0][pred_idx])
    predicted_class = classes.get(pred_idx, "Unknown")
    
    conf_str = f"{confidence * 100:.2f}%"
    cam_output_path = os.path.join(temp_dir, "cam_output.jpg")
    
    last_conv_layer_name = None
    for layer in reversed(model.layers):
        if len(layer.output_shape) == 4:
            last_conv_layer_name = layer.name
            break
            
    heatmap_img = None
    try:
        if last_conv_layer_name:
            heatmap = make_gradcam_heatmap(img_array, model, last_conv_layer_name)
            heatmap_img = save_and_display_gradcam(img_path, heatmap, cam_path=cam_output_path)
        else:
            heatmap_img = image
    except Exception as e:
        heatmap_img = image
        
    rec = engine.get_recommendation(predicted_class, confidence)
    rec_text = f"### Diagnosis: {predicted_class} (Confidence: {conf_str})\n\n"
    rec_text += f"**Severity:** {rec.get('severity', 'Unknown')}\n\n"
    rec_text += "**🌱 Organic Treatments:**\n" + "\n".join([f"- {i}" for i in rec.get('organic_treatment', [])])
    rec_text += "\n\n**🧪 Chemical Treatments:**\n" + "\n".join([f"- {i}" for i in rec.get('chemical_treatment', [])])
    
    return predicted_class, heatmap_img, rec_text

def predict_variety(temp, hum, soil, rain, season):
    try:
        from auto_prediction import suggest_paddy_variety
        sensor_data = {"temperature": temp, "humidity": hum, "soil1": soil, "soil2": soil, "rain": 0 if rain == "Raining" else 1}
        variety = suggest_paddy_variety(sensor_data, season)
        
        from knowledge_base import VARIETIES
        v_info = VARIETIES.get(variety, {"description": "Optimized for your conditions."})
        
        res = f"### Recommended Variety: **{variety}**\n\n"
        res += f"**Description:** {v_info.get('description', '')}\n\n"
        res += f"**Ideal Season:** {v_info.get('season', season)}\n"
        res += f"**Maturity Period:** {v_info.get('maturity', '3 - 3.5 months')}\n"
        return res
    except Exception as e:
        return f"Error: {e}"

def predict_yield(n, p, k, temp, hum, rain_val):
    try:
        models_dir = os.path.join(os.path.dirname(__file__), "models")
        import joblib
        y_model = joblib.load(os.path.join(models_dir, "yield_model.pkl"))
        y_scaler = joblib.load(os.path.join(models_dir, "yield_scaler.pkl"))
        
        features = np.array([[n, p, k, temp, hum, rain_val]])
        features_scaled = y_scaler.transform(features)
        prediction = y_model.predict(features_scaled)[0]
        
        return f"### Predicted Yield: **{prediction:.2f} kg/ha**\n\nBased on your soil NPK and climatic parameters, this is the estimated harvest potential."
    except Exception as e:
        return f"Error: {e}"

# Define Gradio Interface
with gr.Blocks(title="Smart Paddy Intelligence Dashboard", theme=gr.themes.Soft()) as app:
    gr.Markdown("# 🌾 Smart Paddy Intelligence Dashboard")
    gr.Markdown("An all-in-one research-grade platform for Rice Disease Detection, Variety Recommendation, and Yield Prediction.")
    
    with gr.Tabs():
        # Tab 1: Disease Detection
        with gr.TabItem("🔍 Disease Detection"):
            with gr.Row():
                with gr.Column():
                    image_input = gr.Image(type="pil", label="Upload Leaf Image")
                    submit_btn = gr.Button("Analyze Leaf", variant="primary")
                    disease_metrics_md = gr.Markdown(get_metrics('disease'))
                    
                with gr.Column():
                    pred_label = gr.Label(label="Predicted Disease")
                    gradcam_output = gr.Image(type="pil", label="Explainable AI (Grad-CAM)")
                    rec_output = gr.Markdown(label="Treatment Recommendations")
            
            submit_btn.click(fn=predict_disease, inputs=[image_input], outputs=[pred_label, gradcam_output, rec_output])

        # Tab 2: Variety Recommendation
        with gr.TabItem("🌱 Variety Selection"):
            with gr.Row():
                with gr.Column():
                    v_temp = gr.Slider(15, 45, value=28, label="Temperature (°C)")
                    v_hum = gr.Slider(20, 100, value=75, label="Humidity (%)")
                    v_soil = gr.Slider(0, 100, value=50, label="Soil Moisture (%)")
                    v_rain = gr.Radio(["Dry", "Raining"], value="Dry", label="Current Weather")
                    v_season = gr.Radio(["Yala", "Maha"], value="Maha", label="Season")
                    variety_btn = gr.Button("Suggest Variety", variant="primary")
                    variety_metrics_md = gr.Markdown(get_metrics('variety'))
                
                with gr.Column():
                    variety_output = gr.Markdown("### Prediction will appear here...")
            
            variety_btn.click(fn=predict_variety, inputs=[v_temp, v_hum, v_soil, v_rain, v_season], outputs=[variety_output])

        # Tab 3: Yield Prediction
        with gr.TabItem("📈 Yield Estimation"):
            with gr.Row():
                with gr.Column():
                    y_n = gr.Number(label="Nitrogen (N)", value=40)
                    y_p = gr.Number(label="Phosphorus (P)", value=20)
                    y_k = gr.Number(label="Potassium (K)", value=20)
                    y_temp = gr.Slider(15, 45, value=28, label="Avg Temperature (°C)")
                    y_hum = gr.Slider(20, 100, value=75, label="Avg Humidity (%)")
                    y_rain = gr.Number(label="Expected Rainfall (mm)", value=150)
                    yield_btn = gr.Button("Predict Yield", variant="primary")
                    yield_metrics_md = gr.Markdown(get_metrics('yield'))
                
                with gr.Column():
                    yield_output = gr.Markdown("### Estimation will appear here...")
            
            yield_btn.click(fn=predict_yield, inputs=[y_n, y_p, y_k, y_temp, y_hum, y_rain], outputs=[yield_output])

if __name__ == "__main__":
    app.launch(share=False, server_name="0.0.0.0", server_port=7860)
