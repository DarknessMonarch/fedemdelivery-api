const mongoose = require('mongoose');
const crypto = require('crypto');

const trackingSchema = new mongoose.Schema({
  trackingId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  currentStage: { 
    type: Number, 
    default: 1, 
    min: 1, 
    max: 3 
  },
  shipmentDetails: {
    country: { type: String, required: true },
    weight: { type: String, required: true },
    shipmentType: { type: String, required: true },
    totalPrice: { type: String, required: true }
  },
  trackingStages: [{
    stage: { type: Number, required: true },
    location: { type: String, required: true },
    status: { type: String, required: true },
    estimatedDelivery: { type: Date, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Generate a unique tracking ID
trackingSchema.methods.generateTrackingId = function() {
  // Format: FEDEM-YYYYMMDD-RANDOMHEX
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `FEDEM-${date}-${randomHex}`;
};

module.exports = mongoose.model('Tracking', trackingSchema);