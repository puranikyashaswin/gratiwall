const mongoose = require('mongoose');

const CATEGORIES = [
  'Student → Faculty',
  'Faculty → Student',
  'Peer-to-Peer',
  'Staff Appreciation',
];

const STATUSES = ['pending', 'approved', 'rejected', 'flagged'];

const noteSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderAnonymous: { type: Boolean, default: false },
    recipientName: { type: String, required: true, trim: true, maxlength: 80 },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    category: { type: String, enum: CATEGORIES, required: true },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    moderatedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, maxlength: 300, default: null },
    // Denormalized at creation: recipient's department when the recipient is
    // registered, otherwise the sender's. Powers wall filters and analytics.
    department: { type: String, default: null },
    applause: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

noteSchema.index({ status: 1, createdAt: -1 });

/**
 * Shape of a note that is safe for the public wall. Anonymous notes must
 * never leak any sender information, so the sender block is removed
 * entirely server-side before the note leaves the API.
 */
noteSchema.methods.toWallJSON = function toWallJSON() {
  const base = {
    id: this._id,
    recipientName: this.recipientName,
    category: this.category,
    message: this.message,
    anonymous: this.senderAnonymous,
    applause: this.applause,
    department: this.department,
    createdAt: this.createdAt,
  };
  if (!this.senderAnonymous && this.sender) {
    const sender = this.sender.name
      ? { name: this.sender.name, role: this.sender.role, department: this.sender.department }
      : null;
    base.sender = sender;
  } else {
    base.sender = null;
  }
  return base;
};

module.exports = mongoose.model('Note', noteSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.STATUSES = STATUSES;
