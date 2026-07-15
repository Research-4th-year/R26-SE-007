#!/bin/bash
BASE=/Users/buwanekavishwajith/Desktop/warehouse/c04-blockchain-warehouse
TESTNET=$BASE/fabric-samples/test-network
WALLET=$BASE/fabric-wallet

echo "Copying new TLS certificates from test-network..."

cp $TESTNET/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  $WALLET/org1-tls-ca.crt

cp $TESTNET/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/cert.pem \
  $WALLET/Admin@org1.example.com-cert.pem

cp $TESTNET/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/$(ls $TESTNET/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/) \
  $WALLET/Admin@org1.example.com-key.pem

echo "Done. Restart your backend: npm run dev"
