"""
Unit tests for negotiation DecisionValidator and request schema bounds.
Uses the existing negotiation_agents package. Does not call Ollama.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "negotiation_agents"
sys.path.insert(0, str(ROOT))

from pydantic import ValidationError

from schemas.negotiation import (
    FarmerAgentInput,
    MillerAgentInput,
    NegotiationAction,
    NegotiationDecision,
    NegotiationRequest,
    NegotiationStatus,
)
from services.decision_validator import (
    DecisionValidationError,
    DecisionValidator,
)


def farmer_state(**overrides):
    payload = {
        "negotiation_id": "NEG-TEST",
        "round_number": 1,
        "max_rounds": 6,
        "paddy_type": "nadu",
        "quantity_kg": 500,
        "district": "Kandy",
        "farmer_expected_price": 120,
        "farmer_minimum_price": 100,
        "miller_current_offer": 105,
        "fl_reference_price": 110,
        "matching_score": 80,
        "history": [],
    }
    payload.update(overrides)
    return FarmerAgentInput(**payload)


def miller_state(**overrides):
    payload = {
        "negotiation_id": "NEG-TEST",
        "round_number": 1,
        "max_rounds": 6,
        "paddy_type": "nadu",
        "requested_quantity_kg": 800,
        "available_quantity_kg": 500,
        "district": "Kandy",
        "miller_opening_price": 95,
        "miller_maximum_price": 115,
        "farmer_current_offer": 110,
        "fl_reference_price": 110,
        "matching_score": 80,
        "history": [],
    }
    payload.update(overrides)
    return MillerAgentInput(**payload)


def decision(action, price, reason="Within rules"):
    return NegotiationDecision(
        action=action,
        price=price,
        reason=reason,
        confidence=0.8,
        market_alignment="near_market",
    )


class NegotiationValidatorTests(unittest.TestCase):
    def setUp(self):
        self.validator = DecisionValidator()

    def test_ut_neg_01_farmer_cannot_accept_below_minimum(self):
        state = farmer_state(miller_current_offer=90, farmer_minimum_price=100)
        with self.assertRaises(DecisionValidationError):
            self.validator.validate_farmer_decision(
                state=state,
                decision=decision(NegotiationAction.ACCEPT, 90),
            )

    def test_ut_neg_02_farmer_can_accept_offer_at_or_above_minimum(self):
        state = farmer_state(miller_current_offer=105)
        self.validator.validate_farmer_decision(
            state=state,
            decision=decision(NegotiationAction.ACCEPT, 105),
        )

    def test_ut_neg_03_farmer_counter_below_minimum_is_invalid(self):
        state = farmer_state()
        with self.assertRaises(DecisionValidationError):
            self.validator.validate_farmer_decision(
                state=state,
                decision=decision(NegotiationAction.COUNTER_OFFER, 90),
            )

    def test_ut_neg_04_farmer_valid_counter_offer_is_accepted(self):
        state = farmer_state(miller_current_offer=105)
        self.validator.validate_farmer_decision(
            state=state,
            decision=decision(NegotiationAction.COUNTER_OFFER, 112),
        )

    def test_ut_neg_05_miller_cannot_accept_above_maximum(self):
        state = miller_state(
            farmer_current_offer=120,
            miller_maximum_price=115,
        )
        with self.assertRaises(DecisionValidationError):
            self.validator.validate_miller_decision(
                state=state,
                decision=decision(NegotiationAction.ACCEPT, 120),
            )

    def test_ut_neg_06_miller_counter_above_maximum_is_invalid(self):
        state = miller_state()
        with self.assertRaises(DecisionValidationError):
            self.validator.validate_miller_decision(
                state=state,
                decision=decision(NegotiationAction.COUNTER_OFFER, 130),
            )

    def test_ut_neg_07_miller_valid_counter_offer_is_accepted(self):
        state = miller_state(farmer_current_offer=110)
        self.validator.validate_miller_decision(
            state=state,
            decision=decision(NegotiationAction.COUNTER_OFFER, 108),
        )

    def test_ut_neg_08_accept_price_must_equal_current_offer(self):
        state = farmer_state(miller_current_offer=105)
        with self.assertRaises(DecisionValidationError):
            self.validator.validate_farmer_decision(
                state=state,
                decision=decision(NegotiationAction.ACCEPT, 110),
            )

    def test_ut_neg_09_reject_must_have_null_price(self):
        with self.assertRaises(ValidationError):
            decision(NegotiationAction.REJECT, 100)

        reject = NegotiationDecision(
            action=NegotiationAction.REJECT,
            price=None,
            reason="Cannot agree",
            confidence=0.7,
            market_alignment="below_market",
        )
        self.validator.validate_farmer_decision(
            state=farmer_state(),
            decision=reject,
        )

    def test_ut_neg_10_request_schema_enforces_price_boundaries_and_max_rounds(self):
        with self.assertRaises(ValidationError):
            NegotiationRequest(
                negotiation_id="NEG-1",
                paddy_type="nadu",
                district="Kandy",
                quantity_kg=500,
                farmer_expected_price=100,
                farmer_minimum_price=120,
                miller_opening_price=90,
                miller_maximum_price=110,
                fl_reference_price=105,
                matching_score=80,
            )

        with self.assertRaises(ValidationError):
            NegotiationRequest(
                negotiation_id="NEG-1",
                paddy_type="nadu",
                district="Kandy",
                quantity_kg=500,
                farmer_expected_price=120,
                farmer_minimum_price=100,
                miller_opening_price=90,
                miller_maximum_price=110,
                fl_reference_price=105,
                matching_score=80,
                max_rounds=21,
            )

        request = NegotiationRequest(
            negotiation_id="NEG-1",
            paddy_type="nadu",
            district="Kandy",
            quantity_kg=500,
            farmer_expected_price=120,
            farmer_minimum_price=100,
            miller_opening_price=90,
            miller_maximum_price=110,
            fl_reference_price=105,
            matching_score=80,
        )
        self.assertEqual(request.max_rounds, 6)
        self.assertEqual(NegotiationStatus.AGREED.value, "agreed")
        self.assertEqual(
            NegotiationStatus.MAX_ROUNDS_REACHED.value,
            "max_rounds_reached",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
