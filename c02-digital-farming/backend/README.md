# Intelligent Agriculture System: Hybrid Deep Learning Pipeline

This repository contains a state-of-the-art hybrid deep learning pipeline designed for agricultural computer vision, specifically tailored for rice leaf disease detection. It upgrades a standard CNN/MobileNetV2 implementation into a research-grade system suitable for academic publication and real-world edge deployment.

## Research Methodology & Architectural Improvements

### 1. Hybrid CNN Architecture
We combine **MobileNetV2** and **InceptionV3** using feature-level concatenation. 
- **MobileNetV2**: Excels at extracting fine-grained, lightweight spatial features efficiently (depthwise separable convolutions).
- **InceptionV3**: Captures multi-scale features through its inception modules, enabling the model to recognize disease patterns of varying sizes and aspects.

**Why this matters**: Single-architecture models often struggle with the extreme intra-class variation and inter-class similarity found in agricultural diseases. The hybrid approach captures both local textures (MobileNet) and global shapes (Inception).

#### Architecture Diagram
```text
Input Image (224x224x3)
       |
  [Rescaling & Augmentation]
       |
  +----+----+
  |         |
MobileNetV2 InceptionV3 (Base Layers Frozen initially)
  |         |
GlobalAvgPool GlobalAvgPool
  |         |
  +----+----+
       |
[Feature Concatenation]
       |
BatchNormalization -> Dense(512, L2) -> ReLU -> Dropout(0.6)
       |
BatchNormalization -> Dense(256, L2) -> ReLU -> Dropout(0.3)
       |
Dense(num_classes, Softmax) -> [Prediction]
```

### 2. Advanced Training Pipeline
- **Staged Training**: The base models are initially frozen while the custom classification head is trained. In Phase 2, the top 40 layers of both base models are unfreezed for fine-tuning with a lower learning rate.
- **Cosine Decay Learning Rate**: Prevents the model from getting stuck in local minima by smoothly decaying the learning rate.
- **Mixed Precision Training**: Utilizes `float16` for activations to speed up training on compatible GPUs while maintaining `float32` for variables and the output layer for stability.
- **Advanced Augmentation**: Incorporates Random Contrast, Brightness, Gaussian Noise, and geometric transformations. A placeholder for CLAHE and lighting simulation is provided for extreme real-world variations.

### 3. Evaluation & Explainable AI (XAI)
- **Metrics**: Accuracy, Precision, Recall, F1-Score, Cohen's Kappa, and multi-class AUC-ROC.
- **Grad-CAM**: Generates heatmaps visualizing the regions the model focuses on, building trust with farmers and agricultural experts.

### 4. Smart Recommendation Engine
Maps predicted diseases (with confidence scores) to actionable organic and chemical treatments specifically curated for Sri Lankan agricultural practices.

### 5. Deployment Optimization
Scripts provided to export the trained `.keras` model to:
- **TFLite (FP32)**: For standard mobile inference.
- **TFLite (INT8 Quantized)**: For Edge TPUs and highly constrained IoT devices (reduces model size by ~4x with minimal accuracy loss).

---

## How to Run

### 1. Setup Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Train the Model
Configure hyperparameters in `config.py`, then run:
```bash
python train_disease_hybrid.py
```

### 3. Evaluate the Model
Generates ROC curves, Confusion Matrix, and Classification reports in the `output/` folder:
```bash
python evaluate_disease.py
```

### 4. Run the User Interface (Gradio)
Launch the interactive web application for real-time inference and XAI:
```bash
python gradio_app.py
```

### 5. Export to Edge (TFLite)
```bash
python export_to_edge.py
```

---

## Future Research Opportunities
Beyond this implementation, researchers can explore:
1. **Vision Transformers (ViTs)**: Replace CNN backbones with Swin Transformers for better global context understanding.
2. **Self-Supervised Learning**: Use unannotated field images with frameworks like DINO or SimCLR before fine-tuning on the disease dataset.
3. **Federated Learning**: Train models across multiple edge devices (farmers' phones) without centralizing sensitive farm data.
4. **Multimodal AI**: Combine image data with real-time IoT sensor data (soil moisture, NPK, weather) to predict disease outbreaks *before* visual symptoms appear.
