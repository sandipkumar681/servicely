import mongoose, { HydratedDocument, Model } from "mongoose";
import { GeoPoint } from "../booking";

export interface INurse {
  user: mongoose.Types.ObjectId;
  certificateFile: string;
  available: boolean;
  services: string[]; // Service IDs
  location: GeoPoint;
  locationText?: string;
  approved: boolean;
  approvedBy?: mongoose.Types.ObjectId;
}

export type INurseDocument = HydratedDocument<INurse>;
export interface INurseModel extends Model<INurse> {}
