const mongoose = require('mongoose');

const DEPARTMENTS = [
  'School of Technology',
  'School of Business',
  'Humanities',
  'Campus Services',
  'Administration',
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'faculty', 'staff', 'admin'],
      default: 'student',
    },
    department: { type: String, enum: DEPARTMENTS, required: true },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.DEPARTMENTS = DEPARTMENTS;
