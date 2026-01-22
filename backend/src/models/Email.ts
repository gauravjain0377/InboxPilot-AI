import mongoose, { Schema, Document } from 'mongoose';

/**
 * Email Metadata Model
 * 
 * This model stores email metadata and AI-generated content.
 * Full email body content is fetched directly from Gmail API to save MongoDB storage.
 * 
 * What this stores:
 * - Basic email metadata (for analytics and rules)
 * - AI summaries and suggested replies
 * - User-defined priority and category classifications
 * - Rules engine results
 * 
 * What this does NOT store:
 * - Full email body content (fetched from Gmail on demand)
 */
export interface IEmail extends Document {
  userId: mongoose.Types.ObjectId;
  gmailId: string;
  threadId: string;
  messageId?: string;
  // Basic metadata for analytics (lightweight - no body stored)
  from?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  snippet?: string;
  date?: Date;
  labels?: string[];
  isRead?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  isSent?: boolean;
  // AI classification
  priority: 'low' | 'medium' | 'high';
  category?: string;
  // AI-generated content
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
    messageId: { type: String },
    // Basic metadata (lightweight)
    from: { type: String },
    to: [String],
    cc: [String],
    bcc: [String],
    subject: { type: String },
    snippet: { type: String },
    date: { type: Date },
    labels: [String],
    isRead: { type: Boolean },
    isStarred: { type: Boolean },
    isImportant: { type: Boolean },
    isSent: { type: Boolean },
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
EmailSchema.index({ userId: 1, date: -1 });
EmailSchema.index({ userId: 1, isRead: 1 });
// Index for cleanup queries
EmailSchema.index({ createdAt: 1, aiSummary: 1 });

export const Email = mongoose.model<IEmail>('Email', EmailSchema);

