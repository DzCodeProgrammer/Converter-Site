const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Minimal stub auth (no DB). For real app, use Prisma / hashed passwords.
const USERS = {};
router.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing' });
  USERS[email] = { email, password };
  const token = jwt.sign({ sub: email }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  res.json({ token });
});
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const u = USERS[email];
  if (!u || u.password !== password) return res.status(401).json({ error: 'Invalid' });
  const token = jwt.sign({ sub: email }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  res.json({ token });
});
module.exports = router;
