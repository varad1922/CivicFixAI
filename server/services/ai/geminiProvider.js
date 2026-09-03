const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const analyzeImageWithGemini = async (imageUrl) => {
  try {
    const prompt = `
      Analyze this civic issue report. 
      Provide a JSON response with the following keys exactly:
      "category" (must be one of: Pothole, Garbage Accumulation, Water Leakage, Broken Streetlight, Drainage Issue, Damaged Road, Illegal Dumping, Traffic Signal Issue, Public Property Damage, Other),
      "severity" (Low, Medium, High, Critical),
      "confidence" (number 0-100),
      "suggestedTitle" (string),
      "suggestedDescription" (string),
      "safetyImpact" (string).
      Return only valid JSON.
    `;
    
    // We need to fetch the image and pass it as inlineData, or if it's a public URL, we might need to fetch it first.
    // To be safe, we'll fetch the image as a buffer and pass it as inlineData.
    const imageResp = await fetch(imageUrl);
    const arrayBuffer = await imageResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          { text: prompt },
          { inlineData: { data: buffer.toString('base64'), mimeType } }
        ],
        config: {
          responseMimeType: 'application/json'
        }
    });

    const responseText = response.text;
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Gemini API Error:', error.message || error);
    throw new Error(error.message || 'Failed to analyze image with AI');
  }
};

module.exports = { analyzeImageWithGemini };
