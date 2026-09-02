const Issue = require('../models/Issue');

// @desc    Create new issue
// @route   POST /api/issues
// @access  Private
const createIssue = async (req, res, next) => {
  try {
    const { 
      title, 
      description, 
      category, 
      severity, 
      images, 
      location, 
      aiAnalysis 
    } = req.body;

    if (!title || !description || !category || !severity || !location || !location.coordinates) {
      res.status(400);
      throw new Error('Please provide all required fields including location coordinates');
    }

    const issue = await Issue.create({
      title,
      description,
      category,
      severity,
      images: images || [],
      location: {
        type: 'Point',
        coordinates: location.coordinates, // [longitude, latitude]
        address: location.address || ''
      },
      reportedBy: req.user.id,
      aiAnalysis: aiAnalysis || {},
      timeline: [{
        status: 'Reported',
        user: req.user.id,
        note: 'Issue reported'
      }]
    });

    res.status(201).json(issue);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all issues
// @route   GET /api/issues
// @access  Public
const getIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    next(error);
  }
};

// @desc    Check for duplicate issues nearby
// @route   POST /api/issues/check-duplicates
// @access  Private
const checkDuplicates = async (req, res, next) => {
  try {
    const { coordinates, category } = req.body;
    
    if (!coordinates || !category) {
      res.status(400);
      throw new Error('Coordinates and category are required');
    }

    // Find issues within ~100 meters (maxDistance is in meters for 2dsphere)
    const duplicates = await Issue.find({
      category: category,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates // [lng, lat]
          },
          $maxDistance: 100 // 100 meters radius
        }
      },
      status: { $nin: ['Resolved', 'Closed'] }
    }).limit(3);

    res.json(duplicates);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIssue,
  getIssues,
  checkDuplicates
};
