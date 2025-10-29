import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

const pdfPageSchema = new Schema({
  pageNumber: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  text: { type: String, required: true },
}, { _id: false });

const chunkSummarySchema = new Schema({
  summary: { type: String, required: true },
  doodleUrl: { type: String, default: null },
  pageNumber: { type: Number, required: true },
}, { _id: false });

const userNoteSchema = new Schema({
  pageNumber: { type: Number, required: true },
  content: { type: String, required: true },
  // Storing style as a flexible object
  style: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

const documentSchema = new Schema({
  fileName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  pdfPages: [pdfPageSchema],
  chunkSummaries: [chunkSummarySchema],
  notebookSummary: { type: String },
  totalSummary: { type: String },
  miniExercise: { type: String },
  userNotes: [userNoteSchema],
  // Link to the user who owns this document
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const DocumentModel = mongoose.model('Document', documentSchema);
export default DocumentModel;