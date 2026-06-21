import mongoose, { Schema, Document } from 'mongoose';

export interface ITable extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableNumber: string;
  qrCodeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema: Schema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    tableNumber: { type: String, required: true },
    qrCodeUrl: { type: String },
  },
  { timestamps: true }
);

// Ensure tableNumber is unique per restaurant
TableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

export default mongoose.model<ITable>('Table', TableSchema);
