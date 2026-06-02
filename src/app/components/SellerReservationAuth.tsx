import { useEffect, useState } from "react";
import { useNavigate, useParams } from "./routerCompat";
import { CheckCircle, Clock, Store, ArrowLeft } from "lucide-react";
import { usePublicClient, useWriteContract } from "wagmi";
import {
  enableVerification,
  subscribeReservation,
} from "@/services/reservationService";
import type { Reservation } from "@/types/reservation";
import {
  NO_SHOW_DEPOSIT_ADDRESS,
  noShowDepositAbi,
} from "@/services/web3/contracts";
import LoadingOverlay from "./LoadingOverlay";
import PageLoading from "./PageLoading";

export function SellerReservationAuth() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    if (!reservationId) return;

    const unsubscribe = subscribeReservation(reservationId, (item) => {
      setReservation(item);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [reservationId]);

  const getReservationDateTime = (item: Reservation) => {
    const reservationDate =
      item.date instanceof Date ? item.date : new Date(item.date);
    const timeText = String(item.time || "").trim();
    const match = timeText.match(/(\d{1,2})(?::(\d{2}))?/);
    const isAfternoon = timeText.includes("오후");
    const isMorning = timeText.includes("오전");
    let hour = match ? Number(match[1]) : 0;
    const minute = match?.[2] ? Number(match[2]) : 0;

    if (isAfternoon && hour < 12) hour += 12;
    if (isMorning && hour === 12) hour = 0;

    return new Date(
      reservationDate.getFullYear(),
      reservationDate.getMonth(),
      reservationDate.getDate(),
      hour,
      minute
    );
  };

  const handleEnableVerification = async () => {
    if (!reservationId || !reservation) return;

    if (Date.now() < getReservationDateTime(reservation).getTime()) {
      alert("예약 시간이 되어야 인증 버튼을 활성화할 수 있습니다.");
      return;
    }

    if (!NO_SHOW_DEPOSIT_ADDRESS) {
      alert("NoShowDeposit 컨트랙트 주소가 설정되지 않았습니다.");
      return;
    }

    if (!reservation.chainAppointmentId) {
      alert("블록체인 예약 ID가 없어 인증을 시작할 수 없습니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      setActionMessage("MetaMask에서 판매자 인증 트랜잭션을 확인해주세요.");

      const txHash = await writeContractAsync({
        address: NO_SHOW_DEPOSIT_ADDRESS,
        abi: noShowDepositAbi,
        functionName: "confirmBySeller",
        args: [BigInt(reservation.chainAppointmentId)],
      });

      setActionMessage("판매자 인증 트랜잭션을 처리하는 중입니다.");

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      await enableVerification(reservationId);
    } catch (error) {
      console.error(error);
      alert("인증 버튼 활성화 중 오류가 발생했습니다.");
    } finally {
      setActionMessage("");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageLoading message="예약 정보를 불러오는 중입니다." bottomPadding="none" />
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">예약 정보를 찾을 수 없습니다.</p>
          <button
            type="button"
            onClick={() => navigate("/seller/reservations")}
            className="px-6 py-3 rounded-lg text-white font-semibold"
            style={{ backgroundColor: "#566F2F" }}
          >
            예약 관리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = reservation.status === "completed";
  const isNoShow = reservation.status === "noshow";
  const isEnabled =
    reservation.verificationEnabled || reservation.sellerVerified;
  const isBeforeReservationTime =
    Date.now() < getReservationDateTime(reservation).getTime();

  return (
    <div className="min-h-screen bg-[#fffdf8] flex flex-col">
      <LoadingOverlay
        isOpen={isSubmitting}
        message={actionMessage || "인증 버튼을 활성화하는 중입니다."}
      />

      <div className="p-4">
        <button
          type="button"
          onClick={() => navigate("/seller/reservations")}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "#566F2F" }}
        >
          <ArrowLeft size={18} />
          예약 관리로 돌아가기
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-5">
        <div className="bg-white rounded-3xl shadow-sm border border-[#E6EAD9] p-7 w-full max-w-md text-center">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ backgroundColor: "#E8F5E9" }}
          >
            <Store size={32} style={{ color: "#566F2F" }} />
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: "#566F2F" }}>
            판매자 인증 관리
          </h2>

          <p className="text-gray-600 mb-6">
            고객이 현장에서 참석 인증을 진행할 수 있도록 버튼을 활성화하세요.
          </p>

          <div className="bg-[#FAFAF7] rounded-2xl p-4 text-left mb-6">
            <p className="text-sm text-gray-500">예약 장소</p>
            <p className="font-semibold mb-3">{reservation.storeName}</p>

            <p className="text-sm text-gray-500">고객명</p>
            <p className="font-semibold mb-3">{reservation.consumerName}</p>

            <p className="text-sm text-gray-500">예약 시간</p>
            <p className="font-semibold">
              {reservation.time}
            </p>
          </div>

          {isCompleted ? (
            <div
              className="rounded-2xl p-4 mb-6"
              style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
            >
              <CheckCircle className="mx-auto mb-2" size={28} />
              <p className="font-semibold">고객 인증 완료</p>
            </div>
          ) : isNoShow ? (
            <div
              className="rounded-2xl p-4 mb-6"
              style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
            >
              <p className="font-semibold">인증 시간이 지나 노쇼 처리되었습니다</p>
            </div>
          ) : isEnabled ? (
            <div
              className="rounded-2xl p-4 mb-6"
              style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}
            >
              <Clock className="mx-auto mb-2" size={28} />
              <p className="font-semibold">인증 버튼 활성화 완료</p>
              <p className="text-sm mt-1">
                고객은 활성화 후 20분 안에 인증할 수 있습니다.
              </p>
            </div>
          ) : isBeforeReservationTime ? (
            <div
              className="rounded-2xl p-4 mb-6"
              style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
            >
              <Clock className="mx-auto mb-2" size={28} />
              <p className="font-semibold">예약 시간 전입니다</p>
              <p className="text-sm mt-1">
                예약 시간이 되면 인증 버튼을 활성화할 수 있습니다.
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl p-4 mb-6"
              style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
            >
              <p className="font-semibold">아래 버튼을 눌러 인증을 시작하세요</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <button
          type="button"
          onClick={handleEnableVerification}
          disabled={
            isSubmitting ||
            isEnabled ||
            isCompleted ||
            isNoShow ||
            isBeforeReservationTime
          }
          className="w-full py-4 rounded-xl text-white font-semibold text-lg disabled:opacity-60"
          style={{
            backgroundColor:
              isEnabled || isCompleted || isNoShow || isBeforeReservationTime
                ? "#9CA3AF"
                : "#566F2F",
          }}
        >
          {isCompleted
            ? "인증 완료"
            : isNoShow
            ? "노쇼 처리"
            : isEnabled
            ? "인증 버튼 활성화 완료"
            : isSubmitting
            ? "활성화 중..."
            : isBeforeReservationTime
            ? "예약 시간 전"
            : "인증 활성화"}
        </button>
      </div>
    </div>
  );
}
