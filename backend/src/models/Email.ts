import mongoose, { Schema, Document } from 'mongoose';

export interface IEmail extends Document {
  userId: mongoose.Types.ObjectId;
  gmailId: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  snippet?: string;
  date: Date;
  labels: string[];
  priority: 'low' | 'medium' | 'high';
  category?: string;
  isRead: boolean;
  isStarred: boolean;
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
    gmailId: { type: String, required: true, unique: true },
    threadId: { type: String, required: true },
    from: { type: String, required: true },
    to: [String],
    cc: [String],
    bcc: [String],
    subject: { type: String, required: true },

    snippet: { type: String },
    date: { type: Date, required: true },
    labels: [String],
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    category: String,
    isRead: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
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

EmailSchema.index({ userId: 1, date: -1 });
EmailSchema.index({ userId: 1, threadId: 1 });

export const Email = mongoose.model<IEmail>('Email', EmailSchema);

