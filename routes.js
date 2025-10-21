import express from 'express';
import { uploadImage, getAllImages, getImageById, getImagesByPromptId, deleteImage, upload } from './controllers/uploadImage&promts.js';
import { generateImage, generateImageFromText, testConnection, getPrompts, getGeneratedImages, debugFlow } from './controllers/geminiController.js';

const router = express.Router();

// =============================================================================
// IMAGE MANAGEMENT ROUTES
// =============================================================================

// Upload image endpoint (supports both file upload and base64)
// POST /api/images/upload
router.post('/images/upload', upload.single('aiImage'), uploadImage);

// Get all images
// GET /api/images
router.get('/images', (req, res) => {
  console.log('Route /images hit, calling getAllImages');
  getAllImages(req, res);
});

// Alternative route for getAllImages
// GET /api/images/getAllImages
router.get('/images/getAllImages', (req, res) => {
  console.log('Route /images/getAllImages hit, calling getAllImages');
  getAllImages(req, res);
});

// Get images by promptId
// GET /api/images/prompt/:promptId
router.get('/images/prompt/:promptId', getImagesByPromptId);

// Get image by ID
// GET /api/images/:id
router.get('/images/:id', getImageById);

// Delete image
// DELETE /api/images/:id
router.delete('/images/:id', deleteImage);

// =============================================================================
// GEMINI AI ROUTES
// =============================================================================

// Generate image with promptId and reference image
// POST /api/gemini/generate
router.post('/gemini/generate', generateImage);

// Generate image from text prompt only
// POST /api/gemini/generate-text
router.post('/gemini/generate-text', generateImageFromText);

// Test Gemini connection
// GET /api/gemini/test
router.get('/gemini/test', testConnection);

// Get all prompts
// GET /api/gemini/prompts
router.get('/gemini/prompts', getPrompts);

// Get all generated images
// GET /api/gemini/generated-images
router.get('/gemini/generated-images', getGeneratedImages);

// Debug endpoint
// GET /api/gemini/debug
router.get('/gemini/debug', debugFlow);

export default router;

