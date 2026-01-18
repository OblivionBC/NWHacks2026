// Script to list available Gemini models
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    console.log('Listing available Gemini models...');
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try to list models
    const models = await genAI.listModels();

    console.log('\nAvailable models:');
    for await (const model of models) {
      console.log('- Model:', model.name);
      console.log('  Display name:', model.displayName);
      console.log('  Supported methods:', model.supportedGenerationMethods);
      console.log('');
    }
  } catch (error) {
    console.error('Error listing models:', error.message);
    console.log('\nTrying common model names directly...');

    const commonModels = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'models/gemini-pro',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash'
    ];

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    for (const modelName of commonModels) {
      try {
        console.log(`\nTrying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        const response = await result.response;
        const text = response.text();
        console.log(`✓ SUCCESS! Model "${modelName}" works!`);
        console.log(`  Response: ${text.substring(0, 50)}...`);
        break;
      } catch (err) {
        console.log(`✗ Failed: ${err.message}`);
      }
    }
  }
}

listModels();
