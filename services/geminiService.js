import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDbpljh54lbQd2zjp8UfozPlHFeymSMhkA');
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Generate image using Gemini with prompt and reference image
   * @param {string} prompt - The text prompt for image generation
   * @param {string} referenceImageBase64 - Base64 encoded reference image
   * @param {string} mimeType - MIME type of the reference image (e.g., 'image/jpeg', 'image/png')
   * @returns {Promise<Object>} - Generated image data
   */
  async generateImage(prompt, referenceImageBase64, mimeType = 'image/jpeg') {
    try {
      console.log('Starting Gemini image generation...');
      console.log('Prompt:', prompt);
      console.log('Reference image size:', referenceImageBase64 ? referenceImageBase64.length : 'No image');

      // Prepare the reference image for Gemini
      const imagePart = {
        inlineData: {
          data: referenceImageBase64,
          mimeType: mimeType
        }
      };

      // Enhanced prompt for better image generation
      const enhancedPrompt = `Create a stunning, high-quality AI-generated image based on this reference image and the following prompt: "${prompt}". 

      Style requirements:
      - High resolution and detailed
      - Professional photography quality
      - Vibrant colors and good lighting
      - Aurora-like glowing effects if appropriate
      - Modern and aesthetic appeal
      
      Use the reference image as inspiration for composition, style, and visual elements, but create a completely new and unique image that follows the prompt description.`;

      const result = await this.model.generateContent([
        enhancedPrompt,
        imagePart
      ]);

      const response = await result.response;
      const generatedImages = response.candidates[0].content.parts;

      console.log('Gemini generation completed successfully');
      
      return {
        success: true,
        images: generatedImages,
        prompt: prompt,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in Gemini image generation:', error);
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  }

  /**
   * Generate image with only text prompt (no reference image)
   * @param {string} prompt - The text prompt for image generation
   * @returns {Promise<Object>} - Generated image data
   */
  async generateImageFromPrompt(prompt) {
    try {
      console.log('Starting Gemini text-to-image generation...');
      console.log('Prompt:', prompt);

      const enhancedPrompt = `Create a stunning, high-quality AI-generated image based on this prompt: "${prompt}". 

      Style requirements:
      - High resolution and detailed
      - Professional photography quality
      - Vibrant colors and good lighting
      - Aurora-like glowing effects if appropriate
      - Modern and aesthetic appeal`;

      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      const generatedImages = response.candidates[0].content.parts;

      console.log('Gemini text-to-image generation completed successfully');
      
      return {
        success: true,
        images: generatedImages,
        prompt: prompt,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in Gemini text-to-image generation:', error);
      throw new Error(`Gemini text-to-image generation failed: ${error.message}`);
    }
  }

  /**
   * Test Gemini API connection
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    try {
      const result = await this.model.generateContent("Hello, test connection");
      return true;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}

export default new GeminiService();
