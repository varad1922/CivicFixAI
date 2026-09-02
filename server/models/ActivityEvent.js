const mongoose = require('mongoose');

const ActivityEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: [
      'USER_REGISTERED',
      'USER_LOGGED_IN',
      'ISSUE_REPORT_STARTED',
      'IMAGE_UPLOADED',
      'LOCATION_SELECTED',
      'AI_ANALYSIS_STARTED',
      'AI_ANALYSIS_COMPLETED',
      'ISSUE_SUBMITTED',
      'ISSUE_SUPPORTED',
      'ISSUE_VERIFIED'
    ]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: false
  },
  metadata: {
    type: Object,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ActivityEvent', ActivityEventSchema);
