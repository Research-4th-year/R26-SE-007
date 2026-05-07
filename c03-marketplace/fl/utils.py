import numpy as np

def aggregate_models(client_models):

    weights = np.mean(
        [client["weights"] for client in client_models],
        axis=0
    )

    bias = np.mean(
        [client["bias"] for client in client_models]
    )

    return weights, bias