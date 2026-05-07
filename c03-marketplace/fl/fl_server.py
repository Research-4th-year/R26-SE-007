import numpy as np

class FLServer:

    def federated_average(self, client_weights):

        weights = np.array([cw[0] for cw in client_weights])
        biases = np.array([cw[1] for cw in client_weights])

        avg_weights = np.mean(weights, axis=0)
        avg_bias = np.mean(biases)

        return avg_weights, avg_bias