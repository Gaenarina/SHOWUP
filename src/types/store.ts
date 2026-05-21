export type StoreType = "default" | "seller";

export type Store = {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  address: string;
  description: string;
  reservationNotice?: string;
  baseDeposit: number;
  available: boolean;
  storeType: StoreType;
  createdAt?: unknown;
  updatedAt?: unknown;
};
