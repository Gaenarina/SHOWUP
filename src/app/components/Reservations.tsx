import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";

interface Reservation {
  id: string;
  storeId: string;
  storeName: string;
  address: string;
  date: Date;
  time: string;
  deposit: number;
  status: "upcoming" | "completed" | "noshow";
  canConfirm: boolean;
}

const mockReservations: Reservation[] = [
  {
    id: "1",
    storeId: "1",
    storeName: "카페 온",
    address: "안성시 중앙로 123",
    date: new Date(2026, 4, 10, 13, 0),
    time: "13:00",
    deposit: 0.012,
    status: "upcoming",
    canConfirm: true,
  },
  {
    id: "2",
    storeId: "2",
    storeName: "스터디 카페 집중",
    address: "안성시 대학로 456",
    date: new Date(2026, 4, 5, 15, 0),
    time: "15:00",
    deposit: 0.015,
    status: "completed",
    canConfirm: false,
  },
  {
    id: "3",
    storeId: "3",
    storeName: "레스토랑 미식가",
    address: "천안시 번화가 789",
    date: new Date(2026, 3, 28, 19, 0),
    time: "19:00",
    deposit: 0.02,
    status: "noshow",
    canConfirm: false,
  },
];

export function Reservations() {
  const [reservations] = useState<Reservation[]>(mockReservations);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const handleConfirmAttendance = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowConfirmModal(true);
  };

  const confirmAttendance = () => {
    // Here would be blockchain transaction
    setShowConfirmModal(false);
    alert("참석이 확인되었습니다! 보증금이 환불됩니다.");
  };

  const upcomingReservations = reservations.filter((r) => r.status === "upcoming");
  const pastReservations = reservations.filter((r) => r.status !== "upcoming");

  return (
    <div className="min-h-screen p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#566F2F' }}>
          내 예약 현황
        </h2>
        <p className="text-gray-600">예약 내역을 확인하세요</p>
      </div>

      {/* Upcoming Reservations */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-4">예정된 예약</h3>
        {upcomingReservations.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <p className="text-gray-500">예정된 예약이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-lg p-4 shadow-sm border-2"
                style={{ borderColor: '#566F2F' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-lg">{reservation.storeName}</h4>
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}
                  >
                    예정
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin size={16} className="mr-2" />
                    {reservation.address}
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Calendar size={16} className="mr-2" />
                    {format(reservation.date, "yyyy년 M월 d일 (E)", { locale: ko })}
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Clock size={16} className="mr-2" />
                    {reservation.time}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-sm text-gray-600">
                    예치 보증금:{" "}
                    <span className="font-semibold" style={{ color: '#D97706' }}>
                      {reservation.deposit.toFixed(3)} ETH
                    </span>
                  </span>
                  {reservation.canConfirm && (
                    <button
                      onClick={() => handleConfirmAttendance(reservation)}
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: '#566F2F' }}
                    >
                      참석 완료
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Reservations */}
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
                key={reservation.id}
                className="bg-white rounded-lg p-4 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-lg">{reservation.storeName}</h4>
                  {reservation.status === "completed" ? (
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                      style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}
                    >
                      <CheckCircle size={16} />
                      완료
                    </span>
                  ) : (
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                      style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                    >
                      <XCircle size={16} />
                      NOSHOW
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin size={16} className="mr-2" />
                    {reservation.address}
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Calendar size={16} className="mr-2" />
                    {format(reservation.date, "yyyy년 M월 d일 (E)", { locale: ko })}
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
                        color: reservation.status === "completed" ? '#2E7D32' : '#DC2626',
                      }}
                    >
                      {reservation.deposit.toFixed(3)} ETH{" "}
                      {reservation.status === "completed" ? "(환불됨)" : "(차감됨)"}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Attendance Modal */}
      {showConfirmModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">참석 확인</h3>
            <p className="text-gray-600 mb-6">
              {selectedReservation.storeName}에 참석하셨나요?
              <br />
              참석 확인 시 보증금이 환불됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-lg border-2 font-medium"
                style={{ borderColor: '#D1D5DB', color: '#6B7280' }}
              >
                취소
              </button>
              <button
                onClick={confirmAttendance}
                className="flex-1 py-3 rounded-lg text-white font-medium"
                style={{ backgroundColor: '#566F2F' }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
