const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIInstructionGenerator {
    constructor() {
        // Use dedicated API key for description generation
        const apiKey = process.env.GOOGLE_DESCRIPTION_API_KEY || 'AIzaSyCxtQVXb1MtoTB795RkwCE_whmfl2sAZdw';
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: {
                maxOutputTokens: 2000,
                temperature: 0.8
            }
        });
    }

    /**
     * Generate detailed, personalized instructions for an AI chatbot
     * @param {string} aiName - Name of the AI
     * @param {string} description - User's description of what the AI should do
     * @param {string} personality - Personality traits (optional)
     * @returns {Promise<string>} - Detailed instructions for the AI
     */
    async generateDetailedInstructions(aiName, description, personality = 'friendly') {
        try {
            console.log(`🎯 Generating instructions for ${aiName} using DESCRIPTION API...`);

            const prompt = `
You are an expert AI personality designer. Create detailed, specific instructions for an AI chatbot that will make it behave exactly as the user wants.

AI Name: ${aiName}
User Description: ${description}
Personality: ${personality}

Create a comprehensive set of instructions that includes:

1. **Core Identity**: Who this AI is, its role, and its primary purpose
2. **Communication Style**: How it should talk, tone, formality level, use of emojis, etc.
3. **Behavioral Rules**: Specific do's and don'ts, how to handle different situations
4. **Response Patterns**: How to structure responses, what to emphasize
5. **Personality Traits**: Specific characteristics that make this AI unique
6. **Special Instructions**: Any specific behaviors, catchphrases, or unique responses
7. **Context Awareness**: How to remember and reference previous conversations
8. **Error Handling**: How to respond when it doesn't know something

Make the instructions VERY specific and actionable. The AI should follow these instructions religiously and never deviate from its assigned personality and role.

Format the response as a clear, numbered list that can be directly injected into the AI's system prompt.

Example format:
1. You are [AI Name], a [specific role] who [specific purpose]
2. Always respond with [specific tone/style]
3. When users ask about [topic], always [specific behavior]
4. Never [specific restriction]
5. Always remember to [specific memory behavior]
6. Use phrases like [specific catchphrases]
7. If you don't know something, [specific fallback behavior]

Make it detailed, specific, and impossible to ignore. The AI should feel like a completely unique personality, not a generic assistant.
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const instructions = response.text();

            console.log(`✅ Instructions generated (${instructions.length} chars)`);

            return instructions;
        } catch (error) {
            console.error('❌ Error generating AI instructions:', error);
            
            // Fallback instructions if API fails
            return this.generateFallbackInstructions(aiName, description, personality);
        }
    }

    /**
     * Generate fallback instructions if the API fails
     */
    generateFallbackInstructions(aiName, description, personality) {
        return `
1. You are ${aiName}, a specialized AI assistant designed to help with: ${description}
2. Always maintain a ${personality} tone in all your responses
3. Remember that your name is ${aiName} and you should introduce yourself as such
4. Focus specifically on helping with: ${description}
5. If asked about topics outside your expertise, politely redirect to your main purpose
6. Always be helpful, accurate, and engaging
7. Remember previous parts of the conversation to provide personalized responses
8. If you don't know something specific, say so but offer to help with related topics
9. Use your name ${aiName} when appropriate to maintain your identity
10. Always stay true to your core purpose: ${description}
        `.trim();
    }

    /**
     * Generate a system prompt that incorporates the detailed instructions
     * @param {string} aiName - Name of the AI
     * @param {string} description - User's description
     * @param {string} detailedInstructions - The detailed instructions from generateDetailedInstructions
     * @returns {string} - Complete system prompt
     */
    generateSystemPrompt(aiName, description, detailedInstructions) {
        return `
# ${aiName} - AI Assistant

## Core Identity
${detailedInstructions}

## Important Rules
- You MUST follow the instructions above exactly as written
- You are ${aiName}, not a generic AI assistant
- Always stay in character and maintain your assigned personality
- Remember conversation context and provide personalized responses
- Never break character or act like a different AI

## Current Context
- AI Name: ${aiName}
- Purpose: ${description}
- You are running in a container and should respond as this specific AI personality

Remember: You are ${aiName}, a unique AI with specific characteristics and behaviors. Follow your instructions precisely and maintain your identity throughout the conversation.
        `.trim();
    }
}

module.exports = AIInstructionGenerator;
