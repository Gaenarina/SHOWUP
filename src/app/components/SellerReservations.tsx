import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useNavigate, useSearchParams } from "./routerCompat";
import {
  Calendar,
  Clock,
  User,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Store,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { usePublicClient, useWriteContract } from "wagmi";
import { auth } from "@/firebase";
import {
  cancelReservation,
  expireOverdueReservations,
  markReservationAsNoShow,
  subscribeSellerReservations,
} from "@/services/reservationService";
import type { Reservation } from "@/types/reservation";
import {
  NO_SHOW_DEPOSIT_ADDRESS,
  noShowDepositAbi,
} from "@/services/web3/contracts";
import { DemoAdminReservations } from "./DemoAdminReservations";
import LoadingOverlay from "./LoadingOverlay";
import PageLoading from "./PageLoading";

export function SellerReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedReservationId = searchParams.get("reservationId");
  const demoMasterUid = process.env.NEXT_PUBLIC_DEMO_MASTER_UID ?? "";
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    let unsubscribeReservations: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeReservations) {
        unsubscribeReservations();
      }

      if (!user) {
        setIsLoggedIn(false);
        setCurrentUserId(null);
        setReservations([]);
        setIsLoading(false);
        return;
      }

      setIsLoggedIn(true);
      setCurrentUserId(user.uid);

      if (demoMasterUid && user.uid === demoMasterUid) {
        setReservations([]);
        setIsLoading(false);
        return;
      }

      unsubscribeReservations = subscribeSellerReservations(
        user.uid,
        (items) => {
          setReservations(items);
          setIsLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeReservations) {
        unsubscribeReservations();
      }
    };
  }, [demoMasterUid]);

  useEffect(() => {
    if (!selectedReservationId) return;

    const target = document.getElementById(
      `seller-reservation-${selectedReservationId}`
    );

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedReservationId, reservations]);

  useEffect(() => {
    if (reservations.length === 0) return;

    expireOverdueReservations(reservations);
    const timer = window.setInterval(() => {
      expireOverdueReservations(reservations);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [reservations]);

  const getReservationDate = (date: Date) => {
    return date instanceof Date ? date : new Date(date);
  };

  const getCustomerReputation = (reservation: Reservation) => {
    return (
      reservation.customerReputation ?? {
        title: "일반 고객",
        noShowCount: 0,
        attendanceRate: 100,
      }
    );
  };

  const getCanOpenAuth = (reservation: Reservation) => {
    return reservation.status === "pending" || reservation.status === "confirmed";
  };

  const getIsVerificationExpired = (reservation: Reservation) => {
    if (reservation.consumerVerified) return false;
    if (reservation.status !== "confirmed") return false;
    if (!reservation.verificationExpiresAt) return false;

    return Date.now() > reservation.verificationExpiresAt.getTime();
  };

  const handleReservationClick = (reservation: Reservation) => {
    if (!getCanOpenAuth(reservation)) return;

    navigate(`/seller/reservations/${reservation.id}/auth`);
  };

  const handleCancelReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!selectedReservation) return;

    try {
      setActionMessage("MetaMask에서 판매자 예약 취소 트랜잭션을 확인해주세요.");

      if (!NO_SHOW_DEPOSIT_ADDRESS) {
        throw new Error("보증금 컨트랙트 주소가 설정되지 않았습니다.");
      }

      if (!selectedReservation.chainAppointmentId) {
        throw new Error("블록체인 예약 ID가 없습니다.");
      }

      if (!publicClient) {
        throw new Error("블록체인 네트워크 연결을 확인해주세요.");
      }

      const hash = await writeContractAsync({
        address: NO_SHOW_DEPOSIT_ADDRESS,
        abi: noShowDepositAbi,
        functionName: "sellerCancelReservation",
        args: [BigInt(selectedReservation.chainAppointmentId)],
        gas: BigInt(300000),
      });

      setActionMessage("판매자 예약 취소 트랜잭션을 기다리는 중입니다.");
      await publicClient.waitForTransactionReceipt({ hash });

      await cancelReservation(selectedReservation.id);
      setShowCancelModal(false);
      setSelectedReservation(null);
      alert("예약이 취소되었습니다. 고객에게 보증금이 환불되며 판매자 평판에 영향을 줄 수 있습니다.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "예약 취소 중 오류가 발생했습니다."
      );
    } finally {
      setActionMessage("");
    }
  };

  const markAsNoShow = async (reservation: Reservation) => {
    try {
      setActionMessage("MetaMask에서 노쇼 정산 트랜잭션을 확인해주세요.");

      if (!NO_SHOW_DEPOSIT_ADDRESS) {
        throw new Error("보증금 컨트랙트 주소가 설정되지 않았습니다.");
      }

      if (!reservation.chainAppointmentId) {
        throw new Error("블록체인 예약 ID가 없습니다.");
      }

      if (!publicClient) {
        throw new Error("블록체인 네트워크 연결을 확인해주세요.");
      }

      const hash = await writeContractAsync({
        address: NO_SHOW_DEPOSIT_ADDRESS,
        abi: noShowDepositAbi,
        functionName: "settleNoShow",
        args: [BigInt(reservation.chainAppointmentId)],
        gas: BigInt(300000),
      });

      setActionMessage("노쇼 정산 트랜잭션을 기다리는 중입니다.");
      await publicClient.waitForTransactionReceipt({ hash });

      await markReservationAsNoShow(reservation.id);
      alert("노쇼 처리되었습니다. 보증금이 판매자에게 정산됩니다.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "노쇼 처리 중 오류가 발생했습니다."
      );
    } finally {
      setActionMessage("");
    }
  };

  const pendingReservations = reservations.filter(
    (reservation) =>
      reservation.status === "pending" || reservation.status === "confirmed"
  );

  const pastReservations = reservations.filter(
    (reservation) =>
      reservation.status === "completed" ||
      reservation.status === "noshow" ||
      reservation.status === "cancelled"
  );

  const getReputationColor = (noShowCount: number) => {
    if (noShowCount === 0) return { text: "#2E7D32", bg: "#E8F5E9" };
    if (noShowCount <= 2) return { text: "#D97706", bg: "#FEF3C7" };
    return { text: "#DC2626", bg: "#FEE2E2" };
  };

  const isSelectedReservation = (reservationId: string) => {
    return selectedReservationId === reservationId;
  };

  if (isLoading) {
    return <PageLoading message="예약 정보를 불러오는 중입니다." />;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen p-4 pb-20 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center w-full max-w-sm">
          <Store size={48} className="mx-auto mb-4 text-gray-300" />

          <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>

          <p className="text-gray-500 mb-5">
            판매자 예약 관리를 이용하려면
            <br />
            판매자 계정으로 로그인해주세요.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full py-3 rounded-lg text-white font-semibold"
            style={{ backgroundColor: "#566F2F" }}
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  if (demoMasterUid && currentUserId === demoMasterUid) {
    return <DemoAdminReservations />;
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <LoadingOverlay isOpen={Boolean(actionMessage)} message={actionMessage} />

      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: "#566F2F" }}>
              예약 관리
            </h2>
            <p className="text-gray-600">고객 예약을 관리하세요</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-4">대기 중인 예약</h3>

        {pendingReservations.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <p className="text-gray-500">대기 중인 예약이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReservations.map((reservation) => {
              const reputation = getCustomerReputation(reservation);
              const repColor = getReputationColor(reputation.noShowCount);
              const canOpenAuth = getCanOpenAuth(reservation);
              const isVerificationExpired = getIsVerificationExpired(reservation);

              return (
                <div
                  id={`seller-reservation-${reservation.id}`}
                  key={reservation.id}
                  onClick={() => handleReservationClick(reservation)}
                  className={`bg-white rounded-lg p-4 shadow-sm border transition-all ${
                    canOpenAuth ? "cursor-pointer hover:shadow-md" : ""
                  } ${
                    isSelectedReservation(reservation.id)
                      ? "border-2 ring-4 ring-[#DDE8D2]"
                      : ""
                  }`}
                  style={{
                    borderColor: isSelectedReservation(reservation.id)
                      ? "#566F2F"
                      : "#E5E7EB",
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <User size={20} style={{ color: "#566F2F" }} />
                      <h4 className="font-semibold text-lg">
                        {reservation.consumerName}
                      </h4>
                    </div>

                    <div
                      className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                      style={{
                        backgroundColor: repColor.bg,
                        color: repColor.text,
                      }}
                    >
                      <Star size={12} />
                      {reputation.title}
                    </div>
                  </div>

                  {reputation.noShowCount >= 3 && (
                    <div
                      className="rounded p-2 mb-3 flex items-start gap-2"
                      style={{ backgroundColor: "#FEE2E2" }}
                    >
                      <AlertTriangle size={16} style={{ color: "#DC2626" }} />
                      <p className="text-xs" style={{ color: "#991B1B" }}>
                        노쇼 기록이 많은 고객입니다. 노쇼{" "}
                        {reputation.noShowCount}회, 참석률{" "}
                        {reputation.attendanceRate}%
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600 text-sm">
                      <Calendar size={16} className="mr-2" />
                      {format(
                        getReservationDate(reservation.date),
                        "yyyy년 M월 d일(E)",
                        { locale: ko }
                      )}
                    </div>

                    <div className="flex items-center text-gray-600 text-sm">
                      <Clock size={16} className="mr-2" />
                      {reservation.time}
                    </div>

                    <div className="flex items-center text-gray-600 text-sm">
                      <Users size={16} className="mr-2" />
                      예약 인원 {reservation.partySize ?? 1}명
                    </div>

                    <div className="flex items-center text-gray-600 text-sm">
                      <DollarSign size={16} className="mr-2" />
                      보증금{" "}
                      <span
                        className="font-semibold ml-1"
                        style={{ color: "#D97706" }}
                      >
                        {Number(reservation.deposit ?? 0).toFixed(3)} ETH
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    {reservation.status === "pending" && (
                      <>
                        <div
                          className="flex-1 py-2 rounded-lg text-center text-sm font-medium"
                          style={{
                            backgroundColor: "#E8F5E9",
                            color: "#2E7D32",
                          }}
                        >
                          손님 인증 버튼 활성화
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelReservation(reservation);
                          }}
                          className="px-4 py-2 rounded-lg border-2 font-medium"
                          style={{
                            borderColor: "#DC2626",
                            color: "#DC2626",
                          }}
                        >
                          취소
                        </button>
                      </>
                    )}

                    {reservation.status === "confirmed" && (
                      <div className="flex-1">
                        <div
                          className="text-center py-2 rounded-lg mb-2"
                          style={{
                            backgroundColor: isVerificationExpired
                              ? "#FEE2E2"
                              : "#E8F5E9",
                            color: isVerificationExpired ? "#DC2626" : "#2E7D32",
                          }}
                        >
                          <p className="text-sm font-medium">
                            {isVerificationExpired
                              ? "인증 시간이 만료되었습니다. 노쇼 처리가 필요합니다."
                              : "인증 버튼 활성화 완료, 고객 확인 대기 중"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsNoShow(reservation);
                          }}
                          disabled={Boolean(actionMessage)}
                          className="w-full py-2 rounded-lg border-2 font-medium text-sm"
                          style={{
                            borderColor: "#DC2626",
                            color: "#DC2626",
                          }}
                        >
                          수동 노쇼 처리
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-4">이전 예약</h3>

        {pastReservations.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <p className="text-gray-500">이전 예약이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastReservations.map((reservation) => {
              const reputation = getCustomerReputation(reservation);
              const repColor = getReputationColor(reputation.noShowCount);

              return (
                <div
                  id={`seller-reservation-${reservation.id}`}
                  key={reservation.id}
                  className={`bg-white rounded-lg p-4 shadow-sm border transition-all ${
                    isSelectedReservation(reservation.id)
                      ? "border-2 ring-4 ring-[#DDE8D2]"
                      : ""
                  }`}
                  style={{
                    borderColor: isSelectedReservation(reservation.id)
                      ? "#566F2F"
                      : "#E5E7EB",
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <User size={20} style={{ color: "#9CA3AF" }} />
                      <h4 className="font-semibold">
                        {reservation.consumerName}
                      </h4>
                    </div>

                    {reservation.status === "completed" ? (
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                        style={{
                          backgroundColor: "#F3F4F6",
                          color: "#6B7280",
                        }}
                      >
                        <CheckCircle size={16} />
                        인증 완료
                      </span>
                    ) : reservation.status === "cancelled" ? (
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                        style={{
                          backgroundColor: "#F3F4F6",
                          color: "#6B7280",
                        }}
                      >
                        <XCircle size={16} />
                        예약 취소
                      </span>
                    ) : (
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                        style={{
                          backgroundColor: "#FEE2E2",
                          color: "#DC2626",
                        }}
                      >
                        <XCircle size={16} />
                        NOSHOW
                      </span>
                    )}
                  </div>

                  <div
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-3"
                    style={{
                      backgroundColor: repColor.bg,
                      color: repColor.text,
                    }}
                  >
                    <Star size={12} />
                    {reputation.title}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2" />
                      {format(
                        getReservationDate(reservation.date),
                        "yyyy년 M월 d일(E)",
                        { locale: ko }
                      )}{" "}
                      {reservation.time}
                    </div>

                    <div className="flex items-center">
                      <Users size={16} className="mr-2" />
                      예약 인원 {reservation.partySize ?? 1}명
                    </div>

                    <div className="flex items-center">
                      <DollarSign size={16} className="mr-2" />
                      보증금{" "}
                      <span
                        className="font-semibold ml-1"
                        style={{
                          color:
                            reservation.status === "completed"
                              ? "#9CA3AF"
                              : reservation.status === "cancelled"
                              ? "#6B7280"
                              : "#2E7D32",
                        }}
                      >
                        {Number(reservation.deposit ?? 0).toFixed(3)} ETH{" "}
                        {reservation.status === "noshow" && "(입금 예정)"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCancelModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">예약 취소</h3>

            <p className="text-gray-600 mb-4">
              {selectedReservation.consumerName}님의 예약을 취소하시겠습니까?
              <br />
              <br />
              고객에게 보증금이 환불되며 알림이 전송됩니다.
            </p>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
              <p className="font-semibold text-red-700 mb-1">
                판매자 예약 취소 안내
              </p>
              <div className="text-sm text-red-700 leading-relaxed space-y-0.5">
                <p>예약을 취소하면 판매자 평판이 하락할 수 있습니다.</p>
                <p>평판이 낮아지면 가게 노출이 제한될 수 있으니</p>
                <p>신중하게 진행해주세요.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-lg border-2 font-medium"
                style={{ borderColor: "#D1D5DB", color: "#6B7280" }}
              >
                돌아가기
              </button>

              <button
                type="button"
                onClick={confirmCancel}
                disabled={Boolean(actionMessage)}
                className="flex-1 py-3 rounded-lg text-white font-medium"
                style={{ backgroundColor: "#DC2626" }}
              >
                취소 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
