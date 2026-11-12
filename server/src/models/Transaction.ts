import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  paypalOrderId: string;
  captureId?: string;
  amount: number;
  currency: string;
  status: 'CREATED' | 'APPROVED' | 'COMPLETED' | 'FAILED' | 'VOIDED';
  environment: 'sandbox' | 'live';
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    unitPrice: number;
  }>;
  payerEmail?: string;
  rawCapture?: Record<string, unknown>;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paypalOrderId: { type: String, required: true, index: true },
    captureId: String,
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'USD' },
    status: {
      type: String,
      enum: ['CREATED', 'APPROVED', 'COMPLETED', 'FAILED', 'VOIDED'],
      default: 'CREATED',
    },
    // Sandbox payments are simulated — always surfaced in the UI
    environment: { type: String, enum: ['sandbox', 'live'], default: 'sandbox' },
    items: [
      {
        productId: String,
        title: String,
        quantity: Number,
        unitPrice: Number,
      },
    ],
    payerEmail: String,
    rawCapture: Schema.Types.Mixed,
  },
  { timestamps: true }
);

// One completed capture per PayPal order — duplicate-capture protection at DB level
transactionSchema.index(
  { paypalOrderId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'COMPLETED' } }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
