const express = require('express');
const {
    login,
    logout,
    register,
    getAllUsers,
    refreshToken,
    deleteAccount,
    resetPassword,
    requestPayment,
    toggleAuthorization,
    resetPasswordRequest,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.get('/users', getAllUsers);
router.post('/register', register);
router.post('/reset', resetPassword);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);
router.post('/payment/details', requestPayment)
router.post('/reset-link', resetPasswordRequest);
router.post('/authorize', protect, toggleAuthorization);
router.delete('/delete', protect, deleteAccount);

module.exports = router;
