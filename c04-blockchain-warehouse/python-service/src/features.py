"""
Pure feature computation for the warehouse GAT.

Separated from graph_builder so the eight-feature vector can be unit tested
without a database connection.
"""
from datetime import datetime, timezone
from typing import Iterable, Mapping, Sequence

FEATURE_NAMES = [
    "total_events",
    "inflow_ratio",
    "damage_ratio",
    "utilization_pct",
    "avg_quantity",
    "event_frequency",
    "has_disaster",
    "redistribution_count",
]

OUTFLOW_TYPES = ("OUTFLOW", "REDISTRIBUTION", "DAMAGE", "ADJUSTMENT")


def compute_features(
    warehouse: Mapping,
    events: Sequence[Mapping],
    redistribution_count: int,
    has_disaster: bool,
    now: datetime | None = None,
) -> list[float]:
    """
    Build the 8-element normalised feature vector for one warehouse.

    All values are clamped to [0, 1] so no single feature dominates
    gradient updates by magnitude alone.
    """
    now = now or datetime.now(timezone.utc)
    f = [0.0] * 8

    total = len(events)
    if total > 0:
        inflows = sum(1 for e in events if e["eventType"] == "INFLOW")
        damages = sum(1 for e in events if e["eventType"] == "DAMAGE")
        avg_qty = sum(float(e["quantityTons"]) for e in events) / total

        created = warehouse["createdAt"]
        if hasattr(created, "replace"):
            created = created.replace(tzinfo=timezone.utc) if created.tzinfo is None else created
        days_active = max(1, (now - created).days)

        f[0] = min(total / 100.0, 1.0)
        f[1] = inflows / total
        f[2] = damages / total
        f[4] = min(avg_qty / 500.0, 1.0)
        f[5] = min(total / days_active / 10.0, 1.0)

    capacity = float(warehouse["capacityTons"]) if warehouse["capacityTons"] else 1.0
    inflow_total = sum(
        float(e["quantityTons"]) for e in events if e["eventType"] == "INFLOW"
    )
    outflow_total = sum(
        float(e["quantityTons"]) for e in events if e["eventType"] in OUTFLOW_TYPES
    )
    current_stock = max(0.0, inflow_total - outflow_total)
    f[3] = min(current_stock / capacity, 1.0)

    f[6] = 1.0 if has_disaster else 0.0
    f[7] = min(redistribution_count / 10.0, 1.0)

    return f