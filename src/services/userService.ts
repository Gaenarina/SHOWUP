export type UserRole = "consumer" | "seller";

export type AppUser = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  birthDate: string;
  businessName: string | null;
  businessNumber: string | null;
  walletAddress: string;
  noShowCount: number;
  reputationScore: number;
};