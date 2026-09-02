require('dotenv').config();
const { analyzeImageWithGemini } = require('./services/ai/geminiProvider');

(async () => {
  try {
    const result = await analyzeImageWithGemini('dummy_url');
    console.log('SUCCESS:', result);
  } catch (error) {
    console.error('ERROR:', error);
  }
})();
