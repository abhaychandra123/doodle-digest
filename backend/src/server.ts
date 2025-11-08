import express, { Request, Response, NextFunction } from 'express'; // Added explicit types
import cors from 'cors'; // Make sure cors is imported
import mongoose, { Document as MongooseDocument, Types } from 'mongoose'; // --- NEW: Import Types ---
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';

// Middleware and Models
import auth, { AuthRequest } from './middleware/auth';
import User from './models/User';
import DocumentModel from './models/Document';
import WritingDocument from './models/WritingDocument';
import Task from './models/Task';
import Group from './models/Group';
import Activity from './models/Activity';

// AI Services
import {
    generateDoodleSummary,
    generateNotebookSummary,
    generateTotalSummary,
    generateMiniExercise,
    generateCreatorStory,
    suggestImprovements,
    generateScribble
} from './services/llmService';
import { processPdf, processImage } from './services/fileProcessor'; 

// --- Define Interfaces ---
interface IUserPublic extends Omit<mongoose.InferSchemaType<typeof User.schema>, 'password'> {
  _id: mongoose.Types.ObjectId; 
  id?: string;
}

interface CreateGroupRequestBody {
    name: string;
    description: string;
    purpose?: string;
    categories?: string[];
    privacy?: "Public" | "Private";
    members: { userId?: string | mongoose.Types.ObjectId; name: string; role: string }[];
    tools?: string[];
    template?: string;
}

interface UpdateProfileRequestBody {
    fullName?: string;
    status?: string;
    integrations?: {
        slack?: boolean;
        zoom?: boolean;
        teams?: boolean;
    };
}

// --- NEW: Chart Data Type ---
interface ChartData {
  label: string;
  value: number;
}

// --- NEW: Helper function to log activities ---
const logActivity = async (userId: string | mongoose.Types.ObjectId, icon: string, text: string) => {
  try {
    const activity = new Activity({ userId, icon, text });
    await activity.save();
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// --- NEW: Helper function to format daily stats ---
const formatDailyData = (dbResults: any[]): ChartData[] => {
  const dayMap = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  // Create an array for the last 7 days, starting from today
  const days: ChartData[] = [];
  for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayOfWeekIndex = d.getDay(); // 0 (Sun) - 6 (Sat)
      days.push({
          label: dayMap[dayOfWeekIndex],
          value: 0
      });
  }

  // Populate with db results
  // Note: MongoDB $dayOfWeek is 1-indexed (Sun=1), JS getDay() is 0-indexed (Sun=0)
  dbResults.forEach(item => {
      const dayIndex = item._id - 1; // Convert MongoDB 1-index to 0-index
      const matchingDay = days.find(d => d.label === dayMap[dayIndex]);
      if(matchingDay) {
          matchingDay.value = item.value;
      }
  });

  // Today's data (day 0) is at the end of the `days` array.
  // We need to re-order it to match the chart: S, M, T, W, T, F, S
  const todayDayIndex = new Date().getDay(); // 0-6
  // Re-order the array to start from 'today' and go back 6 days
  const orderedDays = [];
  for (let i = 0; i < 7; i++) {
    orderedDays.push(days[(todayDayIndex + i + 1) % 7]);
  }
  // This logic is complex. A simpler way for the mock:
  // Just map the DB results directly to the labels.
  const simpleDays = dayMap.map((label, index) => {
    const dbEntry = dbResults.find(item => item._id === (index + 1)); // Find Sun (1), Mon (2) etc.
    return {
      label: label,
      value: dbEntry ? dbEntry.value : 0
    };
  });
  // The mock chart's labels `[S, M, T, W, T, F, S]` represent the 7 days of the *current* week.
  return simpleDays;
};

// --- NEW: Helper function to format weekly stats ---
const formatWeeklyData = (dbResults: any[]): ChartData[] => {
  // Get current week number
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
  const currentWeek = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);

  const weeks: ChartData[] = [];
  // Go back 9 "steps" like the mock data
  for (let i = 8; i >= 0; i -= 2) { // Goes 8, 6, 4, 2, 0
    const weekNum = currentWeek - i;
    if (weekNum > 0) {
      const label = `Week ${weekNum}`;
      const dbEntry = dbResults.find(item => item._id === weekNum);
      weeks.push({
        label: label,
        value: dbEntry ? dbEntry.value : 0
      });
    }
  }
  return weeks;
};

