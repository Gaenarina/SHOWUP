import { useEffect, useState } from "react";
import { useNavigate, useParams } from "./routerCompat";
import { ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  expireReservationIfNeeded,
  subscribeReservation,
  verifyConsumer,
} from "../../services/reservationService";
import type { Reservation } from "../../types/reservation";

export function ReservationAuth() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!reservationId) return;

    const unsubscribe = subscribeReservation(reservationId, (item) => {
      setReservation(item);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [reservationId]);

  useEffect(() => {
    if (!reservationId || !reservation?.verificationExpiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const updateRemainingTime = async () => {
      const diff = reservation.verificationExpiresAt!.getTime() - Date.now();
      const seconds = Math.max(0, Math.ceil(diff / 1000));

      setRemainingSeconds(seconds);

      if (
        seconds <= 0 &&
        reservation.verificationEnabled &&
        !reservation.consumerVerified &&
        reservation.status === "confirmed"
      ) {
        await expireReservationIfNeeded(reservationId);
      }
    };

    updateRemainingTime();

    const timer = window.setInterval(updateRemainingTime, 1000);

    return () => window.clearInterval(timer);
  }, [reservationId, reservation]);

  const handleVerify = async () => {
    if (!reservationId) return;

    try {
      setIsSubmitting(true);
      await verifyConsumer(reservationId);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "인증 처리 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-500">예약 정보를 불러오는 중입니다.</p>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">예약 정보를 찾을 수 없습니다.</p>
          <button
            type="button"
            onClick={() => navigate("/reservations")}
            className="px-6 py-3 rounded-lg text-white font-semibold"
            style={{ backgroundColor: "#566F2F" }}
          >
            예약 현황으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = reservation.status === "completed";
  const isNoShow = reservation.status === "noshow";
  const canVerify =
    reservation.verificationEnabled &&
    !reservation.consumerVerified &&
    reservation.status === "confirmed" &&
    remainingSeconds > 0;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeText = `${minutes}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#fffdf8] flex flex-col">
      <div className="p-4">
        <button
          type="button"
          onClick={() => navigate("/reservations")}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#566F2F" }}
        >
          <ArrowLeft size={18} />
          예약 현황으로 돌아가기
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-5">
        <div className="bg-white rounded-3xl shadow-sm border border-[#E6EAD9] p-7 w-full max-w-md text-center">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{
              backgroundColor: isNoShow
                ? "#FEE2E2"
                : isCompleted
                ? "#F3F4F6"
                : "#E8F5E9",
            }}
          >
            {isNoShow ? (
              <XCircle size={34} style={{ color: "#DC2626" }} />
            ) : isCompleted ? (
              <CheckCircle size={34} style={{ color: "#6B7280" }} />
            ) : (
              <Clock size={34} style={{ color: "#566F2F" }} />
            )}
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: "#566F2F" }}>
            참석 인증
          </h2>

          <p className="text-gray-600 mb-6">
            판매자가 인증 버튼을 활성화한 뒤 3분 안에 인증을 완료하세요.
          </p>

          <div className="bg-[#FAFAF7] rounded-2xl p-4 text-left mb-6">
            <p className="text-sm text-gray-500">예약 장소</p>
            <p className="font-semibold mb-3">{reservation.storeName}</p>

            <p className="text-sm text-gray-500">예약 시간</p>
            <p className="font-semibold">{reservation.time}</p>
          </div>

          {isCompleted ? (
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
            >
              <CheckCircle className="mx-auto mb-2" size={28} />
              <p className="font-semibold">인증 완료</p>
              <p className="text-sm mt-1">참석 인증이 완료되었습니다.</p>
            </div>
          ) : isNoShow ? (
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
            >
              <XCircle className="mx-auto mb-2" size={28} />
              <p className="font-semibold">노쇼 처리</p>
              <p className="text-sm mt-1">
                인증 가능한 시간이 지나 노쇼 처리되었습니다.
              </p>
            </div>
          ) : canVerify ? (
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}
            >
              <p className="text-sm">남은 인증 시간</p>
              <p className="text-4xl font-bold mt-2">{timeText}</p>
            </div>
          ) : (
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
            >
              <p className="font-semibold">
                판매자가 인증 버튼을 활성화하면 인증할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <button
          type="button"
          onClick={handleVerify}
          disabled={!canVerify || isSubmitting}
          className="w-full py-4 rounded-xl text-white font-semibold text-lg disabled:opacity-70"
          style={{
            backgroundColor: isCompleted
              ? "#9CA3AF"
              : isNoShow
              ? "#DC2626"
              : canVerify
              ? "#566F2F"
              : "#D1D5DB",
          }}
        >
          {isCompleted
            ? "인증 완료"
            : isNoShow
            ? "노쇼 처리"
            : isSubmitting
            ? "인증 중..."
            : canVerify
            ? "인증하기"
            : "인증 대기"}
        </button>
      </div>
    </div>
  );
}
