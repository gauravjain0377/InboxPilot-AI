import mongoose, { Schema, Document } from 'mongoose';

export interface IEmail extends Document {
  userId: mongoose.Types.ObjectId;
  gmailId: string;
  threadId: string;
  messageId?: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body?: string;
  snippet?: string;
  date: Date;
  labels: string[];
  priority: 'low' | 'medium' | 'high';
  category?: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant?: boolean;
  isSent?: boolean;
  aiSummary?: string;
  aiSuggestions?: Array<{
    tone: string;
    draft: string;
    generatedAt: Date;
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
    from: { type: String, required: true },
    to: [String],
    cc: [String],
    bcc: [String],
    subject: { type: String, required: true },
    body: { type: String },
    snippet: { type: String },
    date: { type: Date, required: true },
    labels: [String],
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    category: String,
    isRead: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    isImportant: { type: Boolean, default: false },
    isSent: { type: Boolean, default: false },
    aiSummary: String,
    aiSuggestions: [
      {
        tone: String,
        draft: String,
        generatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Compound index for unique emails per user
EmailSchema.index({ userId: 1, gmailId: 1 }, { unique: true });
EmailSchema.index({ userId: 1, date: -1 });
EmailSchema.index({ userId: 1, threadId: 1 });
EmailSchema.index({ userId: 1, isRead: 1 });

export const Email = mongoose.model<IEmail>('Email', EmailSchema);

