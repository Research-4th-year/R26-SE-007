pragma circom 2.0.0;

/*
 * CapacityRangeProof
 *
 * Proves that a warehouse has available capacity >= required threshold
 * WITHOUT revealing the exact available capacity or current stock level.
 *
 * Private inputs (only the warehouse knows these):
 *   - availableCapacity: the actual available tons in the warehouse
 *
 * Public inputs (visible to everyone including the verifier):
 *   - threshold:  the minimum tons required (e.g. estimatedLossTons)
 *   - warehouseId: a numeric ID to bind this proof to a specific warehouse
 *
 * The circuit proves: availableCapacity >= threshold
 * Without revealing: what availableCapacity actually is
 */

// Resolve circomlib from node_modules; setup script passes node_modules as include path
include "circomlib/circuits/comparators.circom";

template CapacityRangeProof() {
    // Private input — only the warehouse supervisor knows this
    signal input availableCapacity;

    // Public inputs — visible to the verifier (blockchain)
    signal input threshold;
    signal input warehouseCommitment;

    // Output — 1 if capacity >= threshold, 0 if not
    signal output valid;

    // Use circomlib's GreaterEqThan comparator
    // The number 32 means we support values up to 2^32 (4 billion tons)
    component gte = GreaterEqThan(32);
    gte.in[0] <== availableCapacity;
    gte.in[1] <== threshold;

    // valid = 1 means availableCapacity >= threshold
    valid <== gte.out;

    // Constraint: the proof is only valid if capacity >= threshold
    valid === 1;
}

component main {public [threshold, warehouseCommitment]} = CapacityRangeProof();