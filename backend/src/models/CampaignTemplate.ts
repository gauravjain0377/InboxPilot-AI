import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaignTemplate extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  mode: 'direct' | 'ai' | 'personalized';
  // Direct mode
  subject?: string;
  body?: string;
  // AI / Personalized mode
  context?: string;
  // Sender options (ai + personalized)
  greeting?: string;
  senderName?: string;
  senderTitle?: string;
  senderSignature?: string;
  role?: string;
  tone?: string;
  extraNotes?: string;
  // Stats
  usedCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignTemplateSchema = new Schema<ICampaignTemplate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    mode: {
      type: String,
      enum: ['direct', 'ai', 'personalized'],
      required: true,
    },
    subject: { type: String },
    body: { type: String },
    context: { type: String },
    greeting: { type: String },
    senderName: { type: String },
    senderTitle: { type: String },
    senderSignature: { type: String },
    role: { type: String },
    tone: { type: String, default: 'professional' },
    extraNotes: { type: String },
    usedCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

CampaignTemplateSchema.index({ userId: 1, createdAt: -1 });

export const CampaignTemplate = mongoose.model<ICampaignTemplate>(
  'CampaignTemplate',
  CampaignTemplateSchema
);
