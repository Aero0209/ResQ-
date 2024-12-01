export type UserRole = 'admin' | 'owner' | 'dispatcher' | 'mechanic' | 'user';

export interface UserData {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName?: string;
  phoneNumber?: string;
  createdAt: number;
  lastLogin: number;
}

export interface HelpRequest {
  id: string;
  userId: string;
  userEmail: string;
  userPhone: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  vehicleType?: string;
  breakdownType: string;
  description: string;
  status: RequestStatus;
  mechanicId?: string;
  createdAt: number;
  updatedAt: number;
}

export type RequestStatus = 
  | 'pending'     // En attente d'attribution
  | 'assigned'    // Attribué à un mécanicien, en attente de confirmation
  | 'accepted'    // Confirmé par le mécanicien
  | 'completed'   // Intervention terminée
  | 'cancelled'   // Annulé
  | 'rejected';   // Refusé 