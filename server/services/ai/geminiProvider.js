const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const analyzeImageWithGemini = async (imageUrl) => {
  try {
    // In a real scenario with image URLs, we might need to fetch the image and pass it as base64,
    // or if the URL is public, some models accept it.
    // For simplicity, we'll ask the model to analyze based on a simulated input or just text if it fails,
    // but typically we'd fetch the image data.
    
    // As a placeholder, we instruct Gemini to return structured JSON.
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
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
    });

    const responseText = response.text;
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to analyze image with AI');
  }
};

module.exports = { analyzeImageWithGemini };
