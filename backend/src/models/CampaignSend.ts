import mongoose, { Schema, Document } from 'mongoose';

// Tracks every email sent via campaign — used to schedule follow-ups
// and check if a reply was received.
export interface ICampaignSend extends Document {
  userId: mongoose.Types.ObjectId;
  campaignId: string;          // client-generated ID grouping a batch
  to: string;
  companyName?: string;
  subject: string;
  sentAt: Date;
  gmailMessageId?: string;
  gmailThreadId?: string;
  followUpEnabled: boolean;
  followUpDelayDays: number;   // default 4
  followUpSentAt?: Date;
  repliedAt?: Date;            // set when a reply is detected
  status: 'sent' | 'replied' | 'follow_up_sent' | 'bounced';
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSendSchema = new Schema<ICampaignSend>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campaignId: { type: String, required: true },
    to: { type: String, required: true },
    companyName: { type: String },
    subject: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    gmailMessageId: { type: String },
    gmailThreadId: { type: String },
    followUpEnabled: { type: Boolean, default: false },
    followUpDelayDays: { type: Number, default: 4 },
    followUpSentAt: { type: Date },
    repliedAt: { type: Date },
    status: {
      type: String,
      enum: ['sent', 'replied', 'follow_up_sent', 'bounced'],
      default: 'sent',
    },
  },
  { timestamps: true }
);

CampaignSendSchema.index({ userId: 1, campaignId: 1 });
CampaignSendSchema.index({ userId: 1, status: 1, followUpEnabled: 1 });
CampaignSendSchema.index({ gmailThreadId: 1 });

export const CampaignSend = mongoose.model<ICampaignSend>('CampaignSend', CampaignSendSchema);
