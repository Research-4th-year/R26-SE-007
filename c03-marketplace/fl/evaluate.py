from sklearn.metrics import mean_absolute_error
from sklearn.linear_model import LinearRegression

from preprocess import load_and_preprocess

# Load all data
X, y = load_and_preprocess("data/paddy_dataset.csv")

# Centralized model
model = LinearRegression()

model.fit(X, y)

predictions = model.predict(X)

mae = mean_absolute_error(y, predictions)

print("Mean Absolute Error:", mae)