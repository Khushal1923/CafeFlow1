import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
  phoneNumber: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

const OtpSchema: Schema = new Schema(
  {
    phoneNumber: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Document will expire at the expiresAt time
    },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IOtp>('Otp', OtpSchema);
