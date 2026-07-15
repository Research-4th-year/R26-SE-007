"""
Training script for the warehouse GNN.

Generates synthetic warehouse data with known anomalies,
trains the GAT model, and saves weights to models/gat_model.pt

Run from python-service/ with venv active:
  python -m src.train
"""

import torch
import torch.nn as nn
import numpy as np
from torch_geometric.data import Data
from .model import WarehouseGAT


def generate_synthetic_data(n_warehouses: int = 20, n_anomalies: int = 4) -> tuple[Data, torch.Tensor]:
    """
    Generates a synthetic warehouse network with known anomalies.
    
    Normal warehouses:
      - Balanced inflow/outflow ratios
      - Low damage ratios
      - Moderate utilization
    
    Anomalous warehouses (suspicious patterns):
      - Very high damage ratios (claiming excessive losses)
      - Unusual utilization spikes
      - High redistribution frequency (gaming the system)
    """
    torch.manual_seed(42)
    np.random.seed(42)

    features = np.zeros((n_warehouses, 8), dtype=np.float32)
    labels   = np.zeros(n_warehouses, dtype=np.float32)

    # Normal warehouses
    for i in range(n_warehouses - n_anomalies):
        features[i, 0] = np.random.uniform(0.1, 0.6)   # total_events
        features[i, 1] = np.random.uniform(0.4, 0.7)   # inflow_ratio  (balanced)
        features[i, 2] = np.random.uniform(0.0, 0.05)  # damage_ratio  (low)
        features[i, 3] = np.random.uniform(0.2, 0.7)   # utilization
        features[i, 4] = np.random.uniform(0.1, 0.4)   # avg_quantity
        features[i, 5] = np.random.uniform(0.1, 0.3)   # event_frequency
        features[i, 6] = np.random.uniform(0.0, 0.1)   # has_disaster
        features[i, 7] = np.random.uniform(0.0, 0.2)   # redistribution_count
        labels[i] = 1.0  # reliable

    # Anomalous warehouses (last n_anomalies)
    for i in range(n_warehouses - n_anomalies, n_warehouses):
        anomaly_type = i % 3

        if anomaly_type == 0:
            # Pattern: excessively high damage claims
            features[i, 0] = np.random.uniform(0.3, 0.8)
            features[i, 1] = np.random.uniform(0.1, 0.3)
            features[i, 2] = np.random.uniform(0.3, 0.7)  # HIGH damage ratio
            features[i, 3] = np.random.uniform(0.1, 0.3)
            features[i, 6] = 1.0                           # always in disaster

        elif anomaly_type == 1:
            # Pattern: capacity over-claiming (high inflow, suspiciously low utilization)
            features[i, 0] = np.random.uniform(0.6, 1.0)
            features[i, 1] = np.random.uniform(0.8, 1.0)  # almost all inflow
            features[i, 3] = np.random.uniform(0.0, 0.1)  # but very low utilization
            features[i, 5] = np.random.uniform(0.7, 1.0)  # high frequency

        else:
            # Pattern: collusive redistribution (always redistributing to same warehouse)
            features[i, 7] = np.random.uniform(0.7, 1.0)  # very high redistribution
            features[i, 5] = np.random.uniform(0.6, 1.0)
            features[i, 2] = np.random.uniform(0.1, 0.3)

        labels[i] = 0.0  # unreliable

    # Random edges (redistribution flows)
    n_edges  = n_warehouses * 2
    src      = np.random.randint(0, n_warehouses, n_edges)
    dst      = np.random.randint(0, n_warehouses, n_edges)
    mask     = src != dst
    src, dst = src[mask], dst[mask]

    data = Data(
        x          = torch.tensor(features, dtype=torch.float),
        edge_index = torch.tensor([src, dst], dtype=torch.long),
        y          = torch.tensor(labels, dtype=torch.float),
    )
    return data, torch.tensor(labels, dtype=torch.float)


def train():
    print("🧠 Training warehouse GNN anomaly detector...")

    data, labels = generate_synthetic_data(n_warehouses=30, n_anomalies=6)

    model     = WarehouseGAT(in_channels=8, hidden_channels=16, out_channels=8, heads=4)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01, weight_decay=5e-4)
    criterion = nn.BCELoss()

    model.train()
    for epoch in range(200):
        optimizer.zero_grad()
        out  = model(data.x, data.edge_index)
        loss = criterion(out, labels)
        loss.backward()
        optimizer.step()

        if (epoch + 1) % 50 == 0:
            with torch.no_grad():
                preds    = (out > 0.5).float()
                accuracy = (preds == labels).float().mean().item()
            print(f"  Epoch {epoch+1:3d} | Loss: {loss.item():.4f} | Accuracy: {accuracy:.2%}")

    # Save model
    import os
    os.makedirs("models", exist_ok=True)
    torch.save(model.state_dict(), "models/gat_model.pt")
    print("✅ Model saved to models/gat_model.pt")

    return model


if __name__ == "__main__":
    train()