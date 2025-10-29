import mongoose, { Schema, Document } from 'mongoose';

const badgeSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  description: { type: String, required: true },
}, { _id: false });

const skillSchema = new Schema({
  name: { type: String, required: true },
  level: { type: Number, required: true },
}, { _id: false });

const userStatsSchema = new Schema({
    studyHours: { type: Number, default: 0 },
    courses: { type: Number, default: 0 },
    daysStreak: { type: Number, default: 0 },
    achievements: { type: Number, default: 0 },
}, { _id: false });

const integrationsSchema = new Schema({
    slack: { type: Boolean, default: false },
    zoom: { type: Boolean, default: false },
    teams: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String },
  username: { type: String },
  profilePictureUrl: { type: String },
  status: { type: String },
  role: { type: String },
  badges: [badgeSchema],
  skills: [skillSchema],
  stats: { type: userStatsSchema },
  integrations: { type: integrationsSchema },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;