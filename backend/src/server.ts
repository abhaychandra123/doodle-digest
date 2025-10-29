import express, { Request, Response, NextFunction } from 'express'; // Added explicit types
import cors from 'cors'; // Make sure cors is imported
import mongoose, { Document as MongooseDocument } from 'mongoose'; // Added MongooseDocument
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Middleware and Models
import auth, { AuthRequest } from './middleware/auth';
import User from './models/User';
import DocumentModel from './models/Document';
import WritingDocument from './models/WritingDocument';
import Task from './models/Task';
import Group from './models/Group'; // Import the Group model

// --- Define Interfaces for Request Bodies/Mongoose Docs (Fixes TS2749) ---
// Interface representing the structure of user data (excluding password)
interface IUserPublic extends Omit<mongoose.InferSchemaType<typeof User.schema>, 'password'> {
  _id: mongoose.Types.ObjectId; // Add _id if needed
  id?: string; // Mongoose might add 'id' virtual
  createdAt?: Date; // Add timestamps if needed from schema
  updatedAt?: Date;
}

// Interface for the expected request body when creating a group
interface CreateGroupRequestBody {
    name: string;
    description: string;
    purpose?: string;
    categories?: string[];
    privacy?: "Public" | "Private";
    members: { userId?: string | mongoose.Types.ObjectId; name: string; role: string }[]; // Define member structure
    tools?: string[];
    template?: string;
}

// Interface for the expected request body when updating a profile
interface UpdateProfileRequestBody {
    fullName?: string;
    status?: string;
    integrations?: {
        slack?: boolean;
        zoom?: boolean;
        teams?: boolean;
    };
}


// --- CONFIGURATION ---
dotenv.config();
const app = express();

// --- CORS MIDDLEWARE ---
// Explicitly configure CORS options
const corsOptions = {
  origin: 'http://localhost:3000', // Allow only your frontend origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow common methods
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], // Allow necessary headers
  credentials: true, // Allow cookies if needed (though not used here with JWT in header)
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};
app.use(cors(corsOptions));

// --- OTHER MIDDLEWARE ---
// Increase the JSON payload limit AFTER cors, but BEFORE routes
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 5000;

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI!)
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

        const token = jwt.sign({ id: savedUser.id }, process.env.JWT_SECRET!, { expiresIn: '3h' });

        // Create a user object to return, explicitly excluding the password
        const userResponse: IUserPublic = {
            _id: savedUser._id,
            email: savedUser.email,
            fullName: savedUser.fullName,
            status: savedUser.status,
            role: savedUser.role,
            badges: savedUser.badges,
            skills: savedUser.skills,
            stats: savedUser.stats,
            integrations: savedUser.integrations,
            createdAt: savedUser.createdAt,
            updatedAt: savedUser.updatedAt,
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
        // Check if user exists and has a password field before comparing
        if (!user || !user.password) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '3h' });

        // Create a user object to return, explicitly excluding the password
         const userResponse: IUserPublic = {
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            status: user.status,
            role: user.role,
            badges: user.badges,
            skills: user.skills,
            stats: user.stats,
            integrations: user.integrations,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
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
        // Assume documentData structure matches the DocumentModel schema input
        const documentData = req.body;

        const newDocument = new DocumentModel({
            ...documentData,
            createdAt: new Date(), // Ensure server-side timestamp
            userId: req.user!.id // Assign to the logged-in user
        });

        const savedDocument = await newDocument.save();
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
        // Only allow updating userNotes
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
        // Validate input if necessary
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
        // Basic validation: ensure at least one field is being updated
        if (text === undefined && completed === undefined) {
            return res.status(400).json({ msg: 'No update data provided (text or completed).' });
        }

        const task = await Task.findOne({ _id: req.params.id, userId: req.user!.id });
        if (!task) return res.status(404).json({ msg: 'Task not found or user not authorized' });

        if (text !== undefined) task.text = text;
        if (completed !== undefined) task.completed = completed;

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
        // Use the defined interface for the request body
        const { name, description, members, ...groupData } = req.body as CreateGroupRequestBody;

        if (!name || !description || !members || members.length === 0) {
             return res.status(400).json({ msg: 'Group name, description, and at least one member are required.' });
        }

        const newGroup = new Group({
            name,
            description,
            members, // Assuming frontend formats this correctly including potential userId links
            ...groupData,
            ownerId: req.user!.id,
        });
        const savedGroup = await newGroup.save();
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
        // Find groups where the user is either the owner or explicitly listed in the members array by userId
        const groups = await Group.find({
            $or: [
                { ownerId: req.user!.id },
                { 'members.userId': req.user!.id } // Assumes members array has userId field correctly populated
            ]
        }).populate('ownerId', 'fullName email') // Optionally populate owner info
          .populate('members.userId', 'fullName email'); // Optionally populate member info

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
    // Use the defined interface for the request body and updateData
    const { fullName, status, integrations } = req.body as UpdateProfileRequestBody;
    const updateData: UpdateProfileRequestBody = {}; // Use the interface here

    if (fullName !== undefined) updateData.fullName = fullName;
    if (status !== undefined) updateData.status = status;
    if (integrations !== undefined) updateData.integrations = integrations;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ msg: 'No valid fields provided for update.' });
    }

    try {
        // Find and update the user, then select fields excluding password
        const updatedUser = await User.findByIdAndUpdate(
            req.user!.id,
            { $set: updateData },
            { new: true, runValidators: true } // Return updated doc, run schema validators
        ).select('-password'); // Exclude password from the returned object

        if (!updatedUser) return res.status(404).json({ msg: 'User not found' });

        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating profile:", error);
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

