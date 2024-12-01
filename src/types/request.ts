export interface HelpRequest {
  id: string;
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
  userPhone: string;
  mechanicId: string | null;
  mechanicName: string | null;
  mechanicPhone: string | null;
  status: 'pending' | 'assigned' | 'accepted' | 'completed' | 'cancelled';
  assignedAt: number | null;
  createdAt: number;
  completedAt?: number;
  cancelledAt?: number;
  duration?: string;
}

export interface HistoryRequest {
  id: string;
  location: {
    address: string;
  };
  vehicleBrand: string;
  vehicleType: string;
  breakdownType: string;
  description: string;
  userPhone: string;
  mechanicName: string;
  mechanicPhone: string;
  status: 'completed' | 'cancelled';
  completedAt?: number;
  cancelledAt?: number;
  duration?: string;
} 