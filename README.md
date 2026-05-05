

<img src="https://img.shields.io/badge/Research%20Project-Smart%20Paddy%20Farming-1D9E75?style=for-the-badge&logo=leaflet&logoColor=white" alt="Project Badge"/>

# 🌾 Smart Paddy Farming System
### An Integrated AI, IoT & Blockchain Research Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Research Status](https://img.shields.io/badge/Status-Active%20Research-blue.svg)]()
[![Components](https://img.shields.io/badge/Components-4-green.svg)]()
[![Members](https://img.shields.io/badge/Team%20Members-4-orange.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](CONTRIBUTING.md)

> A multi-component research system integrating Artificial Intelligence, Internet of Things, Blockchain, and Digital Marketplace technologies to modernise and optimise paddy farming in Sri Lanka.

[Overview](#-project-overview) • [Architecture](#-system-architecture) • [Components](#-components) • [Getting Started](#-getting-started) • [Team](#-research-team) • [Publications](#-publications)

</div>

---

## 📌 Project Overview

The **Smart Paddy Farming System** is a group research project developed as part of an undergraduate research programme. It addresses critical challenges faced by paddy farmers — including price volatility, lack of real-time monitoring, inefficient market access, and opaque warehouse management — through a suite of four integrated intelligent modules.

This system aims to:

- Empower farmers with **AI-driven price forecasts** to make informed selling decisions
- Provide **real-time field monitoring** through IoT-connected sensors and dashboards
- Bridge the gap between **farmers and millers** through an AI-powered digital marketplace
- Ensure **transparency in warehouse storage** using blockchain-based coordination

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Smart Paddy Farming Platform                 │
│                                                                  │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐   │
│   │  C01       │  │  C0        │  │  C03       │  │  C04     │   │
│   │  AI Price  │  │  Digital   │  │  Farmer-   │  │Blockchain│   │
│   │  Forecast  │  │  Dashboard │  │  Miller    │  │Warehouse │   │
│   │            │  │            │  │  Market    │  │Coord.    │   │
│   └─────┬──────┘  └─────┬──────┘  └──────┬─────┘  └────┬─────┘   │
│         │               │                │              │        │
│   ──────┴───────────────┴────────────────┴──────────────┴──────  │
│                     Shared API Gateway & Auth Layer              │
│   ─────────────────────────────────────────────────────────────  │
│              Shared Database  |  Shared Utilities                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Components

### Component 01 — AI Driven Paddy Price Forecasting
> **Branch:** `feature/price-forecasting`

Leverages machine learning models (LSTM, ARIMA, XGBoost) to forecast paddy market prices based on historical data, seasonal trends, weather patterns, and regional supply-demand dynamics.

**Key Features:**
- Time-series price prediction with configurable forecast windows
- Multi-variable input: weather, harvest yield, import/export data
- REST API for real-time price query by other components
- Model performance dashboard with accuracy metrics (MAE, RMSE)

**Tech Stack:** Python · Scikit-learn · TensorFlow/Keras · FastAPI · Pandas · Matplotlib

---

### Component 02 — IoT Integrated Digital Dashboard for Smart Paddy Farming
> **Branch:** `feature/iot-dashboard`

A real-time field monitoring system using IoT sensors connected to a digital dashboard, enabling farmers to track soil moisture, temperature, humidity, and water levels remotely.

**Key Features:**
- ESP32/Arduino sensor node firmware
- MQTT-based data streaming to cloud backend
- Real-time React dashboard with historical trend charts
- Automated alert notifications (SMS/email) on threshold breach

**Tech Stack:** ESP32/Arduino · MQTT (Mosquitto) · Node.js · React · InfluxDB · Grafana

---

### Component 03 — AI Powered Farmer Miller Marketplace
> **Branch:** `feature/marketplace`

A digital platform connecting paddy farmers directly with rice millers, reducing intermediary costs. An AI recommendation engine matches buyers and sellers based on location, quality, quantity, and price preferences.

**Key Features:**
- AI-based buyer-seller matching engine
- Real-time listing, bidding, and negotiation module
- Integrated price feed from C01 Price Forecasting
- Review and trust-score system for marketplace participants

**Tech Stack:** Node.js · React · PostgreSQL · Python (ML) · REST API · JWT Auth

---

### Component 04 — Blockchain Based Warehouse Coordination
> **Branch:** `feature/blockchain-warehouse`

A decentralised warehouse management system using Ethereum smart contracts to record paddy storage, transfers, and ownership in a tamper-proof ledger, ensuring full traceability and transparency.

**Key Features:**
- Solidity smart contracts for storage slot allocation and transfer
- Immutable stock-in / stock-out event logging on-chain
- Web3 frontend with MetaMask wallet integration
- QR-code-based warehouse token verification

**Tech Stack:** Solidity · Hardhat · Ethereum (Testnet) · Web3.js · React · Node.js · IPFS

---

## 📁 Repository Structure

```
smart-paddy-farming/
│── c01-price-forecasting/
│── c02-digital-dashboard/
│── c03-marketplace/
│── c04-blockchain-warehouse/
├── digital-goviya-client/
├── .gitignore
├── LICENSE
└── README.md                   
```

---

## 🌿 Branch Strategy

| Branch | Purpose | Protection |
|--------|---------|-----------|
| `main` | Production-ready releases | 2 approvals required |
| `develop` | Integration & testing | 1 approval required |
| `feature/price-forecasting` | C01 development | C01 member |
| `feature/digital-dashboard` | C02 development | C02 member |
| `feature/marketplace` | C03 development | C03 member |
| `feature/blockchain-warehouse` | C04 development | C04 member |
| `feature/digital-goviya-client` | Academic documentation | All members |

---

## 👥 Research Team

| Member | Component |
|--------|-----------|
| **Ransara N.S.** | C01 — Price Forecasting |
| **Kumarasinghe P.A.N.D.** | C02 — IoT Dashboard |
| **Chamudi K.S.I.** | C03 — Marketplace | 
| **Senarathne S.M.B.V.B.** | C04 — Blockchain |

> **Supervisor:** Dr. Mahima Weerasinghe | SLIIT
> **Co-Supervisor:** Mr. Eishan Weerasinghe | SLIIT

<div align="center">

Made with ❤️ by the Smart Paddy Farming Research Group · [Institution Name] · 2024/2025

</div>
