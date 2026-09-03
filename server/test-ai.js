require('dotenv').config();
const { analyzeImageWithGemini } = require('./services/ai/geminiProvider');

async function testAI() {
  console.log('Testing Gemini AI Integration...');
  const testImageUrl = process.env.TEST_IMAGE_URL || 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Pothole_in_the_road.jpg/640px-Pothole_in_the_road.jpg';
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('FAILED: GEMINI_API_KEY is missing from environment variables');
    process.exit(1);
  }

  try {
    console.log(`Using model: ${process.env.GEMINI_MODEL || 'gemini-3.5-flash'}`);
    console.log(`Fetching sample image: ${testImageUrl}`);
    const analysis = await analyzeImageWithGemini(testImageUrl);
    console.log('\n--- SUCCESS ---');
    console.log('AI Response:', JSON.stringify(analysis, null, 2));
    
    // Validate output structure
    if (!analysis.category || !analysis.severity) {
      console.error('\nFAILED: Response missing required fields (category, severity)');
      process.exit(1);
    }
    
    console.log('\nOutput format looks correct!');
  } catch (error) {
    console.error('\n--- FAILED ---');
    console.error(error.message);
    process.exit(1);
  }
}

testAI();
