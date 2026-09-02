const { analyzeImageWithGemini } = require('./geminiProvider');

const analyzeIssueImage = async (imageUrl) => {
  if (!imageUrl) {
    throw new Error('Image URL is required for analysis');
  }
  
  try {
    // Delegate to provider
    const analysis = await analyzeImageWithGemini(imageUrl);
    
    // Basic validation of AI response
    if (!analysis || !analysis.category || !analysis.severity) {
      console.warn('AI returned incomplete data:', analysis);
      throw new Error('AI returned incomplete data');
    }
    
    return analysis;
  } catch (err) {
    console.error('Error in analyzeIssueImage:', err.message);
    throw new Error('Failed to analyze image with AI: ' + err.message);
  }
};

module.exports = { analyzeIssueImage };
