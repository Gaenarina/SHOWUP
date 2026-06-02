import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import type { Reservation } from "@/types/reservation";
import type { AppUser } from "@/types/user";

// TODO: applyNoShowPenalty 함수가 정의된 실제 파일 경로로 수정해 주세요.
import { applyNoShowPenalty } from "./penalty"; 

const VERIFICATION_LIMIT_MS = 3 * 60 * 1000;

export const DEMO_STORE_IDS = [
  "default-cafe-on",
  "default-study-cafe",
  "default-restaurant",
];

type CreateReservationInput = {
  consumerId: string;
  sellerId: string;
  storeId: string;
  storeName: string;
  address: string;
  date: Date;
  time: string;
  deposit: number;
  partySize?: number;
  contractAddress?: string;
  txHash?: string;
  chainAppointmentId?: string;
  consumerWalletAddress?: string;
  sellerWalletAddress?: string;
};

const convertDate = (value: any) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  return new Date(value);
};

const getReputationTitle = (noShowCount: number) => {
  if (noShowCount === 0) return "?곗닔 怨좉컼";
  if (noShowCount <= 2) return "?쇰컲 怨좉컼";
  return "?몄눥 二쇱쓽";
};

const mapReservation = (id: string, data: any) => {
  return {
    id,
    ...data,
    date: convertDate(data.date) ?? new Date(),
    verificationEnabledAt: convertDate(data.verificationEnabledAt),
    verificationExpiresAt: convertDate(data.verificationExpiresAt),
  } as Reservation;
};

export const createReservation = async ({
  consumerId,
  sellerId,
  storeId,
  storeName,
  address,
  date,
  time,
  deposit,
  partySize = 1,
  contractAddress = "",
  txHash = "",
  chainAppointmentId = "",
  consumerWalletAddress = "",
  sellerWalletAddress = "",
}: CreateReservationInput) => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("濡쒓렇?몄씠 ?꾩슂?⑸땲??");
  }

  if (consumerId !== currentUser.uid) {
    throw new Error("濡쒓렇?명븳 ?ъ슜?먯? ?덉빟???뺣낫媛 ?쇱튂?섏? ?딆뒿?덈떎.");
  }

  const consumerSnap = await getDoc(doc(db, "users", currentUser.uid));

  if (!consumerSnap.exists()) {
    throw new Error("怨좉컼 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.");
  }

  const consumer = consumerSnap.data() as AppUser;
  const noShowCount = consumer.noShowCount ?? 0;

  const docRef = await addDoc(collection(db, "reservations"), {
    consumerId,
    sellerId,
    storeId,
    storeName,
    address,
    consumerName: consumer.name,
    sellerName: storeName,
    date,
    time,
    deposit,
    partySize: Number(partySize) || 1,

    status: "pending",

    consumerVerified: false,
    sellerVerified: false,
    verificationEnabled: false,
    verificationEnabledAt: null,
    verificationExpiresAt: null,

    customerReputation: {
      title: getReputationTitle(noShowCount),
      noShowCount,
      attendanceRate: 100,
    },

    contractAddress,
    txHash,
    chainAppointmentId,
    consumerWalletAddress,
    sellerWalletAddress,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

export const subscribeReservation = (
  reservationId: string,
  callback: (reservation: Reservation | null) => void
) => {
  return onSnapshot(doc(db, "reservations", reservationId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback(mapReservation(snapshot.id, snapshot.data()));
  });
};

export const subscribeConsumerReservations = (
  consumerId: string,
  callback: (reservations: Reservation[]) => void
) => {
  const q = query(
    collection(db, "reservations"),
    where("consumerId", "==", consumerId)
  );

  return onSnapshot(q, (snapshot) => {
    const reservations = snapshot.docs.map((item) =>
      mapReservation(item.id, item.data())
    );

    callback(reservations);
  });
};

export const subscribeSellerReservations = (
  sellerId: string,
  callback: (reservations: Reservation[]) => void
) => {
  const q = query(
    collection(db, "reservations"),
    where("sellerId", "==", sellerId)
  );

  return onSnapshot(q, (snapshot) => {
    const reservations = snapshot.docs.map((item) =>
      mapReservation(item.id, item.data())
    );

    callback(reservations);
  });
};

export const subscribeDemoAdminReservations = (
  callback: (reservations: Reservation[]) => void
) => {
  const q = query(
    collection(db, "reservations"),
    where("storeId", "in", DEMO_STORE_IDS)
  );

  return onSnapshot(q, (snapshot) => {
    const reservations = snapshot.docs
      .map((item) => mapReservation(item.id, item.data()))
      .sort((a, b) => {
        const dateDiff = a.date.getTime() - b.date.getTime();

        if (dateDiff !== 0) {
          return dateDiff;
        }

        return a.time.localeCompare(b.time);
      });

    callback(reservations);
  });
};

export const enableVerification = async (reservationId: string) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + VERIFICATION_LIMIT_MS);

  await updateDoc(doc(db, "reservations", reservationId), {
    status: "confirmed",
    sellerVerified: true,
    verificationEnabled: true,
    verificationEnabledAt: Timestamp.fromDate(now),
    verificationExpiresAt: Timestamp.fromDate(expiresAt),
  });
};

