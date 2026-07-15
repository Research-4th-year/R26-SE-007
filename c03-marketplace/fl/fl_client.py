from sklearn.linear_model import SGDRegressor
import numpy as np

class FLClient:

    def __init__(self, X, y):
        self.X = X
        self.y = y

    def train(self, global_weights=None, global_bias=None):

        model = SGDRegressor(
            max_iter=1,
            learning_rate='constant',
            eta0=0.01,
            warm_start=True
        )

        # Initialize with global weights
        if global_weights is not None:
            model.coef_ = np.array(global_weights)
            model.intercept_ = np.array([global_bias])

        # Train locally
        model.partial_fit(np.array(self.X),np.array(self.y))

        return {
            "weights": model.coef_,
            "bias": model.intercept_[0]
        }