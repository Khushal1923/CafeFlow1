import mongoose, { Schema, Document } from 'mongoose';

export interface IWaiterRequest extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableNumber: string;
  type: 'call_waiter' | 'request_water' | 'request_bill' | 'other';
  status: 'pending' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const WaiterRequestSchema: Schema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    tableNumber: { type: String, required: true },
    type: {
      type: String,
      enum: ['call_waiter', 'request_water', 'request_bill', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IWaiterRequest>('WaiterRequest', WaiterRequestSchema);
