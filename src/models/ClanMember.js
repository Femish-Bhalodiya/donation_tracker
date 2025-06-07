const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClanMember = sequelize.define('ClanMember', {
  tag: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  total_donations: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  last_fetched_donations: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true
});

module.exports = ClanMember; 