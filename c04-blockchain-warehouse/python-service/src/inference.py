import torch
import os
from .model import WarehouseGAT
from .graph_builder import build_warehouse_graph

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "gat_model.pt")


def load_model() -> WarehouseGAT:
    model = WarehouseGAT(in_channels=8, hidden_channels=16, out_channels=8, heads=4)
    if os.path.exists(MODEL_PATH):
        model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu", weights_only=True))
        print(f"✅ GNN model loaded from {MODEL_PATH}")
    else:
        print(f"⚠️  No model found at {MODEL_PATH} — using untrained model (scores will be ~0.5)")
    model.eval()
    return model


# Global model instance — loaded once at startup
_model: WarehouseGAT | None = None


def get_model() -> WarehouseGAT:
    global _model
    if _model is None:
        _model = load_model()
    return _model


async def compute_scores() -> list[dict]:
    """
    Builds the live warehouse graph from MySQL data,
    runs GNN inference, and returns per-warehouse reliability scores.
    """
    model = get_model()

    graph, warehouse_ids = await build_warehouse_graph()

    if not warehouse_ids:
        return []

    x          = graph['warehouse'].x
    edge_index = graph['warehouse', 'redistributes_to', 'warehouse'].edge_index

    with torch.no_grad():
        scores = model(x, edge_index)

    results = []
    for i, wh_id in enumerate(warehouse_ids):
        score = float(scores[i].item())
        score = max(0.0, min(1.0, score))  # clamp to [0, 1]

        # Flag anomalies — score below 0.4 is suspicious
        anomaly_flags = []
        features = x[i]
        if features[2].item() > 0.3:
            anomaly_flags.append("HIGH_DAMAGE_RATIO")
        if features[1].item() > 0.8 and features[3].item() < 0.1:
            anomaly_flags.append("CAPACITY_OVERCLAIM_SUSPECTED")
        if features[7].item() > 0.6:
            anomaly_flags.append("UNUSUAL_REDISTRIBUTION_FREQUENCY")

        results.append({
            "warehouseId":      wh_id,
            "reliabilityScore": round(score, 4),
            "anomalyFlags":     anomaly_flags,
            "isAnomalous":      score < 0.4,
        })

    return results