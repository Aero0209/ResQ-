export interface Intervention {
  id: string;
  completedAt: number;
  acceptedAt: number;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  vehicleBrand: string;
  vehicleType: string;
  vehicleLicensePlate: string;
  breakdownType: string;
  description: string;
  duration: string;
  mechanicId: string;
  userId: string;
  status: 'completed';
} 