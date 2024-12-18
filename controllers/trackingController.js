const Tracking = require('../models/trackingModel');
const User = require('../models/userModel');
const crypto = require('crypto');
const { sendTrackingEmail } = require('../helpers/authHelper');

exports.createTracking = async (req, res) => {
  try {
    const { email, country, weight, shipmentType, totalPrice } = req.body;
    const userId = req.user._id;

    // Find user to ensure they exist
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Create new tracking
    const newTracking = new Tracking({
      userId,
      email,
      shipmentDetails: {
        country,
        weight,
        shipmentType,
        totalPrice
      }
    });

    // Generate tracking ID
    newTracking.trackingId = newTracking.generateTrackingId();

    // Add initial tracking stage
    newTracking.trackingStages.push({
      stage: 1,
      location: 'Processing Center',
      status: 'Order Placed',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
    });

    await newTracking.save();

    // Send tracking email
    await sendTrackingEmail(
      user.username, 
      email, 
      newTracking.trackingId, 
      newTracking.shipmentDetails
    );

    res.status(201).json({
      status: 'success',
      message: 'Tracking created successfully',
      data: {
        trackingId: newTracking.trackingId,
        trackingDetails: newTracking.shipmentDetails
      }
    });
  } catch (error) {
    console.error('Tracking creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during tracking creation',
      details: error.message
    });
  }
};

exports.updateTracking = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { stage, location, status } = req.body;

    const tracking = await Tracking.findOne({ trackingId });
    if (!tracking) {
      return res.status(404).json({
        status: 'error',
        message: 'Tracking not found'
      });
    }

    tracking.currentStage = stage;
    tracking.trackingStages.push({
      stage,
      location,
      status,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    await tracking.save();

    res.status(200).json({
      status: 'success',
      message: 'Tracking updated successfully',
      data: tracking
    });
  } catch (error) {
    console.error('Tracking update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during tracking update',
      details: error.message
    });
  }
};

exports.getTracking = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const tracking = await Tracking.findOne({ trackingId });
    if (!tracking) {
      return res.status(404).json({
        status: 'error',
        message: 'Tracking not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: tracking
    });
  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error retrieving tracking',
      details: error.message
    });
  }
};