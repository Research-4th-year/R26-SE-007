import torch
import pytest
from src.model import WarehouseGAT


@pytest.fixture
def model():
    return WarehouseGAT()


def simple_graph(n_nodes: int = 5):
    """A small connected warehouse graph."""
    x = torch.rand(n_nodes, 8)
    edge_index = torch.tensor(
        [[0, 1, 2, 3], [1, 2, 3, 0]], dtype=torch.long
    )
    return x, edge_index


class TestOutputContract:
    def test_returns_one_score_per_warehouse(self, model):
        x, edge_index = simple_graph(5)
        assert model(x, edge_index).shape == (5,)

    def test_scores_are_bounded_zero_to_one(self, model):
        x, edge_index = simple_graph(10)
        out = model(x, edge_index)
        assert torch.all(out >= 0.0) and torch.all(out <= 1.0)

    def test_no_nan_or_inf_in_output(self, model):
        x, edge_index = simple_graph(8)
        out = model(x, edge_index)
        assert not torch.isnan(out).any()
        assert not torch.isinf(out).any()

    def test_accepts_the_documented_eight_features(self, model):
        # The architecture is fixed at 8 input features; a mismatch must fail loudly
        with pytest.raises(Exception):
            model(torch.rand(5, 7), simple_graph()[1])


class TestGraphTopologyEdgeCases:
    def test_isolated_warehouses_are_still_scored(self, model):
        """A warehouse with no redistribution history must not crash inference."""
        x = torch.rand(3, 8)
        empty_edges = torch.empty((2, 0), dtype=torch.long)
        out = model(x, empty_edges)
        assert out.shape == (3,)
        assert not torch.isnan(out).any()

    def test_single_warehouse_network(self, model):
        """Degrades gracefully to feature-only scoring when there is one node."""
        out = model(torch.rand(1, 8), torch.empty((2, 0), dtype=torch.long))
        assert out.shape == (1,)

    def test_bidirectional_edges_are_accepted(self, model):
        """Mutual redistribution between two warehouses — the collusion topology."""
        x = torch.rand(2, 8)
        edge_index = torch.tensor([[0, 1], [1, 0]], dtype=torch.long)
        out = model(x, edge_index)
        assert out.shape == (2,)

    def test_scales_to_a_larger_network(self, model):
        """PMB operates roughly 30-40 centres; confirm headroom well beyond that."""
        n = 100
        x = torch.rand(n, 8)
        src = torch.randint(0, n, (300,))
        dst = torch.randint(0, n, (300,))
        out = model(x, torch.stack([src, dst]))
        assert out.shape == (n,)


class TestInferenceDeterminism:
    def test_eval_mode_gives_identical_scores_across_calls(self, model):
        """
        Audit requirement: the same warehouse state must always produce the
        same score. This verifies dropout is disabled outside training.
        """
        model.eval()
        x, edge_index = simple_graph(6)
        with torch.no_grad():
            first = model(x, edge_index)
            second = model(x, edge_index)
        assert torch.allclose(first, second)

    def test_train_mode_is_stochastic_due_to_dropout(self, model):
        """Confirms dropout is genuinely active during training."""
        model.train()
        torch.manual_seed(0)
        x, edge_index = simple_graph(20)
        first = model(x, edge_index)
        second = model(x, edge_index)
        assert not torch.allclose(first, second)

    def test_fixed_seed_reproduces_initialisation(self):
        """Supports the reproducibility claim made in the research report."""
        torch.manual_seed(42)
        a = WarehouseGAT()
        torch.manual_seed(42)
        b = WarehouseGAT()
        for pa, pb in zip(a.parameters(), b.parameters()):
            assert torch.allclose(pa, pb)


class TestArchitecture:
    def test_layer_dimensions_match_the_documented_design(self, model):
        # Layer 1: 8 → 16 with 4 heads; Layer 2: 64 → 8 with 1 head
        assert model.conv1.in_channels == 8
        assert model.conv1.out_channels == 16
        assert model.conv1.heads == 4
        assert model.conv2.in_channels == 64
        assert model.conv2.out_channels == 8
        assert model.conv2.heads == 1

    def test_parameter_count_is_small_enough_to_justify_regularisation(self, model):
        """
        ~3k parameters against 30 training nodes is why weight decay and
        dropout are required — documented as a limitation in the report.
        """
        total = sum(p.numel() for p in model.parameters())
        assert 1_000 < total < 10_000

    def test_gradients_flow_to_every_parameter(self, model):
        """No dead branches — every parameter receives a learning signal."""
        x, edge_index = simple_graph(10)
        loss = torch.nn.BCELoss()(model(x, edge_index), torch.rand(10))
        loss.backward()
        for name, p in model.named_parameters():
            assert p.grad is not None, f"no gradient reached {name}"