import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GATConv


class WarehouseGAT(nn.Module):
    """
    Graph Attention Network for warehouse anomaly detection.
    
    Takes warehouse node features and graph structure as input.
    Outputs a reliability score (0-1) per warehouse node.
    
    0.0 = highly anomalous / unreliable
    1.0 = normal / reliable
    """

    def __init__(
        self,
        in_channels: int = 8,
        hidden_channels: int = 16,
        out_channels: int = 8,
        heads: int = 4,
        dropout: float = 0.3,
    ):
        super().__init__()

        # Layer 1: multi-head attention
        self.conv1 = GATConv(
            in_channels,
            hidden_channels,
            heads=heads,
            dropout=dropout,
            add_self_loops=True,
        )

        # Layer 2: single-head attention
        self.conv2 = GATConv(
            hidden_channels * heads,
            out_channels,
            heads=1,
            concat=False,
            dropout=dropout,
            add_self_loops=True,
        )

        # Final MLP: node embedding → reliability score
        self.classifier = nn.Sequential(
            nn.Linear(out_channels, 8),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(8, 1),
            nn.Sigmoid(),   # output in [0, 1]
        )

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        # Layer 1
        x = self.conv1(x, edge_index)
        x = F.elu(x)
        x = F.dropout(x, p=0.3, training=self.training)

        # Layer 2
        x = self.conv2(x, edge_index)
        x = F.elu(x)

        # Reliability score per node
        score = self.classifier(x)
        return score.squeeze(-1)   # shape: [n_warehouses]