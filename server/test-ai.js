require('dotenv').config();
const { analyzeImageWithGemini, model } = require('./services/ai/geminiProvider');

async function test() {
  console.log('Testing Gemini AI Pipeline');
  console.log('Model:', model);
  if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY is missing');
    process.exit(1);
  }
  console.log('API Key configured: YES');
  
  // Use a reliable test image url
  const testImageUrl = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80';
  console.log('Test Image URL:', testImageUrl);
  
  try {
    console.log('Sending to Gemini...');
    const result = await analyzeImageWithGemini(testImageUrl);
    console.log('✅ Analysis Successful:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ AI Analysis Failed:', error.message);
    process.exit(1);
  }
}

test();
