export type StoreType = "default" | "seller";

export type Store = {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  address: string;
  description: string;
  baseDeposit: number;
  available: boolean;
  storeType: StoreType;
};