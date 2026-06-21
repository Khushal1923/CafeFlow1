import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomizationOption {
  name: string;
  extraPrice: number;
}

export interface ICustomization {
  name: string;
  type: 'single' | 'multiple';
  options: ICustomizationOption[];
}

export interface IDish extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  image?: string;
  category: 'Coffee' | 'Tea' | 'Mocktails' | 'Snacks' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Desserts' | string;
  price: number;
  veg: boolean;
  available: boolean;
  customizations: ICustomization[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomizationOptionSchema = new Schema({
  name: { type: String, required: true },
  extraPrice: { type: Number, default: 0 },
});

const CustomizationSchema = new Schema({
  name: { type: String, required: true }, // e.g., "Spice Level"
  type: { type: String, enum: ['single', 'multiple'], required: true }, // single = radio, multiple = checkbox
  options: [CustomizationOptionSchema],
});

const DishSchema: Schema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    category: {
      type: String,
      required: true,
      index: true,
    },
    price: { type: Number, required: true },
    veg: { type: Boolean, default: true },
    available: { type: Boolean, default: true },
    customizations: [CustomizationSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IDish>('Dish', DishSchema);
