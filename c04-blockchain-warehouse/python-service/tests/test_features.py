from datetime import datetime, timedelta, timezone
import pytest
from src.features import compute_features, FEATURE_NAMES

NOW = datetime(2026, 8, 30, tzinfo=timezone.utc)


def warehouse(capacity=500, days_old=100):
    return {
        "id": "wh-1",
        "capacityTons": capacity,
        "createdAt": NOW - timedelta(days=days_old),
    }


def event(kind, qty):
    return {"eventType": kind, "quantityTons": qty}


class TestNormalisationInvariants:
    def test_all_features_bounded_zero_to_one(self):
        f = compute_features(
            warehouse(),
            [event("INFLOW", 400)] * 50 + [event("DAMAGE", 100)] * 30,
            redistribution_count=5, has_disaster=True, now=NOW,
        )
        assert all(0.0 <= v <= 1.0 for v in f), f

    def test_extreme_values_clamp_rather_than_overflow(self):
        f = compute_features(
            warehouse(capacity=1),
            [event("INFLOW", 999_999)] * 5_000,
            redistribution_count=99_999, has_disaster=True, now=NOW,
        )
        assert all(v <= 1.0 for v in f), f

    def test_vector_length_matches_model_input(self):
        f = compute_features(warehouse(), [], 0, False, now=NOW)
        assert len(f) == 8 == len(FEATURE_NAMES)


class TestEmptyAndDegenerateInputs:
    def test_warehouse_with_no_events_yields_zero_vector(self):
        """New warehouses have no behavioural history — all zeros is correct."""
        f = compute_features(warehouse(), [], 0, False, now=NOW)
        assert f == [0.0] * 8

    def test_no_division_by_zero_when_event_count_is_zero(self):
        f = compute_features(warehouse(), [], 0, False, now=NOW)
        assert not any(v != v for v in f)  # NaN check

    def test_zero_capacity_does_not_divide_by_zero(self):
        f = compute_features(
            warehouse(capacity=0), [event("INFLOW", 100)], 0, False, now=NOW
        )
        assert not any(v != v for v in f)

    def test_warehouse_created_today_avoids_zero_day_division(self):
        wh = {"id": "wh-1", "capacityTons": 500, "createdAt": NOW}
        f = compute_features(wh, [event("INFLOW", 50)], 0, False, now=NOW)
        assert f[5] > 0 and f[5] <= 1.0


class TestFraudSignals:
    def test_damage_ratio_reflects_proportion_of_damage_events(self):
        events = [event("DAMAGE", 50)] * 3 + [event("INFLOW", 100)] * 7
        f = compute_features(warehouse(), events, 0, False, now=NOW)
        assert f[2] == pytest.approx(0.3)

    def test_high_damage_ratio_separates_from_clean_warehouse(self):
        clean = compute_features(
            warehouse(), [event("INFLOW", 100)] * 10, 0, False, now=NOW
        )
        suspicious = compute_features(
            warehouse(),
            [event("DAMAGE", 100)] * 6 + [event("INFLOW", 100)] * 4,
            0, False, now=NOW,
        )
        assert suspicious[2] > clean[2]

    def test_capacity_overclaim_pattern_is_representable(self):
        """
        High inflow ratio with low utilisation — stock claimed as received
        but the warehouse stays empty. Physically implausible in combination.
        """
        events = [event("INFLOW", 100)] * 8 + [event("OUTFLOW", 100)] * 8
        f = compute_features(warehouse(capacity=500), events, 0, False, now=NOW)
        assert f[1] == pytest.approx(0.5)  # inflow_ratio
        assert f[3] == pytest.approx(0.0)  # utilization — nothing retained

    def test_redistribution_count_saturates_at_ten(self):
        low = compute_features(warehouse(), [], 3, False, now=NOW)
        at_cap = compute_features(warehouse(), [], 10, False, now=NOW)
        beyond = compute_features(warehouse(), [], 40, False, now=NOW)
        assert low[7] == pytest.approx(0.3)
        assert at_cap[7] == 1.0
        assert beyond[7] == 1.0  # documented saturation

    def test_disaster_flag_is_binary(self):
        assert compute_features(warehouse(), [], 0, True, now=NOW)[6] == 1.0
        assert compute_features(warehouse(), [], 0, False, now=NOW)[6] == 0.0


class TestUtilizationDerivation:
    def test_utilization_derives_from_net_event_flow(self):
        events = [event("INFLOW", 300), event("OUTFLOW", 100)]
        f = compute_features(warehouse(capacity=500), events, 0, False, now=NOW)
        assert f[3] == pytest.approx(200 / 500)

    def test_negative_net_stock_clamps_to_zero(self):
        events = [event("INFLOW", 50), event("OUTFLOW", 200)]
        f = compute_features(warehouse(capacity=500), events, 0, False, now=NOW)
        assert f[3] == 0.0

    def test_FINDING_adjustment_events_reduce_stock(self):
        """
        ADJUSTMENT is treated as an outflow, so a correction that raises a
        physical count still lowers derived utilisation. This makes the GNN's
        utilisation diverge from warehouses.currentStockTons in MySQL, which is
        maintained separately by the backend. Documented limitation.
        """
        with_adj = compute_features(
            warehouse(capacity=500),
            [event("INFLOW", 400), event("ADJUSTMENT", 100)],
            0, False, now=NOW,
        )
        without_adj = compute_features(
            warehouse(capacity=500), [event("INFLOW", 400)], 0, False, now=NOW
        )
        assert with_adj[3] < without_adj[3]

    def test_FINDING_opening_balance_is_invisible_to_the_model(self):
        """
        Stock present before any event was recorded — as with seeded
        warehouses — is not reflected, since utilisation is derived purely
        from event history rather than read from currentStockTons.
        """
        f = compute_features(warehouse(capacity=500), [], 0, False, now=NOW)
        assert f[3] == 0.0