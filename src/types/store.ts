export type StoreType = "default" | "seller";

export type Store = {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  address: string;
  description: string;
  reservationNotice?: string;
  sellerWalletAddress?: string;
  baseDeposit: number;
  available: boolean;
  storeType: StoreType;
  availableTimeSlots?: string[];
  blockedDates?: string[];
  blockedDateTimeSlots?: Record<string, string[]>;
  maxReservationsPerTimeSlot?: number | null;
  allowPartySize?: boolean;
  minPartySize?: number;
  maxPartySize?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};
