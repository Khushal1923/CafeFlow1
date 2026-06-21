import mongoose, { Schema, Document } from 'mongoose';

export interface IRestaurant extends Document {
  name: string;
  slug: string;
  logo?: string;
  address: string;
  contact: string;
  gstNumber?: string;
  taxRate: number;
  theme?: {
    primaryColor?: string;
    darkMode?: boolean;
  };
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    logo: { type: String },
    address: { type: String, required: true },
    contact: { type: String, required: true },
    gstNumber: { type: String },
    taxRate: { type: Number, default: 5 },
    theme: {
      primaryColor: { type: String, default: '#d97706' }, // default amber-600
      darkMode: { type: Boolean, default: false },
    },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);
