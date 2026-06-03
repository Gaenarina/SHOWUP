import { doc, runTransaction } from "firebase/firestore";

import { db } from "../firebase";

export const applyNoShowPenalty = async (reservationId: string) => {
  const reservationRef = doc(db, "reservations", reservationId);

  await runTransaction(db, async (transaction) => {
    const reservationSnap = await transaction.get(reservationRef);

    if (!reservationSnap.exists()) {
      throw new Error("예약을 찾을 수 없습니다.");
    }

    const reservationData = reservationSnap.data();

    // 이미 노쇼 처리된 경우
    if (reservationData.status === "noshow") {
      return;
    }

    const userRef = doc(db, "users", reservationData.consumerId);
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists()) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    const userData = userSnap.data();
    const currentNoShow = userData.noShowCount ?? 0;
    const currentScore = userData.reputationScore ?? 100;

    transaction.update(reservationRef, {
      status: "noshow",
      verificationEnabled: false,
    });

    transaction.update(userRef, {
      noShowCount: currentNoShow + 1,
      reputationScore: Math.max(0, currentScore - 10),
    });
  });
};
