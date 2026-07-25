# Hyperledger Fabric Setup Guide

This guide explains how to set up Fabric certificates and environment variables locally.

## Directory Structure

```
fabric-wallet/
  ├── Admin@org1.example.com-cert.pem    (Generated - NOT tracked in git)
  ├── Admin@org1.example.com-key.pem     (Generated - NOT tracked in git)
  └── org1-tls-ca.crt                     (Generated - NOT tracked in git)

fabric-samples/test-network/organizations/
  └── peerOrganizations/org1.example.com/  (Generated - NOT tracked in git)
```

## Setup Instructions

### 1. Generate Certificates
Run the Fabric test network setup script:

```bash
cd fabric-samples/test-network
./network.sh up createChannel -c warehousechannel
```

This generates:
- Wallet certificates in `fabric-wallet/`
- Peer certificates in `fabric-samples/test-network/organizations/`

### 2. Copy Certificates to Wallet
After running the network setup, copy the Admin certificate files:

```bash
# From inside test-network
cp organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/*.pem ../../fabric-wallet/Admin@org1.example.com-cert.pem
cp organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/*.pem ../../fabric-wallet/Admin@org1.example.com-key.pem
cp organizations/peerOrganizations/org1.example.com/ca/ca.org1.example.com-cert.pem ../../fabric-wallet/org1-tls-ca.crt
```

Or use the provided script:
```bash
./refresh-certs.sh
```

### 3. Update `.env`
Check that your `.env` file contains:

```env
FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_PEER_TLS_ENABLED=true
FABRIC_PEER_TLSCERTNAME=org1-tls-ca.crt
FABRIC_MSP_ID=Org1MSP

FABRIC_CERT_PATH=./fabric-wallet/Admin@org1.example.com-cert.pem
FABRIC_KEY_PATH=./fabric-wallet/Admin@org1.example.com-key.pem
FABRIC_TLS_CERT_PATH=./fabric-wallet/org1-tls-ca.crt
```

## Important: Security

- **Never commit** `fabric-wallet/` to git
- **Never commit** Fabric organization certificates to git
- Certificates are environment-specific and regenerated when networks restart
- Each developer should generate their own local certificates

## Troubleshooting

### Certificates Not Found
If you get "certificate not found" errors:
1. Verify the paths in `.env` are correct
2. Run `./refresh-certs.sh` to regenerate certificates
3. Check that the test network is running: `cd fabric-samples/test-network && ./network.sh up`

### Invalid Certificate Format
If certificates fail to load:
1. Ensure files are in PEM format (text, not binary)
2. Check file permissions: `ls -la fabric-wallet/`
3. Regenerate: `./refresh-certs.sh`
