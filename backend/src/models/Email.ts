import mongoose, { Schema, Document } from 'mongoose';

/**
 * Lightweight Email Metadata Model
 * 
 * This model ONLY stores AI-generated metadata and user classifications.
 * Full email content is fetched directly from Gmail API to save MongoDB storage.
 * 
 * What this stores:
 * - AI summaries and suggested replies
 * - User-defined priority and category classifications
 * - Rules engine results
 * 
 * What this does NOT store:
 * - Email body content (fetched from Gmail)
 * - Read/starred status (synced from Gmail)
 * - Full recipient lists
 */
export interface IEmail extends Document {
  userId: mongoose.Types.ObjectId;
  gmailId: string;
  threadId: string;
  // AI-generated content (the valuable data we keep)
  priority: 'low' | 'medium' | 'high';
  category?: string;
  aiSummary?: string;
  aiSuggestions?: Array<{
    tone: string;
    draft: string;
    generatedAt: Date;
  }>;
  // Metadata for rules engine
  ruleActions?: Array<{
    ruleId: string;
    action: string;
    appliedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const EmailSchema = new Schema<IEmail>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gmailId: { type: String, required: true },
    threadId: { type: String, required: true },
    // AI classification
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    category: String,
    // AI-generated content
    aiSummary: String,
    aiSuggestions: [
      {
        tone: String,
        draft: String,
        generatedAt: { type: Date, default: Date.now },
      },
    ],
    // Rules tracking
    ruleActions: [
      {
        ruleId: String,
        action: String,
        appliedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Compound index for unique emails per user
EmailSchema.index({ userId: 1, gmailId: 1 }, { unique: true });
EmailSchema.index({ userId: 1, threadId: 1 });
// Index for cleanup queries
EmailSchema.index({ createdAt: 1, aiSummary: 1 });

export const Email = mongoose.model<IEmail>('Email', EmailSchema);

