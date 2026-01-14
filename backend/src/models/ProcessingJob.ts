import mongoose, { Schema } from 'mongoose';

const processingJobSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileKey: { type: String, required: true },
  fileUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed'],
    default: 'queued',
  },
  progressMessage: { type: String },
  error: { type: String },
  documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
  startedAt: { type: Date },
  finishedAt: { type: Date },
}, { timestamps: true });

processingJobSchema.index({ status: 1, createdAt: 1 });

const ProcessingJob = mongoose.model('ProcessingJob', processingJobSchema);
export default ProcessingJob;
