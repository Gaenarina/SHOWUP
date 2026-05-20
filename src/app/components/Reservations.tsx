import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Clock, MapPin, CheckCircle, XCircle, CalendarCheck, } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import {
  expireOverdueReservations,
  subscribeConsumerReservations,
} from "../../services/reservationService";
import type { Reservation } from "../../types/reservation";

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
      if (unsubscribeReservations) {
        unsubscribeReservations();
      }

      if (!user) {
        setIsLoggedIn(false);
        setReservations([]);
        setIsLoading(false);
        return;
      }

      setIsLoggedIn(true);

      unsubscribeReservations = subscribeConsumerReservations(
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

    const target = document.getElementById(
      `reservation-${selectedReservationId}`
    );

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedReservationId, reservations]);

  const getReservationDate = (date: Date) => {
    return date instanceof Date ? date : new Date(date);
  };

  const getRemainingSeconds = (reservation: Reservation) => {
    if (!reservation.verificationExpiresAt) return 0;

    const remaining = reservation.verificationExpiresAt.getTime() - Date.now();

    return Math.max(0, Math.ceil(remaining / 1000));
  };

  const getRemainingText = (reservation: Reservation) => {
    const remainingSeconds = getRemainingSeconds(reservation);
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

  const handleReservationClick = (reservation: Reservation) => {
    if (!getCanConfirm(reservation)) return;

    navigate(`/reservations/${reservation.id}/auth`);
  };

  const isSelectedReservation = (reservationId: string) => {
    return selectedReservationId === reservationId;
  };

  const upcomingReservations = reservations.filter(
    (reservation) =>
      reservation.status === "pending" || reservation.status === "confirmed"
  );

  const pastReservations = reservations.filter(
    (reservation) =>
      reservation.status === "completed" || reservation.status === "noshow"
  );

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 pb-20 flex items-center justify-center">
        <p className="text-gray-500">예약 정보를 불러오는 중입니다.</p>
      </div>
    );
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

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "#566F2F" }}>
          내 예약 현황
        </h2>
        <p className="text-gray-600">예약 내역을 확인하세요</p>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-4">예정된 예약</h3>

        {upcomingReservations.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <p className="text-gray-500">예정된 예약이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingReservations.map((reservation) => {
              const canConfirm = getCanConfirm(reservation);

              return (
                <div
                  id={`reservation-${reservation.id}`}
                  key={reservation.id}
                  onClick={() => handleReservationClick(reservation)}
                  className={`bg-white rounded-lg p-4 shadow-sm border-2 transition-all ${
                    canConfirm ? "cursor-pointer hover:shadow-md" : ""
                  } ${
                    isSelectedReservation(reservation.id)
                      ? "ring-4 ring-[#DDE8D2]"
                      : ""
                  }`}
                  style={{ borderColor: canConfirm ? "#566F2F" : "#E5E7EB" }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-lg">
                      {reservation.storeName}
                    </h4>

                    {canConfirm ? (
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}
                      >
                        인증 가능
                      </span>
                    ) : reservation.status === "confirmed" ? (
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
                      >
                        인증 대기
                      </span>
                    ) : (
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
                      >
                        예약 요청
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
                      {format(
                        getReservationDate(reservation.date),
                        "yyyy년 M월 d일 (E)",
                        { locale: ko }
                      )}
                    </div>

                    <div className="flex items-center text-gray-600 text-sm">
                      <Clock size={16} className="mr-2" />
                      {reservation.time}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-sm text-gray-600">
                      예치 보증금:{" "}
                      <span
                        className="font-semibold"
                        style={{ color: "#D97706" }}
                      >
                        {Number(reservation.deposit ?? 0).toFixed(3)} ETH
                      </span>
                    </span>

                    {canConfirm ? (
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#566F2F" }}
                      >
                        인증하기 · {getRemainingText(reservation)}
                      </span>
                    ) : reservation.consumerVerified ? (
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#6B7280" }}
                      >
                        인증 완료
                      </span>
                    ) : reservation.status === "confirmed" ? (
                      <span className="text-sm text-gray-400">
                        판매자 활성화 확인 중
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">
                        판매자 인증 대기
                      </span>
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
            {pastReservations.map((reservation) => (
              <div
                id={`reservation-${reservation.id}`}
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
                  <h4 className="font-semibold text-lg">
                    {reservation.storeName}
                  </h4>

                  {reservation.status === "completed" ? (
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                      style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
                    >
                      <CheckCircle size={16} />
                      인증 완료
                    </span>
                  ) : (
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                      style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                    >
                      <XCircle size={16} />
                      NOSHOW
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
                    {format(
                      getReservationDate(reservation.date),
                      "yyyy년 M월 d일 (E)",
                      { locale: ko }
                    )}
                  </div>

                  <div className="flex items-center text-gray-600 text-sm">
                    <Clock size={16} className="mr-2" />
                    {reservation.time}
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <span className="text-sm text-gray-600">
                    보증금:{" "}
                    <span
                      className="font-semibold"
                      style={{
                        color:
                          reservation.status === "completed"
                            ? "#6B7280"
                            : "#DC2626",
                      }}
                    >
                      {Number(reservation.deposit ?? 0).toFixed(3)} ETH{" "}
                      {reservation.status === "completed"
                        ? "(환불 예정)"
                        : "(차감 예정)"}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}