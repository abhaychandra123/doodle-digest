# Doodle Digest - Setup & Run Guide

## Fixed Issues

### Backend
1. ✅ Migrated to OpenAI Chat Completions API:
   - Changed `response.response.candidates` to `response.candidates`
   - Removed invalid `ai.models.predict()` calls for image generation
   - Fixed `generationConfig` placement (now inside `config` object)
   - Added proper null/undefined checks for all AI responses

2. ✅ Added missing AI processing routes:
   - `POST /api/ai/process-file` - Process PDFs/images and generate summaries
   - `POST /api/ai/storyfy` - Generate creator stories from documents
   - `POST /api/ai/suggest` - Get AI suggestions for text improvement

3. ✅ Fixed PDF processing:
   - Installed `pdfjs-dist@4.8.69` (compatible with Node 18)
   - Updated import path to use standard `pdfjs-dist` package

4. ✅ Added file upload support:
   - Configured `multer` for handling file uploads
   - Set 50MB file size limit

5. ✅ Fixed TypeScript compilation:
   - Added `skipLibCheck: true` to tsconfig.json
   - Backend now compiles successfully

### Frontend
1. ✅ Created `.env` file with proper backend URL configuration

## How to Run

### Backend Server

```bash
cd backend
npm install
npm run dev
```

The backend will start on `http://localhost:5001`

### Frontend Server

In a new terminal:

```bash
cd /Users/abhay/Downloads/doodle-digest
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

## Environment Variables

### Backend (`backend/.env`)
- `MONGO_URI` - MongoDB connection string ✅ Configured
- `JWT_SECRET` - Secret for JWT tokens ✅ Configured  
- `OPENAI_API_KEY` - OpenAI API key (backend only)

### Frontend (`.env`)
- `VITE_API_URL` - Backend API URL ✅ Configured as `http://localhost:5001/api`
- `OPENAI_API_KEY` - Backend-only key for OpenAI API (in `backend/.env`)
- `OPENAI_MODEL` - Chat model (default `gpt-4o-mini`)
- `OPENAI_IMAGE_MODEL` - Image model for doodles (`dall-e-3` or `gpt-image-1`)
- `OPENAI_IMAGE_SIZE` - Image size (`256x256`, `512x512`, `1024x1024`)
- `ENABLE_IMAGE_GENERATION` - `true|false` to control image generation

## Testing the Integration

1. Start both backend and frontend servers
2. Navigate to `http://localhost:3000`
3. Register/Login to create an account
4. Upload a PDF or image file
5. The backend will process it using OpenAI and return summaries

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/user` - Get current user

### Documents
- `GET /api/documents` - Get all documents
- `POST /api/documents` - Save document
- `PUT /api/documents/:id` - Update document notes

### AI Processing
- `POST /api/ai/process-file` - Process file and generate summaries (requires file upload)
- `POST /api/ai/storyfy` - Generate creator story (requires file upload)
- `POST /api/ai/suggest` - Get writing suggestions (requires text in body)

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Writing
- `GET /api/writing` - Get writing documents
- `POST /api/writing` - Create writing document
- `PUT /api/writing/:id` - Update writing document
- `DELETE /api/writing/:id` - Delete writing document

### Stats & Activities
- `GET /api/stats` - Get user statistics
- `GET /api/activities` - Get recent activities

## Notes

- Image generation (doodles) is currently disabled as it requires proper Imagen API setup
- The backend uses OpenAI Chat Completions (e.g., gpt-4o-mini) for text generation and OCR
- CORS is configured to allow requests from `http://localhost:3000`
- All AI routes require authentication via `x-auth-token` header
