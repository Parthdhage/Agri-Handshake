const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config();

// Database
const sequelize = require('./database');
const Listing = require('./models/Listing');
const Escrow = require('./models/Escrow');

const app = express();
app.use(cors());
app.use(express.json());

// Sync Database
sequelize.sync({ alter: true }).then(() => console.log('📦 Database & tables synced!'));

// ==========================================
// 🔗 BLOCKCHAIN PROXY ROUTES (READ-ONLY)
// ==========================================
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const provider = new ethers.JsonRpcProvider('http://localhost:8545', { chainId: 1337, name: 'localhost' }, { staticNetwork: true });

const CONTRACT_ABI = [
  "function createListing(string,string,uint256,uint256,string,string,string,uint256,uint256)",
  "function getListing(uint256) view returns (tuple(address farmer, string crop, string category, uint256 quantity, uint256 pricePerKg, string location, string description, string imageHash, uint256 harvestDate, uint256 minOrderQty, bool active))",
  "function listingCount() view returns (uint256)",
  "function makeOffer(uint256,uint256,uint256)",
  "function acceptOffer(uint256,uint256)",
  "function getOffers(uint256) view returns (address[], uint256[], uint256[], bool[])",
  "function markProofViewed(uint256)",
  "function getEscrowStatus(uint256) view returns (string,uint256,bool,bool,bool,string,string,bool)",
  "function resolveDispute(uint256,uint256,uint256)",
  "function arbitrator() view returns (address)",
  "function disputeDelivery(uint256,string,string)",
  "function setArbitrator(address)"
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

app.get('/api/chain/listings', async (req, res) => {
  try {
    const count = await contract.listingCount();
    const listings = [];
    for (let i = 1; i <= Number(count); i++) {
      const l = await contract.getListing(i);
      listings.push({
        id: i,
        farmer: l.farmer,
        crop: l.crop,
        category: l.category,
        quantity: Number(ethers.formatEther(l.quantity)),
        price: Number(ethers.formatEther(l.pricePerKg)),
        location: l.location,
        description: l.description,
        imageHash: l.imageHash,
        harvestDate: Number(l.harvestDate),
        minOrderQty: Number(ethers.formatEther(l.minOrderQty)),
        active: l.active
      });
    }
    res.json(listings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ==========================================
// 💾 DATABASE CRUD ROUTES (PERSISTENT)
// ==========================================

// --- LISTINGS CRUD ---

app.post('/api/db/listings', async (req, res) => {
  try {
    const listing = await Listing.create(req.body);
    res.json(listing);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/db/listings', async (req, res) => {
  const listings = await Listing.findAll();
  res.json(listings);
});

app.put('/api/db/listings/:id', async (req, res) => {
  await Listing.update(req.body, { where: { id: req.params.id } });
  const updated = await Listing.findByPk(req.params.id);
  res.json(updated);
});

app.delete('/api/db/listings/:id', async (req, res) => {
  await Listing.destroy({ where: { id: req.params.id } });
  res.json({ message: "Deleted" });
});


// --- ESCROW CRUD ---

app.post('/api/db/escrows', async (req, res) => {
  try {
    const escrow = await Escrow.create(req.body);
    res.json(escrow);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/db/escrows', async (req, res) => {
  const escrows = await Escrow.findAll();
  res.json(escrows);
});

app.put('/api/db/escrows/:id', async (req, res) => {
  await Escrow.update(req.body, { where: { id: req.params.id } });
  const updated = await Escrow.findByPk(req.params.id);
  res.json(updated);
});

// Update by Chain Escrow ID
app.put('/api/db/escrows/chain/:chainId', async (req, res) => {
  try {
    const escrow = await Escrow.findOne({ where: { chainEscrowId: req.params.chainId } });
    if (escrow) {
      const fields = ['status', 'ipfsProof', 'autoReleaseTime', 'proofViewedByBuyer',
                       'disputed', 'disputeReason', 'buyerDisputeProof', 'resolved',
                       'trackingNumber', 'courierName', 'shippedAt'];
      fields.forEach(field => {
        if (req.body[field] !== undefined) escrow[field] = req.body[field];
      });
      await escrow.save();
      res.json(escrow);
    } else {
      res.status(404).json({ error: 'Escrow not found' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- TRANSPORT/TRACKING ENDPOINT ---
app.put('/api/db/escrows/chain/:chainId/tracking', async (req, res) => {
  try {
    const { transportMethod, vehicleNumber, driverName, driverPhone, pickupPoint, estimatedDelivery } = req.body;
    const escrow = await Escrow.findOne({ where: { chainEscrowId: req.params.chainId } });
    if (!escrow) return res.status(404).json({ error: 'Escrow not found' });

    escrow.transportMethod = transportMethod || escrow.transportMethod;
    escrow.vehicleNumber = vehicleNumber || escrow.vehicleNumber;
    escrow.driverName = driverName || escrow.driverName;
    escrow.driverPhone = driverPhone || escrow.driverPhone;
    escrow.pickupPoint = pickupPoint || escrow.pickupPoint;
    escrow.estimatedDelivery = estimatedDelivery || escrow.estimatedDelivery;
    escrow.shippedAt = new Date();
    await escrow.save();
    res.json(escrow);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get tracking info for an escrow
app.get('/api/db/escrows/chain/:chainId/tracking', async (req, res) => {
  try {
    const escrow = await Escrow.findOne({ where: { chainEscrowId: req.params.chainId } });
    if (!escrow) return res.status(404).json({ error: 'Escrow not found' });
    res.json({
      transportMethod: escrow.transportMethod,
      vehicleNumber: escrow.vehicleNumber,
      driverName: escrow.driverName,
      driverPhone: escrow.driverPhone,
      pickupPoint: escrow.pickupPoint,
      estimatedDelivery: escrow.estimatedDelivery,
      shippedAt: escrow.shippedAt,
      status: escrow.status
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚜 Backend running on http://localhost:${PORT}`);
  console.log('✅ Database connected (SQLite)');
});
