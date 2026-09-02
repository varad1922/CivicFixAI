const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title for the issue'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please specify a category'],
    enum: [
      'Pothole',
      'Garbage Accumulation',
      'Water Leakage',
      'Broken Streetlight',
      'Drainage Issue',
      'Damaged Road',
      'Illegal Dumping',
      'Traffic Signal Issue',
      'Public Property Damage',
      'Other'
    ]
  },
  severity: {
    type: String,
    required: [true, 'Please specify a severity level'],
    enum: ['Low', 'Medium', 'High', 'Critical']
  },
  status: {
    type: String,
    enum: ['Reported', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    default: 'Reported'
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String
    }
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    },
    address: {
      type: String
    }
  },
  reportedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  supportCount: {
    type: Number,
    default: 0
  },
  priorityScore: {
    type: Number,
    default: 0
  },
  aiAnalysis: {
    category: String,
    severity: String,
    confidence: Number,
    suggestedTitle: String,
    suggestedDescription: String,
    safetyImpact: String
  },
  timeline: [{
    status: {
      type: String,
      enum: ['Reported', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    note: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Issue', issueSchema);
