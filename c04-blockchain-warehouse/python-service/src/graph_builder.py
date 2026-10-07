import torch
import numpy as np
from torch_geometric.data import HeteroData
from .database import fetch_all
from .features import compute_features

async def build_warehouse_graph() -> tuple[HeteroData, list[str]]:
    """
    Builds a heterogeneous graph of the warehouse network.

    Nodes:
      - warehouse: each PMB warehouse
    
    Node features (per warehouse):
      [0] total_events        — how many stock events recorded
      [1] inflow_ratio        — proportion of events that are INFLOWs
      [2] damage_ratio        — proportion of events that are DAMAGEs
      [3] utilization_pct     — current stock / capacity
      [4] avg_quantity        — average quantity per event
      [5] event_frequency     — events per day since creation
      [6] has_disaster        — 1 if any open disaster, 0 otherwise
      [7] redistribution_count — number of redistribution orders issued from this warehouse

    Edges:
      - redistribution flows between warehouses (source → destination)
    """

    # ── Fetch warehouses ──────────────────────────────────────────
    warehouses = await fetch_all("""
        SELECT id, capacityTons, createdAt, isActive
        FROM warehouses
        WHERE isActive = 1
    """)

    if not warehouses:
        data = HeteroData()
        data['warehouse'].x = torch.zeros((0, 8), dtype=torch.float)
        return data, []

    warehouse_ids  = [w['id'] for w in warehouses]
    warehouse_idx  = {wid: i for i, wid in enumerate(warehouse_ids)}
    n_warehouses   = len(warehouse_ids)

    # ── Fetch stock events ────────────────────────────────────────
    events = await fetch_all("""
        SELECT warehouseId, eventType, quantityTons, timestamp
        FROM stock_events
        WHERE warehouseId IN :ids
    """, {"ids": tuple(warehouse_ids) if len(warehouse_ids) > 1 else (warehouse_ids[0], warehouse_ids[0])})

    # ── Fetch open disasters ──────────────────────────────────────
    disasters = await fetch_all("""
        SELECT affectedWarehouseId
        FROM disaster_events
        WHERE status != 'RESOLVED'
          AND affectedWarehouseId IN :ids
    """, {"ids": tuple(warehouse_ids) if len(warehouse_ids) > 1 else (warehouse_ids[0], warehouse_ids[0])})

    disaster_set = {d['affectedWarehouseId'] for d in disasters}

    # ── Fetch redistribution orders ───────────────────────────────
    orders = await fetch_all("""
        SELECT sourceWarehouseId, destinationWarehouseId, quantityTons
        FROM redistribution_orders
        WHERE sourceWarehouseId IN :ids
    """, {"ids": tuple(warehouse_ids) if len(warehouse_ids) > 1 else (warehouse_ids[0], warehouse_ids[0])})

    # ── Build node features ───────────────────────────────────────
    features = np.zeros((n_warehouses, 8), dtype=np.float32)

    for wh in warehouses:
        i = warehouse_idx[wh['id']]
        wh_events = [e for e in events if e['warehouseId'] == wh['id']]
        redist_count = sum(1 for o in orders if o['sourceWarehouseId'] == wh['id'])

        features[i] = compute_features(
            warehouse=wh,
            events=wh_events,
            redistribution_count=redist_count,
            has_disaster=wh['id'] in disaster_set,
        )

    # ── Build edges (redistribution flows) ───────────────────────
    edge_src, edge_dst = [], []
    for order in orders:
        src = warehouse_idx.get(order['sourceWarehouseId'])
        dst = warehouse_idx.get(order['destinationWarehouseId'])
        if src is not None and dst is not None:
            edge_src.append(src)
            edge_dst.append(dst)

    # ── Assemble HeteroData ───────────────────────────────────────
    data = HeteroData()
    data['warehouse'].x = torch.tensor(features, dtype=torch.float)

    if edge_src:
        data['warehouse', 'redistributes_to', 'warehouse'].edge_index = torch.tensor(
            [edge_src, edge_dst], dtype=torch.long
        )
    else:
        data['warehouse', 'redistributes_to', 'warehouse'].edge_index = torch.zeros(
            (2, 0), dtype=torch.long
        )

    return data, warehouse_ids