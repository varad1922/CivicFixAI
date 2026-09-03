const { analyzeImageWithGemini } = require('./geminiProvider');

const analyzeIssueImage = async (imageUrl) => {
  if (!imageUrl) throw new Error('Image URL is required for analysis');
  const analysis = await analyzeImageWithGemini(imageUrl);
  if (!analysis?.category || !analysis?.severity) throw new Error('AI returned incomplete analysis');
  return analysis;
};

module.exports = { analyzeIssueImage };
