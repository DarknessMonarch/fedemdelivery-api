const express = require('express');
const { 
  createTracking, 
  updateTracking, 
  getTracking 
} = require('../controllers/trackingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', protect, createTracking);
router.put('/update/:trackingId', protect,updateTracking);
router.get('/:trackingId', protect, getTracking);

module.exports = router;