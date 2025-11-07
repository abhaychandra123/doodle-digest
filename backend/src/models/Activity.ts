import mongoose, { Schema } from 'mongoose';

// Define the Activity interface for TypeScript
export interface IActivity extends mongoose.Document {
  text: string;
  icon: string; // e.g., 'summarizer', 'task', 'profile'
  createdAt: Date;
  userId: mongoose.Types.ObjectId;
}

const activitySchema = new Schema({
  text: { type: String, required: true },
  icon: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const Activity = mongoose.model<IActivity>('Activity', activitySchema);
export default Activity;