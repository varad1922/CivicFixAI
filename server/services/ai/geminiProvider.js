const { GoogleGenAI } = require('@google/genai');

const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const fetchImageAsBase64 = async (imageUrl) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(imageUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`Image URL returned HTTP ${response.status}`);

    const mimeType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!mimeType.startsWith('image/')) throw new Error(`Image URL is not an image (received ${mimeType || 'unknown content type'})`);

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) throw new Error('Image is empty');
    if (buffer.length > 10 * 1024 * 1024) throw new Error('Image is larger than 10MB');

    return { data: buffer.toString('base64'), mimeType };
  } finally {
    clearTimeout(timeout);
  }
};

const parseJson = (text) => {
  const cleaned = String(text || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini returned an invalid JSON response');
  }
};

const analyzeImageWithGemini = async (imageUrl) => {
  if (!apiKey || !ai) throw new Error('GEMINI_API_KEY is not configured on the server');
  if (!imageUrl) throw new Error('Image URL is required for analysis');

  const prompt = `Analyze this civic issue photo and return ONLY valid JSON.\n\nRequired schema:\n{\n  "category": "Pothole | Garbage Accumulation | Water Leakage | Broken Streetlight | Drainage Issue | Damaged Road | Illegal Dumping | Traffic Signal Issue | Public Property Damage | Other",\n  "severity": "Low | Medium | High | Critical",\n  "confidence": number,\n  "suggestedTitle": string,\n  "suggestedDescription": string,\n  "safetyImpact": string\n}\n\nconfidence must be 0-100. Do not invent details that are not visible in the image.`;

  try {
    const image = await fetchImageAsBase64(imageUrl);
    const response = await ai.models.generateContent({
      model,
      contents: [
        prompt,
        { inlineData: image }
      ],
      config: { responseMimeType: 'application/json' }
    });

    const responseText = typeof response.text === 'function' ? await response.text() : response.text;
    const analysis = parseJson(responseText);

    const categories = new Set(['Pothole', 'Garbage Accumulation', 'Water Leakage', 'Broken Streetlight', 'Drainage Issue', 'Damaged Road', 'Illegal Dumping', 'Traffic Signal Issue', 'Public Property Damage', 'Other']);
    const severities = new Set(['Low', 'Medium', 'High', 'Critical']);
    if (!categories.has(analysis.category)) analysis.category = 'Other';
    if (!severities.has(analysis.severity)) analysis.severity = 'Medium';
    analysis.confidence = Math.max(0, Math.min(100, Number(analysis.confidence) || 0));
    analysis.suggestedTitle = String(analysis.suggestedTitle || 'Civic issue').slice(0, 100);
    analysis.suggestedDescription = String(analysis.suggestedDescription || 'Please review and add details about the reported issue.').slice(0, 1000);
    analysis.safetyImpact = String(analysis.safetyImpact || 'Review local safety impact.').slice(0, 500);

    return analysis;
  } catch (error) {
    console.error(`Gemini API Error [${model}]:`, error.message || error);
    throw new Error(`Gemini analysis failed: ${error.message || 'unknown error'}`);
  }
};

module.exports = { analyzeImageWithGemini, model };
