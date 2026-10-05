const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/Note');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');
const { getIO } = require('../utils/socket');

const router = express.Router();

router.use(protect, requireRole('admin'));

function toAdminJSON(note) {
  return {
    id: note._id,
    recipientName: note.recipientName,
    category: note.category,
    message: note.message,
    status: note.status,
    anonymous: note.senderAnonymous,
    sender: note.sender
      ? { id: note.sender._id, name: note.sender.name, role: note.sender.role, department: note.sender.department }
      : null,
    moderatedBy: note.moderatedBy ? { name: note.moderatedBy.name } : null,
    moderatedAt: note.moderatedAt,
    rejectionReason: note.rejectionReason,
    createdAt: note.createdAt,
  };
}

// GET /api/admin/notes?status=pending:moderation queue. Admins always see
// the real sender, even for notes that will be anonymous on the public wall.
router.get('/notes', async (req, res, next) => {
  try {
    const status = (req.query.status || 'pending').toString();
    const filter = status === 'all' ? {} : { status };
    if (status !== 'all' && !Note.STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status filter.' });
    }
    const notes = await Note.find(filter)
      .sort(status === 'pending' ? { createdAt: 1 } : { moderatedAt: -1 })
      .limit(200)
      .populate('sender', 'name role department')
      .populate('moderatedBy', 'name');
    return res.json({ notes: notes.map(toAdminJSON) });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/admin/notes/:id:{ action: "approve" | "reject" | "flag", reason? }
router.patch('/notes/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid note id.' });
    }
    const { action, reason } = req.body || {};
    const statusByAction = { approve: 'approved', reject: 'rejected', flag: 'flagged' };
    const newStatus = statusByAction[action];
    if (!newStatus) return res.status(400).json({ message: 'Action must be approve, reject or flag.' });

    const note = await Note.findById(req.params.id).populate('sender', 'name role department');
    if (!note) return res.status(404).json({ message: 'Note not found.' });

    note.status = newStatus;
    note.moderatedBy = req.user._id;
    note.moderatedAt = new Date();
    note.rejectionReason =
      newStatus === 'rejected' ? (reason || '').trim() || 'Did not meet community guidelines.' : null;
    await note.save();
    await note.populate('moderatedBy', 'name');

    if (newStatus === 'approved') {
      const io = getIO();
      if (io) io.emit('note:published', note.toWallJSON());

      if (note.recipient) {
        const recipient = await User.findById(note.recipient).select('name email');
        if (recipient) {
          await sendEmail({
            to: recipient.email,
            subject: 'Someone appreciated you on GratiWall',
            text:
              `Hi ${recipient.name},\n\n` +
              `A thank-you note addressed to you was just published on GratiWall, the campus appreciation wall.\n\n` +
              `"${note.message}"\n\n` +
              `${note.senderAnonymous ? 'From: Anonymous' : `From: ${note.sender ? note.sender.name : 'A member of campus'}`}\n\n` +
              `Category: ${note.category}\n\n` +
              `Open the wall to see it live.\nThe GratiWall team`,
          });
        }
      }
    }

    return res.json({ note: toAdminJSON(note) });
  } catch (err) {
    return next(err);
  }
});

// GET /api/admin/analytics:dashboard aggregations
router.get('/analytics', async (req, res, next) => {
  try {
    const now = new Date();
    const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7)); // Monday

    const [byDepartment, trendRaw, topRecipients, totalsRaw, thisWeek] = await Promise.all([
      // Notes per department: recipient's department when the recipient is a
      // registered user, otherwise the sender's department.
      Note.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'recipient',
            foreignField: '_id',
            as: 'recipientUser',
          },
        },
        { $unwind: { path: '$recipientUser', preserveNullAndEmptyArrays: true } },
        {
          $lookup: { from: 'users', localField: 'sender', foreignField: '_id', as: 'senderUser' },
        },
        { $unwind: { path: '$senderUser', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            department: {
              $ifNull: ['$recipientUser.department', { $ifNull: ['$senderUser.department', 'Unknown'] }],
            },
          },
        },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Notes per category, bucketed by ISO week, last 8 weeks.
      Note.aggregate([
        { $match: { createdAt: { $gte: eightWeeksAgo } } },
        {
          $group: {
            _id: {
              year: { $isoWeekYear: '$createdAt' },
              week: { $isoWeek: '$createdAt' },
              category: '$category',
            },
            count: { $sum: 1 },
          },
        },
      ]),
      // Top 10 most-appreciated recipients (approved notes only).
      Note.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$recipientName', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 10 },
      ]),
      Note.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Note.countDocuments({ createdAt: { $gte: startOfWeek } }),
    ]);

    // Build a complete 8-week grid (oldest → newest) with zero-filled weeks.
    const weeks = [];
    const cursor = new Date(eightWeeksAgo);
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7)); // back to Monday
    const lookup = new Map();
    for (const row of trendRaw) {
      lookup.set(`${row._id.year}-${row._id.week}-${row._id.category}`, row.count);
    }
    while (cursor <= now) {
      const [year, week] = isoYearWeek(cursor);
      const point = {
        weekLabel: cursor.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      };
      for (const category of Note.CATEGORIES) {
        point[category] = lookup.get(`${year}-${week}-${category}`) || 0;
      }
      weeks.push(point);
      cursor.setDate(cursor.getDate() + 7);
    }

    const totals = { pending: 0, approved: 0, rejected: 0, flagged: 0 };
    for (const row of totalsRaw) totals[row._id] = row.count;

    return res.json({
      byDepartment: byDepartment.map((d) => ({ department: d._id, count: d.count })),
      categoryTrend: { categories: Note.CATEGORIES, weeks },
      topRecipients: topRecipients.map((r) => ({ name: r._id, count: r.count })),
      totals: { ...totals, all: totals.pending + totals.approved + totals.rejected + totals.flagged },
      thisWeek,
    });
  } catch (err) {
    return next(err);
  }
});

function isoYearWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return [d.getUTCFullYear(), week];
}

module.exports = router;
