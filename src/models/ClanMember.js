const mongoose = require('mongoose');

const clanMemberSchema = new mongoose.Schema({
  tag: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  total_donations: {
    type: Map,
    of: Number,
    default: new Map()
  },
  last_fetched_donations: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Convert Map to plain object for JSON serialization
clanMemberSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.total_donations = Object.fromEntries(obj.total_donations);
  obj.last_fetched_donations = Object.fromEntries(obj.last_fetched_donations);
  return obj;
};

const ClanMember = mongoose.model('ClanMember', clanMemberSchema);

module.exports = ClanMember; 