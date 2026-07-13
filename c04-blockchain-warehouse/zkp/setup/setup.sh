#!/bin/bash
set -e

BASE=/Users/buwanekavishwajith/Desktop/warehouse/c04-blockchain-warehouse/zkp
CIRCUIT=$BASE/circuits/capacity_range.circom
BUILD=$BASE/build

echo "=== Step 1: Compile the circuit ==="
# Add node_modules to circom include paths so library imports resolve
circom -l $BASE/node_modules $CIRCUIT --r1cs --wasm --sym -o $BUILD

echo "=== Step 2: Powers of Tau ceremony (development only) ==="
snarkjs powersoftau new bn128 14 $BUILD/pot14_0000.ptau -v

echo "=== Step 3: Contribute to ceremony ==="
snarkjs powersoftau contribute $BUILD/pot14_0000.ptau $BUILD/pot14_0001.ptau \
  --name="PMB First Contribution" -v -e="paddy warehouse zkp entropy"

echo "=== Step 4: Prepare for phase 2 ==="
snarkjs powersoftau prepare phase2 $BUILD/pot14_0001.ptau $BUILD/pot14_final.ptau -v

echo "=== Step 5: Groth16 setup ==="
snarkjs groth16 setup $BUILD/capacity_range.r1cs $BUILD/pot14_final.ptau $BUILD/capacity_range_0000.zkey

echo "=== Step 6: Contribute to phase 2 ==="
snarkjs zkey contribute $BUILD/capacity_range_0000.zkey $BUILD/capacity_range_final.zkey \
  --name="PMB Phase2 Contribution" -v -e="paddy warehouse phase2 entropy"

echo "=== Step 7: Export verification key ==="
snarkjs zkey export verificationkey $BUILD/capacity_range_final.zkey $BUILD/verification_key.json

echo ""
echo "✅ Setup complete. Files in zkp/build/:"
ls -lh $BUILD/