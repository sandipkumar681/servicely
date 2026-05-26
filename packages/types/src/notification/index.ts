export enum SocketEvent {
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  LOCATION_UPDATE = "location:update",
  BOOKING_REQUEST = "booking:request",
  BOOKING_ACCEPTED = "booking:accepted",
  BOOKING_STATUS_CHANGE = "booking:status_change",
  JOIN_ROOM = "room:join",
  LEAVE_ROOM = "room:leave",
  ERROR = "error",
}

export interface ILocationUpdatePayload {
  userId: string;
  latitude: number;
  longitude: number;
  heading?: number;
}

export interface IBookingRequestPayload {
  bookingId: string;
  patientName: string;
  serviceName: string;
  distance: number; // in meters/km
  estimatedPayout: number;
  scheduledTime: Date;
  notes?: string;
}

export interface IBookingStatusChangePayload {
  bookingId: string;
  status: string;
  updatedAt: Date;
}
