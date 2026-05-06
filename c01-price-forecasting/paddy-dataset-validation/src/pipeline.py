import pandas as pd

from cleaning import clean_data

from validation.structure_validation import validate_structure
from validation.missing_validation import check_missing
from validation.consistency_validation import validate_prices
from validation.feature_validation import validate_features, validate_lag_features
from validation.temporal_validation import validate_temporal
from validation.season_validation import validate_season
from validation.outlier_validation import detect_outliers
from validation.statistical_validation import statistical_checks

print("\n========== FINAL DATASET VALIDATION PIPELINE ==========")

# Load
df = pd.read_csv("data/final/final_paddy_dataset.csv")

# Structure
df = validate_structure(df)

# Clean
df = clean_data(df)

# Missing
check_missing(df)

# Consistency
validate_prices(df)

# Feature validation
validate_features(df)

# Lag Feature Validation
# validate_lag_features(df)

# Temporal
validate_temporal(df)

# Seasonal validation
validate_season(df)

# Outliers
detect_outliers(df)

# Statistical
statistical_checks(df)

# Save cleaned version
df.to_csv("data/final/validated_dataset.csv", index=False)

print("\n[FINAL] Dataset validated successfully ✅")
print("=====================================================")