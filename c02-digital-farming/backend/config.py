import os

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(os.path.dirname(BASE_DIR), 'datasets', 'rice_leaf_disease')
MODELS_DIR = os.path.join(BASE_DIR, 'models')
LOGS_DIR = os.path.join(BASE_DIR, 'logs')
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')

# Ensure directories exist
for d in [MODELS_DIR, LOGS_DIR, OUTPUT_DIR]:
    os.makedirs(d, exist_ok=True)

# Image parameters
IMG_HEIGHT = 224
IMG_WIDTH = 224
CHANNELS = 3
INPUT_SHAPE = (IMG_HEIGHT, IMG_WIDTH, CHANNELS)

# Training hyperparameters
BATCH_SIZE = 32
INITIAL_EPOCHS = 20
FINE_TUNE_EPOCHS = 30
TOTAL_EPOCHS = INITIAL_EPOCHS + FINE_TUNE_EPOCHS

INITIAL_LEARNING_RATE = 1e-3
FINE_TUNE_LEARNING_RATE = 1e-4

# Model parameters
DROPOUT_RATE = 0.6
L2_REGULARIZATION = 1e-4

# Seed for reproducibility
SEED = 42

# Data Augmentation parameters
ROTATION_RANGE = 0.2
ZOOM_RANGE = 0.2
WIDTH_SHIFT = 0.1
HEIGHT_SHIFT = 0.1

# Paths for saved files
MODEL_SAVE_PATH = os.path.join(MODELS_DIR, 'disease_hybrid_model.keras')
CLASSES_JSON_PATH = os.path.join(MODELS_DIR, 'disease_classes.json')
TFLITE_MODEL_PATH = os.path.join(MODELS_DIR, 'disease_hybrid_model.tflite')
RECOMMENDATION_DB_PATH = os.path.join(BASE_DIR, 'recommendations.json')
