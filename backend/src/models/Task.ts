import mongoose, { Schema } from 'mongoose';

const taskSchema = new Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    // Link to the user who owns this task
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);
export default Task;
