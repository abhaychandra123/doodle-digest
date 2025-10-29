import mongoose, { Schema } from 'mongoose';

const memberSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true }, // Keeping name for simplicity if user isn't in system yet
    role: {
        type: String,
        enum: ["Lead Researcher", "Contributor", "Reviewer", "Mentor"],
        required: true,
    },
}, { _id: false });

const groupSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    purpose: { type: String },
    categories: [{ type: String }],
    privacy: {
        type: String,
        enum: ["Public", "Private"],
        default: "Private",
    },
    members: [memberSchema],
    tools: [{ type: String }],
    template: {
        type: String,
        enum: ["clinical-study", "computational-research", "social-science-survey"],
    },
    // The user who created the group
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const Group = mongoose.model('Group', groupSchema);
export default Group;