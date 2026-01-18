import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  picture?: string;
  googleId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry?: Date;
  preferences?: {
    defaultTone: 'formal' | 'friendly' | 'assertive' | 'short' | 'negative' | 'concise';
    signature?: string;
    autoLabel: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    picture: String,
    googleId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    tokenExpiry: Date,
    preferences: {
      defaultTone: { type: String, enum: ['formal', 'friendly', 'assertive', 'short', 'negative', 'concise'], default: 'friendly' },
      signature: String,
      autoLabel: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

