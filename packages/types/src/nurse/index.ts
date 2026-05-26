import mongoose, { HydratedDocument, Model } from "mongoose";

export interface INurse {
  user: mongoose.Types.ObjectId;
  certificateFile: string;
  available: boolean;
  services: string[];
  location: string;
  approved: boolean;
  approvedBy: mongoose.Types.ObjectId;
}

export type INurseDocument = HydratedDocument<INurse>;
export interface INurseModel extends Model<INurse> {}
