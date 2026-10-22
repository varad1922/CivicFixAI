const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? (res.statusCode === 200 ? 500 : res.statusCode) : 500;

  res.status(statusCode);

  let userMessage = err.message;
  if (err.message && (err.message.includes('fetch failed') || err.message.includes('ENOTFOUND'))) {
    userMessage = 'Database connection error: Unable to reach the Supabase host. If your project is on the free tier, it may be paused due to inactivity. Please restore it in your Supabase dashboard.';
  }

  res.json({
    message: userMessage,
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };
