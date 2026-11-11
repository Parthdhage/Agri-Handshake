# AgriHandshake

A crop marketplace prototype that combines a React frontend, an Express API, and Solidity escrow contracts.

## Features

- Farmer and buyer dashboards with crop listings and offers
- Escrow-based trade flow using a local Hardhat network
- Delivery proof and transport details
- Dispute and delivery confirmation flows

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React, Tailwind CSS, Ethers.js |
| Backend | Express, Sequelize, SQLite |
| Contracts | Solidity, Hardhat, OpenZeppelin |
| Storage and pricing integrations | IPFS and CoinGecko |

## Repository layout

    contracts/       Solidity contracts
    scripts/         Deployment scripts
    backend/         API and data models
    frontend/        React application
    ignition/        Hardhat deployment modules
    test/            Contract tests

## Run locally

Prerequisites: Node.js, npm, Git, and MetaMask.

Install dependencies from the repository root and each application:

    npm install
    cd backend && npm install
    cd ../frontend && npm install

In separate terminals:

    npx hardhat node
    npx hardhat run scripts/deploy.js --network localhost

Then start the API and frontend:

    cd backend && npm start
    cd ../frontend && npm start

The frontend and backend require local configuration. Use backend/.env.example as the starting point where applicable, and never commit populated environment files or private credentials. The deployment script updates local contract configuration as part of its documented workflow.

## Contract tests

The current root package does not define a runnable test command. The test directory contains the Hardhat contract tests; use the repository's Hardhat configuration and installed dependencies when running them.

## Local network safety

Use only local Hardhat test accounts for development. Never use development keys or test funds on a public network.
