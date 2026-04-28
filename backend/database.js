const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite', // File-based DB
    logging: false
});

module.exports = sequelize;
