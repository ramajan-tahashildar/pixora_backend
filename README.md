# Pixora Server

AI-powered image generation server using Gemini API.

## Project Structure

```
server/
├── controllers/          # API controllers
│   ├── geminiController.js
│   └── uploadImage&promts.js
├── services/            # Business logic services
│   ├── geminiService.js
│   └── imageGenerationService.js
├── routes/              # API routes
│   ├── geminiRoutes.js
│   └── routes.js
├── config/              # Configuration files
│   └── database.js
├── uploads/             # File uploads
│   └── ai-images/
├── prisma/              # Database schema
│   └── schema.prisma
├── app.js               # Express app configuration
├── index.js             # Server entry point
└── package.json         # Dependencies
```

## API Endpoints

### Image Generation
- `POST /api/gemini/generate` - Generate image with promptId and reference image
- `POST /api/gemini/generate-text` - Generate image from text prompt only
- `GET /api/gemini/test` - Test Gemini connection
- `GET /api/gemini/prompts` - Get all prompts
- `GET /api/gemini/generated-images` - Get generated images
- `GET /api/gemini/debug` - Debug system status

### Image Management
- `POST /api/images/upload` - Upload image
- `GET /api/images` - Get all images
- `GET /api/images/:id` - Get image by ID
- `DELETE /api/images/:id` - Delete image

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
```

3. Start the server:
```bash
npm start
```

## Usage

The server provides AI-powered image generation using Gemini API with proper error handling for quota limits and model availability.# pixora_backend
