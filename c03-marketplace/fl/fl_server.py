import numpy as np


class FLServer:

    def federated_average(self, client_models):

        # EXTRACT WEIGHTS
        weights = np.array([
            client["weights"]
            for client in client_models
        ])

        # EXTRACT BIASES
        biases = np.array([
            client["bias"]
            for client in client_models
        ])

        # FEDERATED AVERAGING
        avg_weights = np.mean(weights, axis=0)
        avg_bias = np.mean(biases)

        return avg_weights, avg_bias