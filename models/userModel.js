const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');



const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAuthorized: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    refreshToken: { type: String },
    refreshTokenExpiry: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
    lastLogin: { type: Date }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(14);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate access token with shorter expiry
userSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      username: this.username
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',
      issuer: 'SlimPath',
      audience: 'user'
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  this.refreshToken = refreshToken;
  this.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return refreshToken;
};

userSchema.methods.isRefreshTokenValid = function () {
  return this.refreshToken &&
    this.refreshTokenExpiry &&
    new Date() < this.refreshTokenExpiry;
};

userSchema.methods.invalidateRefreshToken = function () {
  this.refreshToken = undefined;
  this.refreshTokenExpiry = undefined;
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);