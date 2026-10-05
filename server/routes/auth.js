const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { signToken, protect, dbUnavailable } = require('../middleware/auth');

const router = express.Router();

const EMAIL_RE = /^\S+@\S+\.\S+$/;

router.post('/register', async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return dbUnavailable(res);
  try {
    const { name, email, password, role, department } = req.body || {};
    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: 'Name, email, password and department are required.' });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Please provide a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (role && !['student', 'faculty', 'staff'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    if (!User.DEPARTMENTS.includes(department)) {
      return res.status(400).json({ message: 'Invalid department.' });
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || 'student',
      department,
    });
    const token = signToken(user);
    return res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return dbUnavailable(res);
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Incorrect email or password.' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Incorrect email or password.' });
    const token = signToken(user);
    return res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
});

router.get('/me', protect, (req, res) => {
  return res.json({ user: req.user.toSafeJSON() });
});

module.exports = router;
