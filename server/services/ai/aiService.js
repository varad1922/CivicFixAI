const { analyzeImageWithGemini } = require('./geminiProvider');

const analyzeIssueImage = async (imageUrl) => {
  if (!imageUrl) {
    throw new Error('Image URL is required for analysis');
  }
  
  // Delegate to provider
  const analysis = await analyzeImageWithGemini(imageUrl);
  
  // Basic validation of AI response
  if (!analysis.category || !analysis.severity) {
    throw new Error('AI returned incomplete data');
  }
  
  return analysis;
};

module.exports = { analyzeIssueImage };