// --- NEW: Helper function to format monthly stats ---
const formatMonthlyData = (dbResults: any[]): ChartData[] => {
  const monthMap = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const months: ChartData[] = [];
  const currentMonthIndex = new Date().getMonth(); // 0-11

  // Show up to the current month
  for (let i = 0; i <= currentMonthIndex; i++) {
    const dbEntry = dbResults.find(item => item._id === (i + 1)); // MongoDB $month is 1-indexed
    months.push({
      label: monthMap[i],
      value: dbEntry ? dbEntry.value : 0
    });
  }
  return months;
};


// --- CONFIGURATION ---
dotenv.config();
const app = express();
// --- **** Request Logging Middleware (Place VERY EARLY) **** ---
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`\nIncoming Request: ${req.method} ${req.path}`);
    console.log('Origin:', req.headers.origin);
    if (req.method === 'OPTIONS') {
        console.log('Preflight Request Headers:');
        console.log(' Access-Control-Request-Method:', req.headers['access-control-request-method']);
        console.log(' Access-Control-Request-Headers:', req.headers['access-control-request-headers']);
    }
    next();
});

// --- CORS MIDDLEWARE ---
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://doodle-digest.vercel.app'], // Allow both ports
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'], // ✅ ARRAY
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Accept'],
  exposedHeaders: ['x-auth-token'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// Explicitly handle preflight requests for all routes
app.options(/.*/, cors(corsOptions));


// --- OTHER MIDDLEWARE ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// --- MULTER CONFIGURATION FOR FILE UPLOADS ---
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const PORT = process.env.PORT || 5001;

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI!, {
    serverSelectionTimeoutMS: 25000 // Increased timeout to 25 seconds
})
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err)); 
// --- API ROUTES ---

// =========================
// 1. AUTHENTICATION ROUTES
// =========================

// @route   POST /api/auth/register
// @desc    Register a new user
app.post('/api/auth/register', async (req: Request, res: Response) => { // Use Request, Response types
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ msg: 'Please enter all fields' });

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User with this email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            status: 'Just joined!',
            role: 'Student',
            stats: { studyHours: 0, courses: 0, daysStreak: 0, achievements: 0 },
            integrations: { slack: false, zoom: false, teams: false }
        });
        const savedUser = await newUser.save();

        await logActivity(savedUser.id, 'profile', `${fullName} just joined Doodle Digest!`);

        const token = jwt.sign({ id: savedUser.id }, process.env.JWT_SECRET!, { expiresIn: '3h' });

        const userObject = savedUser.toObject();
        const userResponse: IUserPublic = {
             _id: userObject._id,
             email: userObject.email,
             fullName: userObject.fullName,
             status: userObject.status,
             role: userObject.role,
             badges: userObject.badges,
             skills: userObject.skills,
             stats: userObject.stats,
             integrations: userObject.integrations,
             createdAt: userObject.createdAt, 
             updatedAt: userObject.updatedAt,
        };

        res.status(201).json({ token, user: userResponse });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error during registration');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
app.post('/api/auth/login', async (req: Request, res: Response) => { // Use Request, Response types
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Please enter all fields' });

    try {
        const user = await User.findOne({ email });
        if (!user || !user.password) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '3h' });

        const userObject = user.toObject();
        const userResponse: IUserPublic = {
             _id: userObject._id,
             email: userObject.email,
             fullName: userObject.fullName,
             status: userObject.status,
             role: userObject.role,
             badges: userObject.badges,
             skills: userObject.skills,
             stats: userObject.stats,
             integrations: userObject.integrations,
             createdAt: userObject.createdAt,
             updatedAt: userObject.updatedAt,
        };

        res.json({ token, user: userResponse });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error during login');
    }
});

