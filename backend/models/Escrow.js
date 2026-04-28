const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Escrow = sequelize.define('Escrow', {
    chainEscrowId: { type: DataTypes.INTEGER, allowNull: true },
    listingId: { type: DataTypes.INTEGER, allowNull: false },
    buyer: { type: DataTypes.STRING, allowNull: false },
    farmer: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'PENDING' },
    ipfsProof: { type: DataTypes.STRING, allowNull: true },
    proofUploadedAt: { type: DataTypes.DATE, allowNull: true },
    deliveryConfirmedAt: { type: DataTypes.DATE, allowNull: true },
    autoReleaseTime: { type: DataTypes.DATE, allowNull: true },
    proofViewedByBuyer: { type: DataTypes.BOOLEAN, defaultValue: false },
    disputed: { type: DataTypes.BOOLEAN, defaultValue: false },
    disputeReason: { type: DataTypes.TEXT, allowNull: true },
    buyerDisputeProof: { type: DataTypes.TEXT, allowNull: true },
    resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
    // Transport & Tracking fields (agricultural)
    transportMethod: { type: DataTypes.STRING, allowNull: true },
    vehicleNumber: { type: DataTypes.STRING, allowNull: true },
    driverName: { type: DataTypes.STRING, allowNull: true },
    driverPhone: { type: DataTypes.STRING, allowNull: true },
    pickupPoint: { type: DataTypes.STRING, allowNull: true },
    estimatedDelivery: { type: DataTypes.DATE, allowNull: true },
    shippedAt: { type: DataTypes.DATE, allowNull: true },
    // Legacy fields kept for backward compat
    trackingNumber: { type: DataTypes.STRING, allowNull: true },
    courierName: { type: DataTypes.STRING, allowNull: true },
});

module.exports = Escrow;
