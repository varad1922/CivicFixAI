const ActivityEvent = require('../models/ActivityEvent');

const logActivity = async (eventType, user = null, issue = null, metadata = {}) => {
  try {
    const event = new ActivityEvent({
      eventType,
      user,
      issue,
      metadata
    });
    await event.save();
    return event;
  } catch (error) {
    console.error('Failed to log activity event:', error);
    // Don't throw - we don't want analytics failures to break core features
  }
};

module.exports = {
  logActivity
};
