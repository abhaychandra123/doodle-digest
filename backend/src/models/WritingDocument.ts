import mongoose, { Schema } from 'mongoose';

const writingDocumentSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String }, // HTML content
  lastModified: { type: Date, default: Date.now },
  // Link to the user who owns this document
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const WritingDocument = mongoose.model('WritingDocument', writingDocumentSchema);
export default WritingDocument;