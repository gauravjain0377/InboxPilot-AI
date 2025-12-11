import mongoose, { Schema, Document } from 'mongoose';

export type AIActionType = 'reply' | 'summarize' | 'rewrite' | 'followup';

export interface IAIUsage extends Document {
  userId?: mongoose.Types.ObjectId; // optional to allow unauthenticated extension usage
  action: AIActionType;
  source: 'extension' | 'web' | 'api';
  emailId?: mongoose.Types.ObjectId; // reference to Email document when available
  gmailId?: string; // raw Gmail message id when available
  threadId?: string;
  tone?: string;
  // Small snippets for analytics/debugging – avoid storing full body for privacy
  subjectSnippet?: string;
  fromSnippet?: string;
  draftLength?: number; // characters in generated text
  createdAt: Date;
}

const AIUsageSchema = new Schema<IAIUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: {
      type: String,
      enum: ['reply', 'summarize', 'rewrite', 'followup'],
      required: true,
    },
    source: {
      type: String,
      enum: ['extension', 'web', 'api'],
      default: 'api',
      required: true,
    },
    emailId: { type: Schema.Types.ObjectId, ref: 'Email' },
    gmailId: { type: String },
    threadId: { type: String },
    tone: { type: String },
    subjectSnippet: { type: String, maxlength: 200 },
    fromSnippet: { type: String, maxlength: 200 },
    draftLength: { type: Number },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AIUsageSchema.index({ userId: 1, createdAt: -1 });
AIUsageSchema.index({ userId: 1, action: 1 });

export const AIUsage = mongoose.model<IAIUsage>('AIUsage', AIUsageSchema);


