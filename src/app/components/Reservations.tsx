import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Calendar,
  CalendarCheck,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  XCircle,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import {
  expireOverdueReservations,
  subscribeConsumerReservations,
} from "@/services/reservationService";
import type { Reservation } from "@/types/reservation";
import PageLoading from "./PageLoading";
import { useNavigate, useSearchParams } from "./routerCompat";

export function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedReservationId = searchParams.get("reservationId");

  useEffect(() => {
    let unsubscribeReservations: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeReservations) unsubscribeReservations();

      if (!user) {
        setIsLoggedIn(false);
        setReservations([]);
        setIsLoading(false);
        return;
      }

      setIsLoggedIn(true);
      unsubscribeReservations = subscribeConsumerReservations(user.uid, (items) => {
        setReservations(items);
        setIsLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeReservations) unsubscribeReservations();
    };
  }, []);

  useEffect(() => {
    if (reservations.length === 0) return;

    expireOverdueReservations(reservations);
    const timer = window.setInterval(() => {
      expireOverdueReservations(reservations);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [reservations]);

  useEffect(() => {
    if (!selectedReservationId) return;

    document.getElementById(`reservation-${selectedReservationId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [selectedReservationId, reservations]);

  const getReservationDate = (date: Date) => {
    return date instanceof Date ? date : new Date(date);
  };

  const getRemainingText = (reservation: Reservation) => {
    if (!reservation.verificationExpiresAt) return "0:00";

    const remaining = reservation.verificationExpiresAt.getTime() - Date.now();
    const remainingSeconds = Math.max(0, Math.ceil(remaining / 1000));
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const getCanConfirm = (reservation: Reservation) => {
    if (!reservation.verificationEnabled) return false;
    if (reservation.consumerVerified) return false;
    if (reservation.status !== "confirmed") return false;
    if (!reservation.verificationExpiresAt) return false;

    return Date.now() <= reservation.verificationExpiresAt.getTime();
  };

  const getIsVerificationExpired = (reservation: Reservation) => {
    if (reservation.consumerVerified) return false;
    if (reservation.status !== "confirmed") return false;
    if (!reservation.verificationExpiresAt) return false;

    return Date.now() > reservation.verificationExpiresAt.getTime();
  };

  const getCanCancel = (reservation: Reservation) => {
    if (
      reservation.status !== "pending" &&
      reservation.status !== "confirmed"
    ) {
      return false;
    }

    const reservationDate = getReservationDate(reservation.date);
    const reservationDateStart = new Date(
      reservationDate.getFullYear(),
      reservationDate.getMonth(),
      reservationDate.getDate()
    );

    return Date.now() < reservationDateStart.getTime();
  };

  const getStatusText = (reservation: Reservation) => {
    if (getCanConfirm(reservation)) return `인증하기 · ${getRemainingText(reservation)}`;
    if (reservation.consumerVerified) return "인증 완료";
    if (getIsVerificationExpired(reservation)) return "인증 시간 만료";
    if (reservation.status === "confirmed") return "판매자 인증 대기 중";
    if (reservation.status === "pending") return "판매자 인증 대기";
    if (reservation.status === "cancelled") return "예약 취소";

    return "예약 종료";
  };

  const handleReservationClick = (reservation: Reservation) => {
    if (!getCanConfirm(reservation)) return;
    navigate(`/reservations/${reservation.id}/auth`);
  };

  const openCancelWindow = (reservation: Reservation) => {
    const features = "width=460,height=760,menubar=no,toolbar=no,location=no";
    window.open(
      `/reservations/${reservation.id}/cancel`,
      "showup-reservation-cancel",
      features
    );
  };

  const isSelectedReservation = (reservationId: string) => {
    return selectedReservationId === reservationId;
  };

  const upcomingReservations = reservations.filter(
    (reservation) =>
      reservation.status === "pending" ||
      (reservation.status === "confirmed" &&
        !getIsVerificationExpired(reservation))
  );

  const pastReservations = reservations.filter(
    (reservation) =>
      reservation.status === "completed" ||
      reservation.status === "noshow" ||
      reservation.status === "cancelled" ||
      getIsVerificationExpired(reservation)
  );

  if (isLoading) {
    return <PageLoading message="예약 정보를 불러오는 중입니다." />;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen p-4 pb-20 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center w-full max-w-sm">
          <CalendarCheck size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 mb-5">
            예약 현황을 확인하려면 로그인해주세요.
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

  const renderReservationCard = (
    reservation: Reservation,
    variant: "upcoming" | "past"
  ) => {
    const canConfirm = getCanConfirm(reservation);
    const isVerificationExpired = getIsVerificationExpired(reservation);
    const showCancelButton =
      variant === "upcoming" &&
      (reservation.status === "pending" || reservation.status === "confirmed");
    const reservationDate = getReservationDate(reservation.date);

    return (
      <div
        id={`reservation-${reservation.id}`}
        key={reservation.id}
        onClick={() => handleReservationClick(reservation)}
        className={`bg-white rounded-lg p-4 shadow-sm border-2 transition-all ${
          canConfirm ? "cursor-pointer hover:shadow-md" : ""
        } ${
          isSelectedReservation(reservation.id) ? "ring-4 ring-[#DDE8D2]" : ""
        }`}
        style={{ borderColor: canConfirm ? "#566F2F" : "#E5E7EB" }}
      >
        <div className="flex justify-between items-start gap-3 mb-3">
          <h4 className="font-semibold text-lg">{reservation.storeName}</h4>

          {variant === "past" ? (
            <span
              className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
              style={{
                backgroundColor:
                  reservation.status === "noshow" || isVerificationExpired
                    ? "#FEE2E2"
                    : "#F3F4F6",
                color:
                  reservation.status === "noshow" || isVerificationExpired
                    ? "#DC2626"
                    : "#6B7280",
              }}
            >
              {reservation.status === "completed" ? (
                <CheckCircle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {reservation.status === "completed"
                ? "인증 완료"
                : reservation.status === "cancelled"
                ? "예약 취소"
                : reservation.status === "noshow"
                ? "NOSHOW"
                : "인증 시간 만료"}
            </span>
          ) : (
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: canConfirm
                  ? "#E8F5E9"
                  : reservation.status === "confirmed"
                  ? "#FEF3C7"
                  : "#F3F4F6",
                color: canConfirm
                  ? "#2E7D32"
                  : reservation.status === "confirmed"
                  ? "#92400E"
                  : "#6B7280",
              }}
            >
              {canConfirm
                ? "인증 가능"
                : isVerificationExpired
                ? "인증 만료"
                : reservation.status === "confirmed"
                ? "인증 대기"
                : "예약 요청"}
            </span>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin size={16} className="mr-2" />
            {reservation.address || "주소 정보 없음"}
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Calendar size={16} className="mr-2" />
            {format(reservationDate, "yyyy년 M월 d일 EEEE", { locale: ko })}
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Clock size={16} className="mr-2" />
            {reservation.time}
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Users size={16} className="mr-2" />
            예약 인원 {reservation.partySize ?? 1}명
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-600">
              예치 보증금{" "}
              <span className="font-semibold" style={{ color: "#D97706" }}>
                {Number(reservation.deposit ?? 0).toFixed(3)} ETH
              </span>
            </span>

            <span
              className="text-sm text-gray-400 text-right"
              style={{ color: canConfirm ? "#566F2F" : undefined }}
            >
              {getStatusText(reservation)}
            </span>
          </div>

          {showCancelButton && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                예약 취소가 필요한 경우 수수료를 확인한 뒤 진행하세요.
              </p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openCancelWindow(reservation);
                }}
                className="shrink-0 px-3 py-2 rounded-lg border-2 text-sm font-semibold"
                style={{ borderColor: "#DC2626", color: "#DC2626" }}
              >
                예약 취소하기
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "#566F2F" }}>
          내 예약 현황
        </h2>
        <p className="text-gray-600">예약 내역을 확인하세요.</p>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-4">예정된 예약</h3>
        {upcomingReservations.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <p className="text-gray-500">예정된 예약이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingReservations.map((reservation) =>
              renderReservationCard(reservation, "upcoming")
            )}
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
            {pastReservations.map((reservation) =>
              renderReservationCard(reservation, "past")
            )}
          </div>
        )}
      </div>
    </div>
  );
}