export const verifyConsumer = async (reservationId: string) => {
  const reservationRef = doc(db, "reservations", reservationId);
  const snapshot = await getDoc(reservationRef);

  if (!snapshot.exists()) {
    throw new Error("?덉빟 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.");
  }

  const data = snapshot.data();
  const expiresAt = convertDate(data.verificationExpiresAt);

  if (!data.verificationEnabled || !expiresAt) {
    throw new Error("?꾩쭅 ?몄쬆 踰꾪듉???쒖꽦?붾릺吏 ?딆븯?듬땲??");
  }

  if (data.consumerVerified) {
    return;
  }

  // 변경된 부분: 인증 시간 초과 시 applyNoShowPenalty 호출
  if (Date.now() > expiresAt.getTime()) {
    await updateDoc(reservationRef, {
      status: "noshow",
      verificationEnabled: false,
    });

    throw new Error("?몄쬆 ?쒓컙??吏???몄눥 泥섎━?섏뿀?듬땲??");
  }

  await updateDoc(reservationRef, {
    status: "completed",
    consumerVerified: true,
    verificationEnabled: false,
  });
};

export const expireReservationIfNeeded = async (reservationId: string) => {
  const reservationRef = doc(db, "reservations", reservationId);
  const snapshot = await getDoc(reservationRef);

  if (!snapshot.exists()) return;

  const data = snapshot.data();
  const expiresAt = convertDate(data.verificationExpiresAt);

  // 변경된 부분: 예약 시간이 지났을 때 applyNoShowPenalty 호출
  if (
    data.verificationEnabled === true &&
    data.consumerVerified !== true &&
    data.status === "confirmed" &&
    expiresAt &&
    Date.now() > expiresAt.getTime()
  ) {
    await applyNoShowPenalty(reservationId);
  }
};

export const expireOverdueReservations = async (
  reservations: Reservation[]
) => {
  const targets = reservations.filter((reservation) => {
    if (!reservation.verificationEnabled) return false;
    if (reservation.consumerVerified) return false;
    if (reservation.status !== "confirmed") return false;
    if (!reservation.verificationExpiresAt) return false;

    return Date.now() > reservation.verificationExpiresAt.getTime();
  });

  await Promise.all(
    targets.map((reservation) => expireReservationIfNeeded(reservation.id))
  );
};

export const cancelReservation = async (reservationId: string) => {
  await deleteDoc(doc(db, "reservations", reservationId));
};

export const markReservationAsCancelled = async (reservationId: string) => {
  await updateDoc(doc(db, "reservations", reservationId), {
    status: "cancelled",
    verificationEnabled: false,
  });
};

export const markReservationAsNoShow = async (reservationId: string) => {
  await updateDoc(doc(db, "reservations", reservationId), {
    status: "noshow",
    verificationEnabled: false,
  });
};