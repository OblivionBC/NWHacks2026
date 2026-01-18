// Direct HTTP test of Gemini API
require('dotenv').config();

async function testDirect() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Testing Gemini API with direct HTTP requests...');
  console.log('API Key exists:', !!apiKey);
  console.log('API Key (first 10 chars):', apiKey?.substring(0, 10));

  // Try different API versions and models
  const tests = [
    {
      name: 'v1/gemini-pro',
      url: `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`
    },
    {
      name: 'v1beta/gemini-pro',
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`
    },
    {
      name: 'v1/gemini-1.5-flash',
      url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    },
    {
      name: 'v1beta/gemini-1.5-flash',
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    }
  ];

  const payload = {
    contents: [{
      parts: [{
        text: 'Hello! Say "I am working!" in a friendly way.'
      }]
    }]
  };

  for (const test of tests) {
    try {
      console.log(`\n--- Testing: ${test.name} ---`);
      const response = await fetch(test.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Status:', response.status, response.statusText);

      const data = await response.json();

      if (response.ok) {
        console.log('✓ SUCCESS!');
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log(`\nWorking endpoint: ${test.name}`);
        break;
      } else {
        console.log('✗ Error:', data.error?.message || JSON.stringify(data));
      }
    } catch (error) {
      console.log('✗ Exception:', error.message);
    }
  }
}

testDirect();
