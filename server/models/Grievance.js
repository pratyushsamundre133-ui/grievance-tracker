const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Hostel', 'Academic', 'Mess', 'Infrastructure', 'Other'],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  submittedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Grievance', grievanceSchema);