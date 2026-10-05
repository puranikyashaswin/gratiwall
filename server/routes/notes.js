const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/Note');
const User = require('../models/User');
const { protect, dbUnavailable } = require('../middleware/auth');
const { getIO } = require('../utils/socket');

const router = express.Router();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// POST /api/notes: create a note (enters the moderation queue as pending)
router.post('/', protect, async (req, res, next) => {
  try {
    const { recipientName, recipientId, category, message, senderAnonymous } = req.body || {};
    if (!category || !Note.CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Please choose a valid category.' });
    }
    if (!message || !message.trim()) return res.status(400).json({ message: 'A message is required.' });
    if (message.trim().length > 500) return res.status(400).json({ message: 'Messages are limited to 500 characters.' });

    let recipient = null;
    let finalName = (recipientName || '').trim();
    if (recipientId) {
      if (!mongoose.isValidObjectId(recipientId)) {
        return res.status(400).json({ message: 'Invalid recipient.' });
      }
      recipient = await User.findById(recipientId);
      if (!recipient) return res.status(400).json({ message: 'Recipient not found.' });
      if (recipient._id.equals(req.user._id)) {
        return res.status(400).json({ message: 'You cannot send a note to yourself.' });
      }
      finalName = recipient.name;
    }
    if (!finalName) return res.status(400).json({ message: 'Please name a recipient.' });

    const note = await Note.create({
      sender: req.user._id,
      senderAnonymous: Boolean(senderAnonymous),
      recipientName: finalName,
      recipient: recipient ? recipient._id : null,
      category,
      message: message.trim(),
      department: recipient ? recipient.department : req.user.department,
    });
    return res.status(201).json({
      note: { id: note._id, status: note.status, createdAt: note.createdAt },
      message: 'Your note has been sent to the moderation queue.',
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/notes/mine: the caller's own notes with their moderation status
router.get('/mine', protect, async (req, res, next) => {
  try {
    const notes = await Note.find({ sender: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.json({
      notes: notes.map((n) => ({
        id: n._id,
        recipientName: n.recipientName,
        category: n.category,
        message: n.message,
        status: n.status,
        anonymous: n.senderAnonymous,
        applause: n.applause,
        rejectionReason: n.rejectionReason,
        createdAt: n.createdAt,
        moderatedAt: n.moderatedAt,
      })),
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/notes/wall: public, approved notes only, newest first, paginated.
// Optional filters: ?category= and ?department= (exact matches).
router.get('/wall', async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return dbUnavailable(res);
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || 24));
    const filter = { status: 'approved' };
    if (req.query.category) {
      if (!Note.CATEGORIES.includes(req.query.category)) {
        return res.status(400).json({ message: 'Invalid category filter.' });
      }
      filter.category = req.query.category;
    }
    if (req.query.department) filter.department = req.query.department;
    const [total, notes] = await Promise.all([
      Note.countDocuments(filter),
      Note.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('sender', 'name role department'),
    ]);
    return res.json({
      notes: notes.map((n) => n.toWallJSON()),
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      total,
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/notes/to/:name: approved notes addressed to a person, senders stripped
router.get('/to/:name', async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return dbUnavailable(res);
  try {
    const name = (req.params.name || '').trim();
    if (!name) return res.status(400).json({ message: 'A recipient name is required.' });
    const notes = await Note.find({
      status: 'approved',
      recipientName: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name role department');
    if (notes.length === 0) return res.status(404).json({ message: 'No published notes for this person.' });

    const departments = [
      ...new Set(
        notes
          .filter((n) => !n.senderAnonymous && n.sender && n.sender.department)
          .map((n) => n.sender.department)
      ),
    ];
    return res.json({
      recipient: {
        name: notes[0].recipientName,
        total: notes.length,
        applause: notes.reduce((sum, n) => sum + n.applause, 0),
        departments,
      },
      notes: notes.map((n) => n.toWallJSON()),
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/notes/:id/applaud: unauthenticated applause counter, one per browser
// (enforced client-side via localStorage; the counter itself lives on the note)
router.post('/:id/applaud', async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return dbUnavailable(res);
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid note id.' });
    }
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, status: 'approved' },
      { $inc: { applause: 1 } },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found on the wall.' });
    const io = getIO();
    if (io) io.emit('note:applause', { id: note._id.toString(), applause: note.applause });
    return res.json({ id: note._id, applause: note.applause });
  } catch (err) {
    return next(err);
  }
});

// GET /api/notes/recipients?q=: search people for the recipient picker
router.get('/recipients', protect, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ recipients: [] });
    const users = await User.find({
      _id: { $ne: req.user._id },
      role: { $ne: 'admin' },
      name: { $regex: escapeRegex(q), $options: 'i' },
    })
      .select('name role department')
      .limit(10)
      .lean();
    return res.json({
      recipients: users.map((u) => ({
        id: u._id,
        name: u.name,
        role: u.role,
        department: u.department,
      })),
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
