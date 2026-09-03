require('dotenv').config();
const { analyzeImageWithGemini, model } = require('./services/ai/geminiProvider');

const imageUrl = process.env.TEST_IMAGE_URL;

if (!imageUrl) {
  console.error('Set TEST_IMAGE_URL to a publicly reachable image URL before running this test.');
  process.exit(1);
}

(async () => {
  try {
    console.log(`Testing Gemini model: ${model}`);
    const result = await analyzeImageWithGemini(imageUrl);
    console.log('SUCCESS:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
})();
