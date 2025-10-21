import imageGenerationService from '../services/imageGenerationService.js';
import { readDB, writeDB, getDB } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate image using Gemini with promptId and reference image
 * POST /api/gemini/generate
 * Body: { promptId: string, referenceImage: string, mimeType?: string }
 */
const generateImage = async (req, res) => {
  try {
    // Handle both JSON and form-data
    let promptId, referenceImage, mimeType;
    
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      // JSON request
      ({ promptId, referenceImage, mimeType = 'image/jpeg' } = req.body);
    } else {
      // Form-data request
      promptId = req.body.promptId || req.body.promptid;
      mimeType = req.body.mimeType || 'image/jpeg';
      
      // Handle file upload from multer
      if (req.files && req.files.length > 0) {
        const file = req.files[0];
        referenceImage = file.buffer.toString('base64');
        mimeType = file.mimetype || mimeType;
      } else {
        referenceImage = req.body.referenceImage;
      }
    }

    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);

    // Validate required fields
    if (!promptId) {
      return res.status(400).json({
        success: false,
        message: 'promptId is required',
        received: req.body
      });
    }

    if (!referenceImage) {
      return res.status(400).json({
        success: false,
        message: 'referenceImage is required'
      });
    }

    console.log('Generating image with promptId:', promptId);

    // Fetch prompt from database using promptId
    console.log('Searching for promptId:', promptId);
    
    // First, let's check what collections exist
    const database = getDB();
    const collections = await database.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    const existingImages = await readDB('images', { promptId: promptId });
    console.log('Found images:', existingImages.length);
    
    if (existingImages.length === 0) {
      // Try to get all images to debug
      const allImages = await readDB('images', {});
      console.log('Total images in database:', allImages.length);
      if (allImages.length > 0) {
        console.log('Sample image:', allImages[0]);
      }
      
      return res.status(404).json({
        success: false,
        message: 'No prompt found with the provided promptId',
        debug: {
          searchedFor: promptId,
          totalImages: allImages.length,
          collections: collections.map(c => c.name),
          sampleImage: allImages.length > 0 ? {
            promptId: allImages[0].promptId,
            promptName: allImages[0].promptName
          } : null
        }
      });
    }

    // Get the prompt from the first image (they should all have the same prompt)
    const promptData = existingImages[0];
    const promptText = promptData.prompt;
    const promptName = promptData.promptName;

    console.log('Found prompt:', promptName);
    console.log('Prompt text:', promptText);

    // Generate image using image generation service
    const imageResult = await imageGenerationService.generateImage(
      promptText,
      referenceImage,
      mimeType
    );

    if (!imageResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Image generation failed',
        error: imageResult.error
      });
    }

    // Save the generated image to database
    const imageData = {
      _id: uuidv4(),
      promptId: promptId,
      promptName: promptName,
      prompt: promptText,
      base64Image: imageResult.images[0].inlineData.data,
      originalName: 'ai-generated-image.jpg',
      size: imageResult.images[0].inlineData.data.length,
      mimetype: 'image/jpeg',
      createdAt: new Date().toISOString(),
      type: 'generated' // Mark as generated image
    };

    await writeDB('generated_images', imageData);

    console.log('Image saved to database with ID:', imageData._id);

    res.status(200).json({
      success: true,
      message: 'Image generated successfully',
      data: {
        imageId: imageData._id,
        promptId: promptId,
        promptName: promptName,
        base64Image: imageData.base64Image,
        createdAt: imageData.createdAt
      }
    });

  } catch (error) {
    console.error('Error in generateImage controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Generate image using only text prompt (no reference image)
 * POST /api/gemini/generate-text
 * Body: { prompt: string }
 */
const generateImageFromText = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'prompt is required'
      });
    }

    console.log('Generating image from text prompt:', prompt);

    // Generate image using image generation service
    const imageResult = await imageGenerationService.generateImageFromText(prompt);

    if (!imageResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Image generation failed',
        error: imageResult.error
      });
    }

    // Save the generated image to database
    const imageData = {
      _id: uuidv4(),
      promptId: null, // No promptId for text-only generation
      promptName: 'Text Prompt',
      prompt: prompt,
      base64Image: imageResult.images[0].inlineData.data,
      originalName: 'ai-text-generated-image.jpg',
      size: imageResult.images[0].inlineData.data.length,
      mimetype: 'image/jpeg',
      createdAt: new Date().toISOString(),
      type: 'generated' // Mark as generated image
    };

    await writeDB('generated_images', imageData);

    console.log('Text-generated image saved to database with ID:', imageData._id);

    res.status(200).json({
      success: true,
      message: 'Image generated successfully from text',
      data: {
        imageId: imageData._id,
        prompt: prompt,
        base64Image: imageData.base64Image,
        createdAt: imageData.createdAt
      }
    });

  } catch (error) {
    console.error('Error in generateImageFromText controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Test Gemini API connection
 * GET /api/gemini/test
 */
const testConnection = async (req, res) => {
  try {
    const isConnected = await imageGenerationService.testConnection();
    
    if (isConnected) {
      res.status(200).json({
        success: true,
        message: 'Gemini API connection successful'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gemini API connection failed'
      });
    }
  } catch (error) {
    console.error('Error testing Gemini connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test Gemini connection',
      error: error.message
    });
  }
};

/**
 * Get all prompts
 * GET /api/gemini/prompts
 */
const getPrompts = async (req, res) => {
  try {
    // Get all unique prompts from the images collection
    const images = await readDB('images', {});
    
    // Extract unique prompts
    const uniquePrompts = [];
    const seenPrompts = new Set();
    
    images.forEach(img => {
      if (img.promptId && !seenPrompts.has(img.promptId)) {
        uniquePrompts.push({
          id: img.promptId,
          promptName: img.promptName,
          prompt: img.prompt,
          createdAt: img.createdAt
        });
        seenPrompts.add(img.promptId);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Prompts retrieved successfully',
      data: uniquePrompts
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prompts',
      error: error.message
    });
  }
};

/**
 * Get all generated images
 * GET /api/gemini/generated-images
 */
const getGeneratedImages = async (req, res) => {
  try {
    const generatedImages = await readDB('generated_images', {});
    
    res.status(200).json({
      success: true,
      message: 'Generated images retrieved successfully',
      data: generatedImages,
      count: generatedImages.length
    });
  } catch (error) {
    console.error('Error fetching generated images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch generated images',
      error: error.message
    });
  }
};

/**
 * Debug endpoint to test the complete flow
 * GET /api/gemini/debug
 */
const debugFlow = async (req, res) => {
  try {
    console.log('🔍 Starting debug flow...');
    
    // Test database connection
    const database = getDB();
    const collections = await database.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    // Test prompts collection
    const allImages = await readDB('images', {});
    console.log('📊 Total images in database:', allImages.length);
    
    // Test generated images collection
    const generatedImages = await readDB('generated_images', {});
    console.log('📊 Total generated images:', generatedImages.length);
    
    // Test Gemini connection
    const geminiTest = await imageGenerationService.testConnection();
    console.log('📊 Gemini connection test:', geminiTest);
    
    res.status(200).json({
      success: true,
      message: 'Debug information retrieved',
      debug: {
        database: {
          collections: collections.map(c => c.name),
          totalImages: allImages.length,
          totalGeneratedImages: generatedImages.length,
          sampleImage: allImages.length > 0 ? {
            promptId: allImages[0].promptId,
            promptName: allImages[0].promptName,
            prompt: allImages[0].prompt?.substring(0, 100) + '...'
          } : null
        },
        gemini: geminiTest,
        environment: {
          hasGeminiKey: !!process.env.GEMINI_API_KEY,
          nodeEnv: process.env.NODE_ENV
        }
      }
    });
  } catch (error) {
    console.error('Error in debug flow:', error);
    res.status(500).json({
      success: false,
      message: 'Debug flow failed',
      error: error.message
    });
  }
};

export {
  generateImage,
  generateImageFromText,
  testConnection,
  getPrompts,
  getGeneratedImages,
  debugFlow
};
