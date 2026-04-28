const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Listing = sequelize.define('Listing', {
    farmer: { type: DataTypes.STRING, allowNull: false },
    crop: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Other' },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' },
    imageHash: { type: DataTypes.STRING, allowNull: true, defaultValue: '' },
    harvestDate: { type: DataTypes.DATE, allowNull: true },
    minOrderQty: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

module.exports = Listing;
