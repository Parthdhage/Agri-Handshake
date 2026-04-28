# 🌾 AgriHandshake — Blockchain-Powered Crop Trading Platform

> A decentralized platform connecting **farmers** directly with **buyers**, eliminating middlemen through smart contract escrow, transparent pricing, and blockchain-verified delivery.

![Solidity](https://img.shields.io/badge/Solidity-0.8.28-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Hardhat](https://img.shields.io/badge/Hardhat-Local-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Features

- **Role-Based Access** — Farmer and Buyer roles with separate dashboards
- **Crop Listings** — Farmers list crops with photos, pricing, harvest dates
- **Offer System** — Buyers bid in INR (auto-converted to ETH via CoinGecko)
- **Smart Contract Escrow** — Funds locked until delivery is confirmed
- **Delivery Proof** — IPFS-based proof upload for transparency
- **Agricultural Transport Tracking** — Realistic Indian transport methods (tractor, truck, tempo, buyer pickup)
- **Dispute Resolution** — Arbitrator-mediated dispute system with 50/50 split option
- **Auto-Release** — If buyer doesn't respond in 24hrs, farmer can force-release funds

---

## 🏗️ Architecture

```
agrihandshake/
├── contracts/           # Solidity smart contracts
│   └── AgriEscrow.sol   # Main escrow + marketplace contract
├── scripts/
│   └── deploy.js        # Auto-deploy + update frontend/backend config
├── backend/
│   ├── server.js        # Express API (SQLite)
│   └── models/          # Sequelize models
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages (Landing, Listings, CreateListing, History)
│   │   ├── components/  # Navbar, Footer, ProtectedRoute
│   │   ├── context/     # WalletContext (MetaMask integration)
│   │   └── constants/   # Contract ABI + address (auto-updated by deploy)
│   └── public/
├── hardhat.config.js
└── setup.bat            # One-click dependency installer (Windows)
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MetaMask](https://metamask.io/) browser extension
- Git

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/agrihandshake.git
cd agrihandshake

# Install all dependencies (root + backend + frontend)
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

> **Windows users:** You can also run `setup.bat` to install everything in one click.

### 2. Start Hardhat Node (Terminal 1)

```bash
npx hardhat node
```

This starts a local blockchain at `http://127.0.0.1:8545` with 20 test accounts (10,000 ETH each).

### 3. Deploy Contract (Terminal 2)

```bash
npx hardhat run scripts/deploy.js --network localhost
```

This will:
- Deploy the `AgriEscrow` smart contract
- **Auto-update** `frontend/src/constants/contract.js` with the new contract address
- **Auto-create** `backend/.env` with the contract address

### 4. Start Backend (Terminal 3)

```bash
cd backend
node server.js
```

Backend runs on `http://localhost:5000`

### 5. Start Frontend (Terminal 4)

```bash
cd frontend
npm start
```

Frontend runs on `http://localhost:3000`

---

## 🦊 MetaMask Setup

1. Open MetaMask → **Add Network**
2. Fill in:
   - **Network Name:** Hardhat Local
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency:** ETH
3. **Import test accounts** using private keys from the Hardhat node output
   - Account #0 (Farmer): `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Account #1 (Buyer): `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

> ⚠️ These are **test accounts** — never use them on mainnet!

### Clearing Nonce Errors

If you see "nonce mismatch" errors after restarting Hardhat:
1. MetaMask → **Settings → Advanced → Clear Activity Tab Data**
2. Hard refresh the browser (`Ctrl + Shift + R`)

---

## 🔄 Trade Flow

```
Farmer lists crop → Buyer places bid (₹/KG → ETH)
        → Farmer accepts offer → Escrow created
        → Buyer deposits ETH → Funds locked
        → Farmer uploads delivery proof (IPFS)
        → Farmer adds transport details (tractor/truck/etc.)
        → Buyer confirms delivery
        → Buyer transfers payment to farmer
        → Transaction complete! 🎉

If buyer doesn't respond in 24hrs → Farmer can auto-release funds ⚡
If buyer disputes → Arbitrator resolves (100% farmer / 100% buyer / 50-50 split)
```

---

## 🚜 Transport Methods

Unlike e-commerce couriers, agricultural produce moves differently:

| Method | Use Case |
|--------|----------|
| 🚜 Tractor + Trailer | Grains, sugarcane (5-50 km) |
| 🚛 Hired Truck | Bulk transport (50-500+ km) |
| 🚐 Tempo / Mini-Truck | Vegetables, fruits (10-100 km) |
| 🛻 Pickup Van | Perishables (10-50 km) |
| 🛺 Auto-Rickshaw | Small quantities (< 30 km) |
| 🐂 Bullock Cart | Traditional, short distance |
| 🏍️ Personal Vehicle | Very small quantities |
| 🤝 Buyer Self-Pickup | Buyer comes to farm |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.28, OpenZeppelin |
| Blockchain | Hardhat (local), Ethers.js v6 |
| Frontend | React 18, TailwindCSS, Framer Motion |
| Backend | Express.js, Sequelize, SQLite |
| Storage | IPFS (Pinata) for delivery proofs |
| Currency | CoinGecko API (ETH ↔ INR) |

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `contracts/AgriEscrow.sol` | Smart contract (listings, offers, escrow, disputes) |
| `scripts/deploy.js` | Deploy + auto-configure frontend & backend |
| `frontend/src/constants/contract.js` | Contract address + ABI (auto-updated) |
| `frontend/src/pages/History.js` | My Trades — full escrow lifecycle UI |
| `frontend/src/pages/ListingsPage.js` | Marketplace — browse, bid, accept offers |
| `frontend/src/context/WalletContext.js` | MetaMask connection + role management |

---

## 👥 Team Development

When a new team member clones this repo:

1. Run `setup.bat` (or install manually)
2. Start Hardhat node → Deploy contract (this auto-updates the contract address everywhere)
3. Import Hardhat test accounts into their MetaMask
4. Start backend + frontend
5. Ready to develop! 🚀

> The contract address is **auto-injected** by the deploy script — no manual config needed.

---

## 📝 License

MIT
