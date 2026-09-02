const supabase = require('../config/supabase');

const logActivity = async (eventType, user = null, issue = null, metadata = {}) => {
  try {
    const { data: event, error } = await supabase
      .from('activity_events')
      .insert({
        event_type: eventType,
        user_id: user,
        issue_id: issue,
        metadata
      })
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    
    return event;
  } catch (error) {
    console.error('Failed to log activity event:', error);
  }
};

module.exports = {
  logActivity
};
