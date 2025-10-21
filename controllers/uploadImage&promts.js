import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { connectDB, writeDB, readDB, updateDB, deleteDB, getDB } from '../config/database.js';

// Initialize database connection
connectDB();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/ai-images';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Upload image API endpoint (handles both file upload and base64)
export const uploadImage = async (req, res) => {
  try {
    // Validate required fields
    const { promptId, promptName, prompt } = req.body;
    const aiImage = req.body.aiImage;
    
    if (!promptId || !promptName || !prompt) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: promptId, promptName, and prompt are required',
        error: 'VALIDATION_ERROR'
      });
    }

    let base64DataUrl = aiImage;
    let originalName = 'uploaded-image';
    let size = 0;
    let mimetype = 'image/jpeg';

    // If file was uploaded via multer, convert to base64
    if (req.file) {
      const imageBuffer = fs.readFileSync(req.file.path);
      const base64ImageData = imageBuffer.toString('base64');
      base64DataUrl = `data:${req.file.mimetype};base64,${base64ImageData}`;
      originalName = req.file.originalname;
      size = req.file.size;
      mimetype = req.file.mimetype;
      
      // Clean up uploaded file since we're storing as base64
      fs.unlinkSync(req.file.path);
    } else if (!aiImage) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided (either file upload or base64)',
        error: 'NO_IMAGE_ERROR'
      });
    }

    // Prepare data for database
    const imageData = {
      _id: uuidv4(),
      promptId: promptId,
      promptName: promptName,
      prompt: prompt,
      base64Image: base64DataUrl,
      originalName: originalName,
      size: size,
      mimetype: mimetype,
      uploadedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database using writeDB function
    try {
      const result = await writeDB('images', imageData);
      console.log('Image saved to database:', result.insertedId);
    } catch (error) {
      console.error('Failed to save image to database:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save image to database',
        error: 'DATABASE_SAVE_ERROR'
      });
    }

    // Prepare response data (without base64 for performance)
    const responseData = {
      id: imageData._id,
      promptId: imageData.promptId,
      promptName: imageData.promptName,
      prompt: imageData.prompt,
      originalName: imageData.originalName,
      size: imageData.size,
      mimetype: imageData.mimetype,
      uploadedAt: imageData.uploadedAt
    };

    res.status(201).json({
      success: true,
      message: 'Image uploaded and converted to base64 successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB',
        error: 'FILE_SIZE_ERROR'
      });
    }

    if (error.message.includes('Only image files')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'INVALID_FILE_TYPE'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during upload',
      error: 'UPLOAD_ERROR'
    });
  }
};

// Get all uploaded images
export const getAllImages = async (req, res) => {
  try {
    console.log('getAllImages function called');
    const images = await readDB('images');
    console.log('Images retrieved from database:', images.length);
    
    res.status(200).json({
      success: true,
      message: 'Images retrieved successfussy',
      promptId: images.map(img => img.promptId),
    aiImage: images.map(img => img.base64Image)  ,
      count: images.length
    });
  } catch (error) {
    console.error('Get all images error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving images',
      error: 'RETRIEVE_ERROR'
    });
  }
};

// Get image by ID (includes base64 data)
export const getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const images = await readDB('images', { _id: id });
    const image = images.length > 0 ? images[0] : null;
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
        error: 'NOT_FOUND'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Image retrieved successfully',
      data: {
        id: image._id,
        promptId: image.promptId,
        promptName: image.promptName,
        prompt: image.prompt,
        base64Image: image.base64Image,
        originalName: image.originalName,
        size: image.size,
        mimetype: image.mimetype,
        uploadedAt: image.uploadedAt
      }
    });
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving image',
      error: 'RETRIEVE_ERROR'
    });
  }
};

// Get images by promptId
export const getImagesByPromptId = async (req, res) => {
  try {
    const { promptId } = req.params;
    
    if (!promptId) {
      return res.status(400).json({
        success: false,
        message: 'promptId parameter is required',
        error: 'MISSING_PARAMETER'
      });
    }
    
    const images = await readDB('images', { promptId: promptId });
    
    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No images found for the provided promptId',
        error: 'NOT_FOUND'
      });
    }
    
    // Return images with base64 data for promptId search
    const imageList = images.map(img => ({
      id: img._id,
      promptId: img.promptId,
      promptName: img.promptName,
      prompt: img.prompt,
      base64Image: img.base64Image,
      originalName: img.originalName,
      size: img.size,
      mimetype: img.mimetype,
      uploadedAt: img.uploadedAt
    }));
    
    res.status(200).json({
      success: true,
      message: 'Images retrieved successfully by promptId',
      data: imageList,
      count: imageList.length
    });
  } catch (error) {
    console.error('Get images by promptId error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving images by promptId',
      error: 'RETRIEVE_ERROR'
    });
  }
};

// Delete image
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteDB('images', { _id: id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
        error: 'NOT_FOUND'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: 'DELETE_ERROR'
    });
  }
};



// Export multer middleware for use in routes
export { upload };
