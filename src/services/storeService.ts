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

const defaultStores = [
  {
    id: "default-cafe-on",
    sellerId: "default_seller",
    sellerName: "기본 입점 업체",
    name: "카페 온",
    address: "안성시 중앙로 123",
    description: "조용한 분위기의 카페입니다.",
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
    description: "공부와 팀플에 적합한 스터디 공간입니다.",
    baseDeposit: 0.015,
    available: true,
    storeType: "default" as const,
  },
  {
    id: "default-restaurant",
    sellerId: "default_seller",
    sellerName: "기본 입점 업체",
    name: "레스토랑 미식가",
    address: "천안시 번화가 789",
    description: "예약제로 운영되는 레스토랑입니다.",
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