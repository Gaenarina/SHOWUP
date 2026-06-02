export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "noshow"
  | "cancelled";

export type Reservation = {
  id: string;
  storeId: string;
  storeName: string;
  address: string;

  consumerId: string;
  sellerId: string;
  consumerName: string;
  sellerName: string;

  date: Date;
  time: string;
  deposit: number;
  partySize?: number;

  status: ReservationStatus;

  consumerVerified: boolean;
  sellerVerified: boolean;
  verificationEnabled: boolean;

  verificationEnabledAt?: Date | null;
  verificationExpiresAt?: Date | null;

  customerReputation: {
    title: string;
    noShowCount: number;
    attendanceRate: number;
  };

  contractAddress?: string;
  txHash?: string;
  chainAppointmentId?: string;
  consumerWalletAddress?: string;
  sellerWalletAddress?: string;
};
