import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Clock, MapPin, Store, Users } from "lucide-react";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import {
  markReservationAsCancelled,
  subscribeReservation,
} from "@/services/reservationService";
import type { Reservation } from "@/types/reservation";
import {
  NO_SHOW_DEPOSIT_ADDRESS,
  noShowDepositAbi,
} from "@/services/web3/contracts";
import LoadingOverlay from "./LoadingOverlay";
import PageLoading from "./PageLoading";
import { WalletConnectButton } from "./WalletConnectButton";
import { useParams } from "./routerCompat";

export function ReservationCancel() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");

  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const chainAppointmentId = reservation?.chainAppointmentId
    ? BigInt(reservation.chainAppointmentId)
    : BigInt(0);
  const canReadFee =
    Boolean(NO_SHOW_DEPOSIT_ADDRESS) &&
    Boolean(reservation?.chainAppointmentId) &&
    (reservation?.status === "pending" || reservation?.status === "confirmed");

  const { data: cancellationFeeRate, isLoading: isFeeLoading } =
    useReadContract({
      address: NO_SHOW_DEPOSIT_ADDRESS,
      abi: noShowDepositAbi,
      functionName: "getCancellationFeeRate",
      args: [chainAppointmentId],
      query: {
        enabled: canReadFee,
      },
    });

  useEffect(() => {
    if (!reservationId) return;

    const unsubscribe = subscribeReservation(reservationId, (item) => {
      setReservation(item);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [reservationId]);

  const getReservationDate = () => {
    if (!reservation) return new Date();
    return reservation.date instanceof Date
      ? reservation.date
      : new Date(reservation.date);
  };

  const getLocalCancellationFeeRate = () => {
    const reservationDate = getReservationDate();
    const reservationDateStart = new Date(
      reservationDate.getFullYear(),
      reservationDate.getMonth(),
      reservationDate.getDate()
    );
    const remainingMs = reservationDateStart.getTime() - Date.now();
    const daysBeforeReservation = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

    if (daysBeforeReservation >= 7) return 0;
    if (daysBeforeReservation >= 3) return 1000;
    if (daysBeforeReservation === 2) return 2000;
    if (daysBeforeReservation >= 1) return 3000;

    return 0;
  };

  const getFeeRateNumber = () => {
    if (cancellationFeeRate !== undefined) {
      return Number(cancellationFeeRate);
    }

    return getLocalCancellationFeeRate();
  };
  const getFeePercentText = () => `${getFeeRateNumber() / 100}%`;

  const getCancellationAmounts = () => {
    const deposit = Number(reservation?.deposit ?? 0);
    const feeAmount = (deposit * getFeeRateNumber()) / 10000;
    const refundAmount = Math.max(0, deposit - feeAmount);
    return { deposit, feeAmount, refundAmount };
  };

  const canCancel = () => {
    if (!reservation) return false;
    if (
      reservation.status !== "pending" &&
      reservation.status !== "confirmed"
    ) {
      return false;
    }

    const reservationDate = getReservationDate();
    const reservationDateStart = new Date(
      reservationDate.getFullYear(),
      reservationDate.getMonth(),
      reservationDate.getDate()
    );

    return Date.now() < reservationDateStart.getTime();
  };

  const handleClose = () => window.close();

  const handleConfirmCancel = async () => {
    if (!reservation || !reservationId) return;

    if (!reservation.chainAppointmentId) {
      alert("블록체인 예약 ID가 없어 컨트랙트 취소를 진행할 수 없습니다.");
      return;
    }

    if (!NO_SHOW_DEPOSIT_ADDRESS) {
      alert("NoShowDeposit 컨트랙트 주소가 설정되지 않았습니다.");
      return;
    }

    try {
      setActionMessage("예약 취소 트랜잭션을 처리하는 중입니다.");
      const txHash = await writeContractAsync({
        address: NO_SHOW_DEPOSIT_ADDRESS,
        abi: noShowDepositAbi,
        functionName: "cancelReservation",
        args: [chainAppointmentId],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      await markReservationAsCancelled(reservationId);
      alert("예약이 취소되었습니다. 환불액은 컨트랙트에서 자동 정산됩니다.");
      window.opener?.location.reload();
      window.close();
    } catch (error) {
      console.error(error);
      alert("예약 취소 중 오류가 발생했습니다.");
    } finally {
      setActionMessage("");
    }
  };

  if (isLoading) {
    return <PageLoading message="예약 정보를 불러오는 중입니다." bottomPadding="none" />;
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-[#fffdf8] p-5 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 text-center shadow-sm">
          <p className="text-gray-600 mb-4">예약 정보를 찾을 수 없습니다.</p>
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-3 rounded-lg text-white font-semibold"
            style={{ backgroundColor: "#566F2F" }}
          >
            창 닫기
          </button>
        </div>
      </div>
    );
  }

  const reservationDate = getReservationDate();
  const { deposit, feeAmount, refundAmount } = getCancellationAmounts();

  return (
    <div className="min-h-screen bg-[#fffdf8] p-5">
      <LoadingOverlay isOpen={Boolean(actionMessage)} message={actionMessage} />
      <div className="mx-auto max-w-md">
        <div className="mb-5">
          <h1 className="text-2xl font-bold" style={{ color: "#566F2F" }}>
            예약 취소
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            이 가게의 이 예약을 취소합니다.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Store size={20} style={{ color: "#566F2F" }} />
            <h2 className="font-bold">{reservation.storeName}</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span>{reservation.address || "주소 정보 없음"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} />
              <span>{format(reservationDate, "yyyy년 M월 d일 EEEE", { locale: ko })}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={16} />
              <span>{reservation.time}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users size={16} />
              <span>예약 인원 {reservation.partySize ?? 1}명</span>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg border border-red-100 p-4 mb-4 text-sm text-red-900">
          <p className="font-semibold mb-2">예약 취소 수수료 안내</p>
          <p>D-7 이전 전액 환불</p>
          <p>D-6~D-3 10% 차감</p>
          <p>D-2 20% 차감</p>
          <p>D-1 30% 차감</p>
          <p>예약 당일 취소 불가</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-5">
          {isFeeLoading ? (
            <p className="text-sm text-gray-500">적용 수수료를 불러오는 중입니다.</p>
          ) : !canCancel() ? (
            <p className="text-sm font-semibold text-red-600">
              이 예약은 현재 취소할 수 없습니다.
            </p>
          ) : (
            <>
              <div className="flex justify-between gap-3 text-sm mb-2">
                <span className="text-gray-500">예치 보증금</span>
                <span className="font-semibold">{deposit.toFixed(3)} ETH</span>
              </div>
              <div className="flex justify-between gap-3 text-sm mb-2">
                <span className="text-gray-500">나에게 적용될 수수료</span>
                <span className="font-semibold text-red-600">
                  {getFeePercentText()} / {feeAmount.toFixed(3)} ETH
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t pt-3">
                <span className="font-semibold">최종 환불 금액</span>
                <span className="font-bold" style={{ color: "#566F2F" }}>
                  {refundAmount.toFixed(3)} ETH
                </span>
              </div>
            </>
          )}
        </div>

        {!isConnected && (
          <div className="mb-3">
            <WalletConnectButton
              className="w-full rounded-lg py-3 font-semibold text-white"
              style={{ backgroundColor: "#566F2F" }}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={Boolean(actionMessage)}
            className="flex-1 rounded-lg border-2 py-3 font-semibold"
            style={{ borderColor: "#D1D5DB", color: "#6B7280" }}
          >
            돌아가기
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={
              Boolean(actionMessage) ||
              isFeeLoading ||
              !isConnected ||
              !NO_SHOW_DEPOSIT_ADDRESS ||
              !canCancel()
            }
            className="flex-1 rounded-lg py-3 font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "#DC2626" }}
          >
            예약 취소 확정
          </button>
        </div>
      </div>
    </div>
  );
}
