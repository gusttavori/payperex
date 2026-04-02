const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    min: 6,
    max: 255
  },
  accessCode: { 
    type: String, 
    required: true, 
    unique: true,
    min: 4,
    max: 1024
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', UserSchema);