// @route   GET /api/auth/user
// @desc    Get user data from token
app.get('/api/auth/user', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const user = await User.findById(req.user!.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found'});
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// ======================================
// 2. DOCUMENT MANAGEMENT ROUTES
// ======================================

// @route   POST /api/documents
// @desc    Save a new, fully processed document from the frontend
app.post('/api/documents', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const body = req.body as any;
        // Normalize incoming payload to match schema
        const documentData = {
            fileName: body.fileName,
            pdfPages: body.pdfPages || body.pages || [],
            chunkSummaries: body.chunkSummaries || body.summaries || [],
            notebookSummary: body.notebookSummary || body.notebookContent || '',
            totalSummary: body.totalSummary || '',
            miniExercise: body.miniExercise || '',
            userNotes: body.userNotes || [],
        };

        const newDocument = new DocumentModel({
            ...documentData,
            createdAt: new Date(), 
            userId: req.user!.id 
        });

        const savedDocument = await newDocument.save();
        
        await logActivity(req.user!.id, 'summarizer', `Summarized the document: ${savedDocument.fileName}`);

        res.status(201).json(savedDocument);
    } catch (error) {
        console.error("Error saving document:", error);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/documents
// @desc    Get all documents for the logged-in user
app.get('/api/documents', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const documents = await DocumentModel.find({ userId: req.user!.id }).sort({ createdAt: -1 });
        res.json(documents);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/documents/:id
// @desc    Update a document's user notes
app.put('/api/documents/:id', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const { userNotes } = req.body;
        if (userNotes === undefined) {
             return res.status(400).json({ msg: 'Only userNotes can be updated via this route.' });
        }

        const updatedDocument = await DocumentModel.findOneAndUpdate(
            { _id: req.params.id, userId: req.user!.id },
            { $set: { userNotes: userNotes } },
            { new: true } // Return the updated document
        );

        if (!updatedDocument) {
            return res.status(404).json({ msg: 'Document not found or user not authorized' });
        }
        res.json(updatedDocument);
    } catch (error) {
        console.error("Error updating document notes:", error);
        res.status(500).send('Server Error');
    }
});

// ======================================
// 3. WRITING WIZARD ROUTES
// ======================================

// @route   POST /api/writing
// @desc    Create a new writing document
app.post('/api/writing', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const { title, content } = req.body;
        const newDoc = new WritingDocument({
            title: title || "Untitled Document",
            content: content || "<p>Start writing here...</p>",
            lastModified: new Date(),
            userId: req.user!.id
        });
        const savedDoc = await newDoc.save();
        
        await logActivity(req.user!.id, 'writing', `Started a new document: ${savedDoc.title}`);
        
        res.status(201).json(savedDoc);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/writing
// @desc    Get all writing documents for a user
app.get('/api/writing', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const docs = await WritingDocument.find({ userId: req.user!.id }).sort({ lastModified: -1 });
        res.json(docs);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/writing/:id
// @desc    Update a writing document
app.put('/api/writing/:id', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const { title, content } = req.body;
        if (title === undefined || content === undefined) {
             return res.status(400).json({ msg: 'Title and content are required for update.' });
        }

        const updatedDoc = await WritingDocument.findOneAndUpdate(
            { _id: req.params.id, userId: req.user!.id },
            { title, content, lastModified: new Date() },
            { new: true }
        );
        if (!updatedDoc) return res.status(404).json({ msg: 'Document not found or user not authorized' });
        res.json(updatedDoc);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/writing/:id
// @desc    Delete a writing document
app.delete('/api/writing/:id', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const deletedDoc = await WritingDocument.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
        if (!deletedDoc) return res.status(404).json({ msg: 'Document not found or user not authorized' });
        res.json({ msg: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});


// ======================================
// 4. TASK ROUTES
// ======================================

// @route   POST /api/tasks
// @desc    Create a new task
app.post('/api/tasks', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ msg: 'Task text is required' });

        const newTask = new Task({
            text,
            completed: false,
            userId: req.user!.id
        });
        const savedTask = await newTask.save();
        res.status(201).json(savedTask);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/tasks
// @desc    Get all tasks for a user
app.get('/api/tasks', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const tasks = await Task.find({ userId: req.user!.id });
        res.json(tasks);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task (e.g., toggle completion)
app.put('/api/tasks/:id', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const { text, completed } = req.body;
        if (text === undefined && completed === undefined) {
            return res.status(400).json({ msg: 'No update data provided (text or completed).' });
        }

        const task = await Task.findOne({ _id: req.params.id, userId: req.user!.id });
        if (!task) return res.status(404).json({ msg: 'Task not found or user not authorized' });
        
        const wasCompleted = task.completed; // Store previous state
        if (text !== undefined) task.text = text;
        if (completed !== undefined) task.completed = completed;
        
        if (completed === true && wasCompleted === false) {
           await logActivity(req.user!.id, 'task', `Completed task: ${task.text}`);
        }

        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
app.delete('/api/tasks/:id', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
        if (!deletedTask) return res.status(404).json({ msg: 'Task not found or user not authorized' });
        res.json({ msg: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});


// ======================================
// 5. GROUP (ONBOARDING) ROUTES
// ======================================

// @route   POST /api/groups
// @desc    Create a new group
app.post('/api/groups', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const { name, description, members, ...groupData } = req.body as CreateGroupRequestBody;

        if (!name || !description || !members || members.length === 0) {
             return res.status(400).json({ msg: 'Group name, description, and at least one member are required.' });
        }

        const newGroup = new Group({
            name,
            description,
            members, 
            ...groupData,
            ownerId: req.user!.id,
        });
        const savedGroup = await newGroup.save();
        
        await logActivity(req.user!.id, 'group', `Created a new group: ${savedGroup.name}`);

        res.status(201).json(savedGroup);
    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/groups
// @desc    Get groups for a user
app.get('/api/groups', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    try {
        const groups = await Group.find({
            $or: [
                { ownerId: req.user!.id },
                { 'members.userId': req.user!.id } 
            ]
        }).populate('ownerId', 'fullName email') 
          .populate('members.userId', 'fullName email'); 

        res.json(groups);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});


// ======================================
// 6. USER PROFILE ROUTE
// ======================================

// @route   PUT /api/profile
// @desc    Update user profile details (fullName, status, integrations)
app.put('/api/profile', auth, async (req: AuthRequest, res: Response) => { // Use Response type
    const { fullName, status, integrations } = req.body as UpdateProfileRequestBody;
    const updateData: UpdateProfileRequestBody = {}; 

    if (fullName !== undefined) updateData.fullName = fullName;
    if (status !== undefined) updateData.status = status;
    if (integrations !== undefined) updateData.integrations = integrations;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ msg: 'No valid fields provided for update.' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user!.id,
            { $set: updateData },
            { new: true, runValidators: true } 
        ).select('-password'); 

        if (!updatedUser) return res.status(404).json({ msg: 'User not found' });

        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send('Server Error');
    }
});

// ======================================
// 7. ACTIVITY ROUTES
// ======================================

// @route   GET /api/activities
// @desc    Get recent activities for a user
app.get('/api/activities', auth, async (req: AuthRequest, res: Response) => {
    try {
        const activities = await Activity.find({ userId: req.user!.id })
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(20); // Limit to the 20 most recent
        res.json(activities);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// ======================================
// 8. AI PROCESSING ROUTES
// ======================================

// @route   POST /api/ai/process-file
// @desc    Process a PDF or image file and generate summaries with doodles
app.post('/api/ai/process-file', auth, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const file = req.file;
        const fileName = file.originalname;
        const fileType = file.mimetype;

        // Progress tracking (simplified - in production you'd use WebSockets or SSE)
        const sendProgress = (message: string) => {
            console.log(`[${fileName}] ${message}`);
        };

        sendProgress('Step 1/6: Processing file...');

        let pages;
        let sourcePdfDataUrl: string | undefined;
        if (fileType === 'application/pdf') {
            pages = await processPdf(file.buffer);
            sourcePdfDataUrl = `data:application/pdf;base64,${file.buffer.toString('base64')}`;
        } else if (fileType.startsWith('image/')) {
            pages = await processImage(file.buffer, fileType);
        } else {
            return res.status(400).json({ msg: 'Unsupported file type. Please upload a PDF or image.' });
        }

        if (!pages || pages.length === 0) {
            return res.status(400).json({ msg: 'Could not extract content from the file.' });
        }

        // Generate summaries and doodles
        const summaries = await generateDoodleSummary(pages, sendProgress);

        sendProgress('Step 4/6: Creating notebook view...');
        const notebookContent = await generateNotebookSummary(summaries);

        sendProgress('Step 5/6: Generating final summary...');
        const totalSummary = await generateTotalSummary(summaries);

        sendProgress('Step 6/6: Creating mini-exercise...');
        const miniExercise = await generateMiniExercise(summaries);

        // Create the document object aligned with schema
        const documentData = {
            fileName,
            sourcePdfDataUrl,
            pdfPages: pages,
            chunkSummaries: summaries,
            notebookSummary: notebookContent,
            totalSummary,
            miniExercise,
            userNotes: [],
            userId: req.user!.id,
            createdAt: new Date()
        };

        // Save to database
        const newDocument = new DocumentModel(documentData);
        const savedDocument = await newDocument.save();

        await logActivity(req.user!.id, 'summarizer', `Summarized the document: ${fileName}`);

        res.status(201).json(savedDocument);
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ msg: 'Failed to process file', error: String(error) });
    }
});

// @route   POST /api/ai/storyfy
// @desc    Generate a creator story from a document
app.post('/api/ai/storyfy', auth, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const file = req.file;
        const fileType = file.mimetype;

        let pages;
        if (fileType === 'application/pdf') {
            pages = await processPdf(file.buffer);
        } else if (fileType.startsWith('image/')) {
            pages = await processImage(file.buffer, fileType);
        } else {
            return res.status(400).json({ msg: 'Unsupported file type' });
        }

        const fullText = pages.map(p => p.text).join('\n\n');
        const story = await generateCreatorStory(fullText);

        res.json({ story });
    } catch (error) {
        console.error('Error generating story:', error);
        res.status(500).json({ msg: 'Failed to generate story', error: String(error) });
    }
});

// @route   POST /api/ai/suggest
// @desc    Get AI suggestions for improving text
app.post('/api/ai/suggest', auth, async (req: AuthRequest, res: Response) => {
    try {
        const { text } = req.body;
        
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ msg: 'Text content is required' });
        }

        const suggestion = await suggestImprovements(text);
        res.json({ suggestion });
    } catch (error) {
        console.error('Error generating suggestions:', error);
        res.status(500).json({ msg: 'Failed to generate suggestions', error: String(error) });
    }
});

// @route   POST /api/ai/generate-scribble
// @desc    Generate a doodle/scribble from a text description
app.post('/api/ai/generate-scribble', auth, async (req: AuthRequest, res: Response) => {
    try {
        const { description } = req.body;
        
        if (!description || typeof description !== 'string') {
            return res.status(400).json({ msg: 'Description is required' });
        }

        const doodleUrl = await generateScribble(description);
        res.json({ doodleUrl });
    } catch (error) {
        console.error('Error generating scribble:', error);
        res.status(500).json({ msg: 'Failed to generate scribble', error: String(error) });
    }
});

// ======================================
// 9. STATS ROUTE
// ======================================
app.get('/api/stats', auth, async (req: AuthRequest, res: Response) => {
    try {
        const userId = new Types.ObjectId(req.user!.id); // Convert string ID to MongoDB ObjectId
        const now = new Date();
        const startOfThisWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Set to Sunday
        startOfThisWeek.setHours(0, 0, 0, 0);

        const startOfThisYear = new Date(now.getFullYear(), 0, 1);
        const tenWeeksAgo = new Date(Date.now() - 10 * 7 * 24 * 60 * 60 * 1000);

        // 1. Daily Stats: Tasks completed this week, grouped by day of week
        const dailyTaskAgg = Task.aggregate([
            { $match: { 
                userId: userId, 
                completed: true,
                updatedAt: { $gte: startOfThisWeek } // Tasks completed since Sunday
            }},
            { $group: {
                _id: { $dayOfWeek: "$updatedAt" }, // 1 (Sun) - 7 (Sat)
                value: { $sum: 1 }
            }}
        ]);

        // 2. Weekly Stats: Documents summarized in the last 10 weeks
        const weeklyDocAgg = DocumentModel.aggregate([
            { $match: {
                userId: userId,
                createdAt: { $gte: tenWeeksAgo }
            }},
            { $group: {
                _id: { $isoWeek: "$createdAt" }, // Get ISO week number
                value: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        // 3. Monthly Stats: Documents summarized this year
        const monthlyDocAgg = DocumentModel.aggregate([
            { $match: {
                userId: userId,
                createdAt: { $gte: startOfThisYear }
            }},
            { $group: {
                _id: { $month: "$createdAt" }, // 1 (Jan) - 12 (Dec)
                value: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);

        // Run all aggregations in parallel
        const [dailyResults, weeklyResults, monthlyResults] = await Promise.all([
            dailyTaskAgg,
            weeklyDocAgg,
            monthlyDocAgg
        ]);

        // Format the data for the frontend
        const stats = {
            daily: formatDailyData(dailyResults),
            weekly: formatWeeklyData(weeklyResults),
            monthly: formatMonthlyData(monthlyResults)
        };

        res.json(stats);

    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).send('Server Error');
    }
});


// --- SERVER INITIALIZATION ---
app.listen(PORT, () => console.log(`🚀 Backend server running on http://localhost:${PORT}`));

// --- Basic Error Handling (Optional but Recommended) ---
// Add a simple 404 handler for routes not found
app.use((req: Request, res: Response, next: NextFunction) => { // Added types
    res.status(404).send("Sorry, can't find that!");
});

// Add a generic error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => { // Added types
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
