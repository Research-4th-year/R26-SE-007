import pandas as pd

from preprocess import load_and_preprocess
from fl_client import FLClient
from fl_server import FLServer

# Load dataset
df = pd.read_csv("data/paddy_dataset.csv")

# SPLIT DATA INTO CLIENTS
client_1 = df[df['district'] == 'Ampara']
client_2 = df[df['district'] == 'Kandy']
client_3 = df[df['district'] == 'Badulla']
client_4 = df[df['district'] == 'Monaragala']

# Save clients (optional)
client_1.to_csv("clients/client_1.csv", index=False)
client_2.to_csv("clients/client_2.csv", index=False)
client_3.to_csv("clients/client_3.csv", index=False)
client_4.to_csv("clients/client_4.csv", index=False)

# Preprocess
X1, y1 = load_and_preprocess("clients/client_1.csv")
X2, y2 = load_and_preprocess("clients/client_2.csv")
X3, y3 = load_and_preprocess("clients/client_3.csv")
X4, y4 = load_and_preprocess("clients/client_4.csv")

# Create clients
client1 = FLClient(X1, y1)
client2 = FLClient(X2, y2)
client3 = FLClient(X3, y3)
client4 = FLClient(X4, y4)

# Local Training
w1 = client1.train()
w2 = client2.train()
w3 = client3.train()
w4 = client4.train()

# Server Aggregation
server = FLServer()

global_weights, global_bias = server.federated_average([
    w1,
    w2,
    w3,
    w4
])

print("\nGLOBAL MODEL")
print("Weights:", global_weights)
print("Bias:", global_bias)