import os
import pickle

from global_preprocessing import preprocess_global_dataset
from fl_client import FLClient
from fl_server import FLServer


# =========================
# GLOBAL PREPROCESSING
# =========================

df, X, y = preprocess_global_dataset()

# =========================
# SPLIT CLIENTS
# =========================

client1_idx = df[df['district'] == 0].index
client2_idx = df[df['district'] == 1].index
client3_idx = df[df['district'] == 2].index
client4_idx = df[df['district'] == 3].index

# =========================
# CLIENT DATA
# =========================

X1, y1 = X[client1_idx], y.iloc[client1_idx]
X2, y2 = X[client2_idx], y.iloc[client2_idx]
X3, y3 = X[client3_idx], y.iloc[client3_idx]
X4, y4 = X[client4_idx], y.iloc[client4_idx]

# =========================
# CREATE CLIENTS
# =========================

client1 = FLClient(X1, y1)
client2 = FLClient(X2, y2)
client3 = FLClient(X3, y3)
client4 = FLClient(X4, y4)

clients = [
    client1,
    client2,
    client3,
    client4
]


# =========================
# CREATE SERVER
# =========================

server = FLServer()


# =========================
# INITIAL GLOBAL MODEL
# =========================

global_weights = None
global_bias = 0


# =========================
# FEDERATED ROUNDS
# =========================

ROUNDS = 5

for round_num in range(ROUNDS):

    print(f"\n========== ROUND {round_num + 1} ==========")

    client_models = []

    # =========================
    # LOCAL CLIENT TRAINING
    # =========================

    for i, client in enumerate(clients):

        model = client.train(
            global_weights,
            global_bias
        )

        print(f"\nClient {i+1} Weights:")
        print(model["weights"])

        client_models.append(model)

    # =========================
    # SERVER AGGREGATION
    # =========================

    global_weights, global_bias = server.federated_average(
        client_models
    )

    print("\nGLOBAL MODEL UPDATED")

    print("Weights:", global_weights)
    print("Bias:", global_bias)


# =========================
# SAVE GLOBAL MODEL
# =========================

os.makedirs("models", exist_ok=True)

with open("models/global_model.pkl", "wb") as f:

    pickle.dump({
        "weights": global_weights,
        "bias": global_bias
    }, f)

print("\nFINAL GLOBAL MODEL SAVED")