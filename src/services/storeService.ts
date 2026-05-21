import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Store } from "../types/store";

export type SellerStoreInput = {
  sellerId: string;
  sellerName: string;
  name: string;
  address: string;
  description: string;
  reservationNotice: string;
  baseDeposit: number;
  available: boolean;
};

const defaultStores = [
  {
    id: "default-cafe-on",
    sellerId: "default_seller",
    sellerName: "기본 입점 업체",
    name: "카페 온",
    address: "안성시 중앙로 123",
    description: "조용한 분위기의 카페입니다.",
    reservationNotice:
      "예약 시간 10분 전까지 도착해주세요. 취소가 필요한 경우 미리 연락해주세요.",
    baseDeposit: 0.01,
    available: true,
    storeType: "default" as const,
  },
  {
    id: "default-study-cafe",
    sellerId: "default_seller",
    sellerName: "기본 입점 업체",
    name: "스터디 카페 집중",
    address: "안성시 대학로 456",
    description: "집중하기 좋은 스터디 공간입니다.",
    reservationNotice:
      "예약한 시간에 맞춰 입장해주세요. 조용한 이용 시간을 지켜주세요.",
    baseDeposit: 0.015,
    available: true,
    storeType: "default" as const,
  },
  {
    id: "default-restaurant",
    sellerId: "default_seller",
    sellerName: "기본 입점 업체",
    name: "오늘의 미식가",
    address: "천안시 번화가 789",
    description: "예약제로 운영되는 식당입니다.",
    reservationNotice:
      "예약 인원에 맞춰 방문해주세요. 무단 불참 시 노쇼로 처리될 수 있습니다.",
    baseDeposit: 0.02,
    available: true,
    storeType: "default" as const,
  },
];

export const seedDefaultStores = async () => {
  await Promise.all(
    defaultStores.map((store) =>
      setDoc(
        doc(db, "stores", store.id),
        {
          ...store,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )
    )
  );
};

export const subscribeStores = (callback: (stores: Store[]) => void) => {
  const q = query(collection(db, "stores"), orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const stores = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as Store[];

    callback(stores);
  });
};

export const getStoreById = async (storeId: string) => {
  const snapshot = await getDoc(doc(db, "stores", storeId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Store;
};

export const subscribeSellerStore = (
  sellerId: string,
  callback: (store: Store | null) => void
) => {
  const q = query(collection(db, "stores"), where("sellerId", "==", sellerId));

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }

    const item = snapshot.docs[0];

    callback({
      id: item.id,
      ...item.data(),
    } as Store);
  });
};

export const saveSellerStore = async (
  storeData: SellerStoreInput,
  storeId?: string
) => {
  const targetStoreId = storeId || `seller-${storeData.sellerId}`;
  const storeRef = doc(db, "stores", targetStoreId);
  const snapshot = await getDoc(storeRef);

  await setDoc(
    storeRef,
    {
      ...storeData,
      baseDeposit: Number(storeData.baseDeposit),
      available: Boolean(storeData.available),
      storeType: "seller",
      updatedAt: serverTimestamp(),
      ...(snapshot.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );

  return targetStoreId;
};
