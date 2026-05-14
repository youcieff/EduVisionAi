const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

// Public
router.get('/plans', subscriptionController.getPlans);

// Private (logged in users)
router.use(protect);
router.get('/my-usage', subscriptionController.getMyUsage);
router.post('/upgrade', subscriptionController.requestUpgrade);

module.exports = router;
