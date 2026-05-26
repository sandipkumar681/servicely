export interface IService {
  _id?: string;
  name: string;
  basePrice: number;
  description: string;
  estimatedDuration: number; // in minutes
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
