import { Request } from "express";
import { IUserDocument } from "@NursingPracticer/types";

export interface AuthRequest extends Request {
  user?: IUserDocument;
}
