import mongoose, { Schema, Document } from 'mongoose';

export interface IRule {
  name: string;
  conditions: {
    field: 'subject' | 'body' | 'from' | 'to';
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
    value: string;
  }[];
  actions: {
    label?: string;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
  };
  isActive: boolean;
}

export interface IPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  rules: IRule[];
  createdAt: Date;
  updatedAt: Date;
}

const RuleSchema = new Schema<IRule>({
  name: { type: String, required: true },
  conditions: [
    {
      field: { type: String, enum: ['subject', 'body', 'from', 'to'], required: true },
      operator: { type: String, enum: ['contains', 'equals', 'startsWith', 'endsWith'], required: true },
      value: { type: String, required: true },
    },
  ],
  actions: {
    label: String,
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    category: String,
  },
  isActive: { type: Boolean, default: true },
});

const PreferencesSchema = new Schema<IPreferences>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    rules: [RuleSchema],
  },
  { timestamps: true }
);

export const Preferences = mongoose.model<IPreferences>('Preferences', PreferencesSchema);

