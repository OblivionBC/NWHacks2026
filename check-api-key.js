// Check API key and list available models
require('dotenv').config();

async function checkApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Checking Gemini API Key...');
  console.log('API Key exists:', !!apiKey);
  console.log('API Key length:', apiKey?.length);
  console.log('API Key (first 20 chars):', apiKey?.substring(0, 20));

  // Try to list models using different API versions
  const urls = [
    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  ];

  for (const url of urls) {
    try {
      console.log(`\n--- Trying to list models: ${url.split('?')[0]} ---`);
      const response = await fetch(url);
      console.log('Status:', response.status, response.statusText);

      const data = await response.json();

      if (response.ok) {
        console.log('✓ SUCCESS! Available models:');
        if (data.models && Array.isArray(data.models)) {
          data.models.forEach(model => {
            console.log(`  - ${model.name}`);
            console.log(`    Display Name: ${model.displayName}`);
            console.log(`    Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
          });
        } else {
          console.log('Response:', JSON.stringify(data, null, 2));
        }
        break;
      } else {
        console.log('✗ Error:', data.error?.message || JSON.stringify(data));
      }
    } catch (error) {
      console.log('✗ Exception:', error.message);
    }
  }

  // Also check if the API key is valid by trying a simple request
  console.log('\n--- Checking API key validity ---');
  const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'test' }] }]
      })
    });

    const data = await response.json();

    if (response.status === 400 && data.error?.message?.includes('API key not valid')) {
      console.log('⚠️  API KEY IS INVALID OR EXPIRED');
      console.log('   Please check your API key at: https://aistudio.google.com/app/apikey');
    } else if (response.status === 403) {
      console.log('⚠️  API KEY HAS RESTRICTIONS');
      console.log('   The API key may have IP restrictions or quota limits');
    } else if (response.status === 404) {
      console.log('ℹ️  API key appears valid, but model not found');
      console.log('   This suggests the API key works but needs proper model configuration');
    } else {
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('Exception during validation:', error.message);
  }
}

checkApiKey();
