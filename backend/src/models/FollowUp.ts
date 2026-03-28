import mongoose, { Schema, Document } from 'mongoose';

export type FollowUpStatus = 'pending' | 'pending_review' | 'sent' | 'cancelled' | 'snoozed';
export type FollowUpMode = 'manual' | 'auto' | 'hybrid';

export interface IFollowUp extends Document {
  userId: mongoose.Types.ObjectId;
  threadId: string;
  messageId: string; // The message id of the last sent email we're following up on
  to: string;
  subject: string;
  stepNumber: number;
  delayDays: number;
  scheduledTime: Date;
  status: FollowUpStatus;
  mode: FollowUpMode;
  draft?: string;
  tone: string;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new Schema<IFollowUp>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    threadId: { type: String, required: true },
    messageId: { type: String, required: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    stepNumber: { type: Number, required: true, default: 1 },
    delayDays: { type: Number, required: true },
    scheduledTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'pending_review', 'sent', 'cancelled', 'snoozed'],
      default: 'pending',
    },
    mode: {
      type: String,
      enum: ['manual', 'auto', 'hybrid'],
      default: 'hybrid',
    },
    draft: { type: String },
    tone: { type: String, default: 'friendly' },
  },
  { timestamps: true }
);

// Indexes to fetch upcoming/pending followups efficiently
FollowUpSchema.index({ userId: 1, status: 1, scheduledTime: 1 });
FollowUpSchema.index({ threadId: 1, status: 1 });

export const FollowUp = mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);
