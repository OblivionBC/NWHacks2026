/**
 * Gemini AI Service
 *
 * This service handles communication with the Google Gemini API
 * for generating AI responses in the chat.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini API with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate an AI response using Gemini
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Array of previous messages {role: 'user'|'model', parts: [{text: string}]}
 * @returns {Promise<string>} - The AI's response
 */
async function generateGeminiResponse(userMessage, conversationHistory = []) {
  try {
    console.log('Generating Gemini response...');
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
    console.log('History length:', conversationHistory.length);

    // Get the generative model (using gemini-2.5-flash)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // If no conversation history, use simple generation
    if (conversationHistory.length === 0) {
      console.log('No history, using simple generation');
      const result = await model.generateContent(userMessage);
      const response = await result.response;
      const text = response.text();
      return text;
    }

    // Build the chat history
    const history = conversationHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    console.log('Starting chat with history...');
    // Start a chat session with history
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    // Send the user message and get response
    console.log('Sending message to Gemini...');
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini response received, length:', text.length);
    return text;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

/**
 * Generate a simple response without conversation history
 * @param {string} userMessage - The user's message
 * @returns {Promise<string>} - The AI's response
 */
async function generateSimpleResponse(userMessage) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating simple Gemini response:', error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

/**
 * Generate a chat title from user prompt using keyword extraction
 * @param {string} userPrompt - The user's first message/prompt
 * @returns {Promise<string>} - A concise title based on keywords
 */
async function generateChatTitle(userPrompt) {
  try {
    console.log('Generating chat title from prompt:', userPrompt);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Extract 3-5 key words or a short phrase (max 6 words) that best describes this user query. Return only the keywords/phrase, nothing else. Make it concise and descriptive:\n\n${userPrompt}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const title = response.text().trim();

    // Clean up the title - remove quotes if present, limit length
    let cleanTitle = title.replace(/^["']|["']$/g, '').trim();
    
    // If title is too long, truncate it
    if (cleanTitle.length > 50) {
      cleanTitle = cleanTitle.substring(0, 47) + '...';
    }

    // Fallback if title is empty or too short
    if (!cleanTitle || cleanTitle.length < 2) {
      cleanTitle = userPrompt.substring(0, 30).trim() + (userPrompt.length > 30 ? '...' : '');
    }

    console.log('Generated chat title:', cleanTitle);
    return cleanTitle;
  } catch (error) {
    console.error('Error generating chat title:', error);
    // Fallback to a simple extraction from the prompt
    const words = userPrompt.split(/\s+/).slice(0, 5).join(' ');
    return words.length > 0 ? words : 'New Chat';
  }
}

module.exports = {
  generateGeminiResponse,
  generateSimpleResponse,
  generateChatTitle
};
