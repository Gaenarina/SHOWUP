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
import { db } from "@/firebase";
import type { Store } from "@/types/store";

export type SellerStoreInput = {
  sellerId: string;
  sellerName: string;
  name: string;
  address: string;
  description: string;
  reservationNotice: string;
  sellerWalletAddress?: string;
  baseDeposit: number;
  available: boolean;
  allowPartySize?: boolean;
  minPartySize?: number;
  maxPartySize?: number;
};

export const DEMO_MASTER_UID = process.env.NEXT_PUBLIC_DEMO_MASTER_UID ?? "";
const DEMO_MASTER_NAME =
  process.env.NEXT_PUBLIC_DEMO_MASTER_NAME ?? "SHOWUP ?곕え 愿由ъ옄";

export const DEMO_STORE_IDS = [
  "default-cafe-on",
  "default-study-cafe",
  "default-restaurant",
];

const defaultStores = [
  {
    id: "default-cafe-on",
    sellerId: DEMO_MASTER_UID,
    sellerName: DEMO_MASTER_NAME,
    name: "카페 온",
    address: "?덉꽦??以묒븰濡?123",
    description: "議곗슜??遺꾩쐞湲곗쓽 移댄럹?낅땲??",
    reservationNotice:
      "?덉빟 ?쒓컙 10遺??꾧퉴吏 ?꾩갑?댁＜?몄슂. 痍⑥냼媛 ?꾩슂??寃쎌슦 誘몃━ ?곕씫?댁＜?몄슂.",
    sellerWalletAddress: process.env.NEXT_PUBLIC_DEMO_SELLER_WALLET_ADDRESS ?? "",
    baseDeposit: 0.01,
    available: true,
    storeType: "default" as const,
    allowPartySize: false,
    minPartySize: 1,
    maxPartySize: 1,
  },
  {
    id: "default-study-cafe",
    sellerId: DEMO_MASTER_UID,
    sellerName: DEMO_MASTER_NAME,
    name: "?ㅽ꽣??移댄럹 吏묒쨷",
    address: "?덉꽦????숇줈 456",
    description: "吏묒쨷?섍린 醫뗭? ?ㅽ꽣??怨듦컙?낅땲??",
    reservationNotice:
      "?덉빟???쒓컙??留욎떠 ?낆옣?댁＜?몄슂. 議곗슜???댁슜 ?쒓컙??吏耳쒖＜?몄슂.",
    sellerWalletAddress: process.env.NEXT_PUBLIC_DEMO_SELLER_WALLET_ADDRESS ?? "",
    baseDeposit: 0.015,
    available: true,
    storeType: "default" as const,
    allowPartySize: false,
    minPartySize: 1,
    maxPartySize: 1,
  },
  {
    id: "default-restaurant",
    sellerId: DEMO_MASTER_UID,
    sellerName: DEMO_MASTER_NAME,
    name: "?ㅻ뒛??誘몄떇媛",
    address: "泥쒖븞??踰덊솕媛 789",
    description: "?덉빟?쒕줈 ?댁쁺?섎뒗 ?앸떦?낅땲??",
    reservationNotice:
      "?덉빟 ?몄썝??留욎떠 諛⑸Ц?댁＜?몄슂. 臾대떒 遺덉갭 ???몄눥濡?泥섎━?????덉뒿?덈떎.",
    sellerWalletAddress: process.env.NEXT_PUBLIC_DEMO_SELLER_WALLET_ADDRESS ?? "",
    baseDeposit: 0.02,
    available: true,
    storeType: "default" as const,
    allowPartySize: true,
    minPartySize: 1,
    maxPartySize: 6,
  },
];

export const seedDefaultStores = async () => {
  if (!DEMO_MASTER_UID) {
    console.warn("NEXT_PUBLIC_DEMO_MASTER_UID媛 ?ㅼ젙?섏? ?딆븯?듬땲??");
    return;
  }

  await Promise.all(
    defaultStores.map((store) =>
      setDoc(
        doc(db, "stores", store.id),
        {
          ...store,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
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
    const stores = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as Store[];

    const sellerStore = stores.find((store) => store.storeType === "seller");

    callback(sellerStore ?? null);
  });
};

export const subscribeDemoStores = (callback: (stores: Store[]) => void) => {
  const q = query(collection(db, "stores"), orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const stores = snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .filter((store) => DEMO_STORE_IDS.includes(store.id)) as Store[];

    callback(
      DEMO_STORE_IDS.map((storeId) =>
        stores.find((store) => store.id === storeId)
      ).filter(Boolean) as Store[]
    );
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
      allowPartySize: Boolean(storeData.allowPartySize),
      minPartySize: Number(storeData.minPartySize ?? 1),
      maxPartySize: Number(storeData.maxPartySize ?? 1),
      storeType: "seller",
      updatedAt: serverTimestamp(),
      ...(snapshot.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );

  return targetStoreId;
};

export const saveDemoStore = async (
  storeId: string,
  storeData: SellerStoreInput
) => {
  const storeRef = doc(db, "stores", storeId);
  const snapshot = await getDoc(storeRef);

  await setDoc(
    storeRef,
    {
      ...storeData,
      id: storeId,
      baseDeposit: Number(storeData.baseDeposit),
      available: Boolean(storeData.available),
      allowPartySize: Boolean(storeData.allowPartySize),
      minPartySize: Number(storeData.minPartySize ?? 1),
      maxPartySize: Number(storeData.maxPartySize ?? 1),
      storeType: "default",
      updatedAt: serverTimestamp(),
      ...(snapshot.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );

  return storeId;
};
