import mongoose, { Schema } from 'mongoose';

const passwordResetSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-delete expired tokens
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);
export default PasswordReset;
