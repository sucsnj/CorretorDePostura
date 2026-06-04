import { Schema, model, Document } from 'mongoose';

export interface IPosture extends Document {
  timestamp: number; // Original Ubidots timestamp in milliseconds
  angulo: number;
  desvio: number;
  status: number; // 1 = Correta, 0 = Incorreta
}

const PostureSchema = new Schema<IPosture>(
  {
    timestamp: { type: Number, required: true, unique: true, index: true },
    angulo: { type: Number, required: true },
    desvio: { type: Number, required: true },
    status: { type: Number, required: true },
  },
  {
    versionKey: false,
  }
);

export const Posture = model<IPosture>('Posture', PostureSchema);
