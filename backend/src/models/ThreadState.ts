import mongoose, { Schema, Document } from 'mongoose';

export type ThreadStatusType = 'ACTIVE' | 'REPLIED' | 'FOLLOW_UP_PENDING' | 'CLOSED';

export interface IThreadState extends Document {
  userId: mongoose.Types.ObjectId;
  threadId: string;
  lastActivityTime: Date;
  hasReply: boolean;
  status: ThreadStatusType;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ThreadStateSchema = new Schema<IThreadState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    threadId: { type: String, required: true },
    lastActivityTime: { type: Date, default: Date.now, required: true },
    hasReply: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['ACTIVE', 'REPLIED', 'FOLLOW_UP_PENDING', 'CLOSED'],
      default: 'ACTIVE',
    },
    replyCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ThreadStateSchema.index({ userId: 1, threadId: 1 }, { unique: true });

export const ThreadState = mongoose.model<IThreadState>('ThreadState', ThreadStateSchema);
