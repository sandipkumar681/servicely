import { BookingStatus } from "./status";

export * from "./status";

export type GeoPoint = {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
};

export interface IBooking {
  _id?: string;
  patientId: string;
  nurseId?: string;
  serviceId: string;
  status: BookingStatus;
  scheduledTime: Date;
  address: string;
  location: GeoPoint;
  pricing: {
    basePrice: number;
    tax: number;
    platformFee: number;
    totalPrice: number;
  };
  notes?: string;
  cancellationReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
