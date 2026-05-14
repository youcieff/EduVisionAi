const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendOtpEmail } = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

const register = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, specialization, university } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists',
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      phone,
      specialization,
      university,
      otp: hashedOtp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      isEmailVerified: false
    });

    try {
      await sendOtpEmail(user.email, otp, user.username);
    } catch (emailError) {
      console.error('Email Error:', emailError);
      // Even if email fails, we register the user, they can retry
    }

    res.status(201).json({
      status: 'success',
      message: 'OTP sent to email. Please verify to continue.',
      data: {
        userId: user._id,
        email: user.email
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred during registration',
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ status: 'error', message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email }).select('+otp +otpExpires');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ status: 'error', message: 'Email already verified' });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ status: 'error', message: 'OTP has expired. Please request a new one.' });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Invalid OTP code' });
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
      data: {
        user: user.getPublicProfile(),
        token,
      },
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ status: 'error', message: 'Server error during verification' });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: 'error', message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ status: 'error', message: 'Already verified' });

    const otp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    user.otp = hashedOtp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendOtpEmail(user.email, otp, user.username);
    } catch (emailError) {
      console.error('Email Error:', emailError);
      return res.status(500).json({ status: 'error', message: 'Failed to send email. Please try again later.' });
    }

    res.status(200).json({ status: 'success', message: 'OTP resent successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Email verification is only enforced during registration flow

    // Get password separately
    const userWithPassword = await User.findById(user._id).select('+password');
    
    if (!userWithPassword || !userWithPassword.password) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    const isPasswordCorrect = await userWithPassword.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      data: {
        user: user.getPublicProfile(),
        token,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login',
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred',
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, avatar, phone, specialization, university } = req.body;

    const user = await User.findById(req.user.id);

    if (fullName) user.fullName = fullName;
    if (avatar) user.avatar = avatar;
    if (phone) user.phone = phone;
    if (specialization) user.specialization = specialization;
    if (university) user.university = university;

    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating profile',
    });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload an image file',
      });
    }

    const avatarUrl = `/uploads/images/${req.file.filename}`;
    const user = await User.findById(req.user.id);
    user.avatar = avatarUrl;
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        user: user.getPublicProfile(),
      },
      message: 'Photo updated successfully',
    });
  } catch (error) {
    console.error('Avatar Update Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload photo. Please try again.',
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        status: 'error',
        message: 'Incorrect current password',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while changing password',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  uploadAvatar,
  verifyOtp,
  resendOtp
};