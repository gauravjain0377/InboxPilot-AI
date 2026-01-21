import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  picture?: string;
  googleId?: string; // Optional for Gmail Add-on users
  accessToken?: string; // Optional for Gmail Add-on users
  refreshToken?: string; // Optional for Gmail Add-on users
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
    name: { type: String, required: true, default: '' },
    picture: String,
    googleId: { type: String, unique: true, sparse: true }, // Optional, sparse index
    accessToken: String, // Optional for Gmail Add-on users
    refreshToken: String, // Optional for Gmail Add-on users
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

