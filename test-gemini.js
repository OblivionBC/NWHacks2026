// Simple test script to verify Gemini API is working
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    console.log('Testing Gemini API...');
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
    console.log('API Key (first 10 chars):', process.env.GEMINI_API_KEY?.substring(0, 10));

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    console.log('Sending test message...');
    const result = await model.generateContent('Say "Hello, I am working!" in a friendly way.');
    const response = await result.response;
    const text = response.text();

    console.log('Success! Response:', text);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testGemini();
