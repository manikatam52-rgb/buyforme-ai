import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  monthlyBudget?: number;
  preferences: {
    categories: string[];
    brands: string[];
  };
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    monthlyBudget: { type: Number, default: undefined },
    preferences: {
      categories: { type: [String], default: [] },
      brands: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
