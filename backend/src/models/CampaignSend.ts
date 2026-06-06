import mongoose, { Schema, Document } from 'mongoose';

// Tracks every email sent via campaign — used for analytics.
// NOTE: Campaign follow-up has been removed. The inbox follow-up feature
// (FollowUp model / followup.controller.ts) remains fully intact.
export interface ICampaignSend extends Document {
  userId: mongoose.Types.ObjectId;
  campaignId: string;          // client-generated ID grouping a batch
  to: string;
  companyName?: string;
  subject: string;
  sentAt: Date;
  gmailMessageId?: string;
  gmailThreadId?: string;
  repliedAt?: Date;            // set when a reply is detected
  status: 'sent' | 'replied' | 'bounced';
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
    repliedAt: { type: Date },
    status: {
      type: String,
      enum: ['sent', 'replied', 'bounced'],
      default: 'sent',
    },
  },
  { timestamps: true }
);

CampaignSendSchema.index({ userId: 1, campaignId: 1 });
CampaignSendSchema.index({ userId: 1, status: 1 });
CampaignSendSchema.index({ gmailThreadId: 1 });

export const CampaignSend = mongoose.model<ICampaignSend>('CampaignSend', CampaignSendSchema);
