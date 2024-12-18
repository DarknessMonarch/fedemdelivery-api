const crypto = require('crypto');
const User = require('../models/userModel');
const  { sendWelcomeEmail, sendResetEmail, sendPaymentEmail } = require('../helpers/authHelper');


const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};



exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username, email, and password are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format'
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

       // Check for admin email from environment variable
       const adminEmail = process.env.ADMIN_EMAIL || '';
       const isAdmin = email.toLowerCase() === adminEmail.toLowerCase();

    const newUser = new User({
      username,
      email,
      password,
      isAuthorized: false,
      isAdmin: isAdmin
    });

    await newUser.save();
    sendWelcomeEmail(email, username);

    const refreshToken = newUser.generateRefreshToken();
    await newUser.save();

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        userId: newUser._id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        isAuthorized: newUser.isAuthorized,
        refreshToken: refreshToken,
        accessToken: newUser.generateToken()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during registration',
      details: error.message
    });
  }
};


// Refresh token endpoint
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const user = await User.findOne({ refreshToken });

    if (!user || !user.isRefreshTokenValid()) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired refresh token'
      });
    }

    // Generate new tokens
    const accessToken = user.generateToken();
    const newRefreshToken = user.generateRefreshToken();
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during token refresh'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'password does not match'
      });
    }

    // Generate new refresh token
    const refreshToken = user.generateRefreshToken();

    user.lastLogin = new Date();
    await user.save();

    const accessToken = user.generateToken();

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isAuthorized: user.isAuthorized,
        refreshToken: refreshToken,
        accessToken: accessToken,
        lastLogin: user.lastLogin
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login',
      details: error.message
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (user) {
      user.invalidateRefreshToken();
      await user.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during logout',
      details: error.message
    });
  }
};



exports.toggleAuthorization = async (req, res) => {
  try {
    const { email, isAuthorized } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    if (typeof isAuthorized !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid authorization status. Must be a boolean value.'
      });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isAuthorized },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User authorization status updated successfully',
      data: {
        userId: user._id, 
        email: user.email,
        isAuthorized: user.isAuthorized
      }
    });
  } catch (error) {
    console.error('Toggle authorization error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during authorization toggle',
      details: error.message
    });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -refreshToken');
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// Password reset request
exports.resetPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No account associated with this email'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save token and expiry to user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    sendResetEmail(user.username, email, resetToken);

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during password reset request',
      details: error.message
    });
  }
};

exports.requestPayment = async (req, res) => {
  try {
    const { email, totalPrice, country, weight, shipmentType } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No account associated with this email'
      });
    }

    sendPaymentEmail(user.username, email, totalPrice, country, weight, shipmentType);

    res.status(200).json({
      status: 'success',
      message: 'Payment request sent, you will recieve it in your email'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during payment request',
      details: error.message
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        status: 'error',
        message: 'New password does not meet strength requirements'
      });
    }

    // Find user by reset token and check expiry
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
    }

    // Update user password and clear reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during password reset',
      details: error.message
    });
  }
};



// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};