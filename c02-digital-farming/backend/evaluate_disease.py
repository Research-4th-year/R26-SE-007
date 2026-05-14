import os
import json
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    classification_report, confusion_matrix, cohen_kappa_score,
    roc_curve, auc, roc_auc_score
)
from tensorflow.keras.models import load_model

import config

def evaluate():
    print(f"Loading model from {config.MODEL_SAVE_PATH}...")
    if not os.path.exists(config.MODEL_SAVE_PATH):
        print("Model not found. Please train the model first.")
        return

    # Load the model without compiling since we only need it for inference
    model = load_model(config.MODEL_SAVE_PATH, compile=False)
    
    print(f"Loading validation data from {config.DATASETS_DIR}...")
    val_ds = tf.keras.utils.image_dataset_from_directory(
        config.DATASETS_DIR,
        validation_split=0.2,
        subset="validation",
        seed=config.SEED,
        image_size=(config.IMG_HEIGHT, config.IMG_WIDTH),
        batch_size=config.BATCH_SIZE,
        label_mode='categorical',
        shuffle=False # IMPORTANT for matching labels with predictions
    )
    
    class_names = val_ds.class_names
    num_classes = len(class_names)
    
    print("Generating predictions...")
    y_true_categorical = []
    y_pred_categorical = []
    
    for images, labels in val_ds:
        preds = model.predict(images, verbose=0)
        y_true_categorical.extend(labels.numpy())
        y_pred_categorical.extend(preds)
        
    y_true = np.argmax(y_true_categorical, axis=1)
    y_pred = np.argmax(y_pred_categorical, axis=1)
    
    # 1. Classification Report
    print("\n--- Classification Report ---")
    report = classification_report(y_true, y_pred, target_names=class_names)
    print(report)
    
    with open(os.path.join(config.OUTPUT_DIR, 'classification_report.txt'), 'w') as f:
        f.write(report)
        
    # 2. Cohen's Kappa
    kappa = cohen_kappa_score(y_true, y_pred)
    print(f"Cohen's Kappa Score: {kappa:.4f}")
    
    # 3. Confusion Matrix
    print("Generating Confusion Matrix Plot...")
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.title('Confusion Matrix')
    plt.ylabel('Actual Label')
    plt.xlabel('Predicted Label')
    plt.savefig(os.path.join(config.OUTPUT_DIR, 'confusion_matrix.png'))
    plt.close()
    
    # 4. ROC Curves and AUC
    print("Generating ROC Curves...")
    plt.figure(figsize=(10, 8))
    
    # Binarize outputs for multi-class ROC
    from sklearn.preprocessing import label_binarize
    y_true_bin = label_binarize(y_true, classes=range(num_classes))
    y_pred_np = np.array(y_pred_categorical)
    
    for i in range(num_classes):
        if num_classes == 2:
            # Handle binary case
            fpr, tpr, _ = roc_curve(y_true, y_pred_np[:, 1])
            roc_auc = auc(fpr, tpr)
            plt.plot(fpr, tpr, lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
            break
        else:
            fpr, tpr, _ = roc_curve(y_true_bin[:, i], y_pred_np[:, i])
            roc_auc = auc(fpr, tpr)
            plt.plot(fpr, tpr, lw=2, label=f'{class_names[i]} (AUC = {roc_auc:.2f})')
            
    plt.plot([0, 1], [0, 1], 'k--', lw=2)
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Multi-class ROC Curve')
    plt.legend(loc="lower right")
    plt.savefig(os.path.join(config.OUTPUT_DIR, 'roc_curve.png'))
    plt.close()
    
    # 5. Confidence Distribution
    print("Generating Confidence Distribution Plot...")
    confidences = np.max(y_pred_categorical, axis=1)
    plt.figure(figsize=(10, 6))
    sns.histplot(confidences, bins=20, kde=True)
    plt.title('Prediction Confidence Distribution')
    plt.xlabel('Confidence Score')
    plt.ylabel('Frequency')
    plt.savefig(os.path.join(config.OUTPUT_DIR, 'confidence_distribution.png'))
    plt.close()

    # 6. Save Metrics for UI
    from sklearn.metrics import precision_recall_fscore_support, accuracy_score
    
    acc = accuracy_score(y_true, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average='weighted')
    
    metrics = {
        "accuracy": round(acc * 100, 2),
        "precision": round(precision * 100, 2),
        "recall": round(recall * 100, 2),
        "f1_score": round(f1 * 100, 2),
        "cohen_kappa": round(kappa, 4)
    }
    
    metrics_path = os.path.join(os.path.dirname(config.MODEL_SAVE_PATH), 'disease_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=4)
    print(f"Metrics saved to {metrics_path}")

    print(f"Evaluation complete. Artifacts saved in {config.OUTPUT_DIR}")

if __name__ == "__main__":
    evaluate()
