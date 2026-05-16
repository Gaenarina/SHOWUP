import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Link } from "react-router";
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Home,
} from "lucide-react";

interface CustomerReservation {
  id: string;
  customerId: string;
  customerName: string;
  date: Date;
  time: string;
  deposit: number;
  status: "pending" | "confirmed" | "completed" | "noshow";
  customerReputation: {
    title: string;
    noShowCount: number;
    attendanceRate: number;
  };
  canActivateConfirm: boolean;
}

const mockCustomerReservations: CustomerReservation[] = [
  {
    id: "1",
    customerId: "c1",
    customerName: "김철수",
    date: new Date(2026, 4, 8, 13, 0),
    time: "13:00",
    deposit: 0.012,
    status: "pending",
    customerReputation: {
      title: "참석왕 ⭐",
      noShowCount: 1,
      attendanceRate: 95,
    },
    canActivateConfirm: true,
  },
  {
    id: "2",
    customerId: "c2",
    customerName: "이영희",
    date: new Date(2026, 4, 9, 15, 0),
    time: "15:00",
    deposit: 0.025,
    status: "pending",
    customerReputation: {
      title: "노쇼왕 ⭐⭐",
      noShowCount: 4,
      attendanceRate: 60,
    },
    canActivateConfirm: false,
  },
  {
    id: "3",
    customerId: "c3",
    customerName: "박민수",
    date: new Date(2026, 4, 7, 11, 0),
    time: "11:00",
    deposit: 0.01,
    status: "completed",
    customerReputation: {
      title: "참석왕",
      noShowCount: 0,
      attendanceRate: 100,
    },
    canActivateConfirm: false,
  },
  {
    id: "4",
    customerId: "c4",
    customerName: "최유진",
    date: new Date(2026, 4, 6, 19, 0),
    time: "19:00",
    deposit: 0.02,
    status: "noshow",
    customerReputation: {
      title: "노쇼왕 ⭐⭐⭐",
      noShowCount: 5,
      attendanceRate: 50,
    },
    canActivateConfirm: false,
  },
];

export function SellerReservations() {
  const [reservations, setReservations] = useState<CustomerReservation[]>(
    mockCustomerReservations
  );
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<CustomerReservation | null>(null);

  const handleCancelReservation = (reservation: CustomerReservation) => {
    setSelectedReservation(reservation);
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    if (selectedReservation) {
      setReservations(
        reservations.filter((r) => r.id !== selectedReservation.id)
      );
      setShowCancelModal(false);
      alert("예약이 취소되었습니다. 고객에게 보증금이 환불됩니다.");
    }
  };

  const activateConfirmButton = (reservationId: string) => {
    setReservations(
      reservations.map((r) =>
        r.id === reservationId ? { ...r, status: "confirmed" as const } : r
      )
    );
    alert("고객 측에서 참석 완료 버튼이 활성화되었습니다.");
  };

  const markAsNoShow = (reservationId: string) => {
    setReservations(
      reservations.map((r) =>
        r.id === reservationId ? { ...r, status: "noshow" as const } : r
      )
    );
    alert("노쇼 처리되었습니다. 보증금이 입금됩니다.");
  };

  const pendingReservations = reservations.filter(
    (r) => r.status === "pending" || r.status === "confirmed"
  );
  const pastReservations = reservations.filter(
    (r) => r.status === "completed" || r.status === "noshow"
  );

  const getReputationColor = (noShowCount: number) => {
    if (noShowCount === 0) return { text: "#2E7D32", bg: "#E8F5E9" };
    if (noShowCount <= 2) return { text: "#D97706", bg: "#FEF3C7" };
    return { text: "#DC2626", bg: "#FEE2E2" };
  };

  return (
    <div className="min-h-screen p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#566F2F' }}>
              예약 관리 (판매자)
            </h2>
            <p className="text-gray-600">고객 예약을 관리하세요</p>
          </div>
          <Link to="/">
            <button
              className="px-4 py-2 rounded-lg flex items-center gap-2 border-2"
              style={{ borderColor: '#566F2F', color: '#566F2F' }}
            >
              <Home size={18} />
              <span className="text-sm font-medium">소비자</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Pending Reservations */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-4">대기 중인 예약</h3>
        {pendingReservations.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <p className="text-gray-500">대기 중인 예약이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReservations.map((reservation) => {
              const repColor = getReputationColor(
                reservation.customerReputation.noShowCount
              );
              return (
                <div
                  key={reservation.id}
                  className="bg-white rounded-lg p-4 shadow-sm border"
                >
                  {/* Customer Info */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <User size={20} style={{ color: '#566F2F' }} />
                      <h4 className="font-semibold text-lg">
                        {reservation.customerName}
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
                      {reservation.customerReputation.title}
                    </div>
                  </div>

                  {/* Reputation Warning */}
                  {reservation.customerReputation.noShowCount >= 3 && (
                    <div
                      className="rounded p-2 mb-3 flex items-start gap-2"
                      style={{ backgroundColor: '#FEE2E2' }}
                    >
                      <AlertTriangle size={16} style={{ color: '#DC2626' }} />
                      <p className="text-xs" style={{ color: '#991B1B' }}>
                        노쇼 기록이 많은 고객입니다. (노쇼{" "}
                        {reservation.customerReputation.noShowCount}회, 참석률{" "}
                        {reservation.customerReputation.attendanceRate}%)
                      </p>
                    </div>
                  )}

                  {/* Reservation Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600 text-sm">
                      <Calendar size={16} className="mr-2" />
                      {format(reservation.date, "yyyy년 M월 d일 (E)", {
                        locale: ko,
                      })}
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <Clock size={16} className="mr-2" />
                      {reservation.time}
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <DollarSign size={16} className="mr-2" />
                      보증금:{" "}
                      <span
                        className="font-semibold ml-1"
                        style={{ color: '#D97706' }}
                      >
                        {reservation.deposit.toFixed(3)} ETH
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    {reservation.status === "pending" &&
                      reservation.canActivateConfirm && (
                        <>
                          <button
                            onClick={() =>
                              activateConfirmButton(reservation.id)
                            }
                            className="flex-1 py-2 rounded-lg text-white font-medium"
                            style={{ backgroundColor: '#566F2F' }}
                          >
                            참석 확인 활성화
                          </button>
                          <button
                            onClick={() =>
                              handleCancelReservation(reservation)
                            }
                            className="px-4 py-2 rounded-lg border-2 font-medium"
                            style={{
                              borderColor: '#DC2626',
                              color: '#DC2626',
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
                            backgroundColor: '#E8F5E9',
                            color: '#2E7D32',
                          }}
                        >
                          <p className="text-sm font-medium">
                            ✓ 고객 확인 대기 중
                          </p>
                        </div>
                        <button
                          onClick={() => markAsNoShow(reservation.id)}
                          className="w-full py-2 rounded-lg border-2 font-medium text-sm"
                          style={{
                            borderColor: '#DC2626',
                            color: '#DC2626',
                          }}
                        >
                          노쇼 처리 (20분 경과)
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

      {/* Past Reservations */}
      <div>
        <h3 className="font-semibold text-lg mb-4">이전 예약</h3>
        {pastReservations.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <p className="text-gray-500">이전 예약이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastReservations.map((reservation) => {
              const repColor = getReputationColor(
                reservation.customerReputation.noShowCount
              );
              return (
                <div
                  key={reservation.id}
                  className="bg-white rounded-lg p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <User size={20} style={{ color: '#9CA3AF' }} />
                      <h4 className="font-semibold">
                        {reservation.customerName}
                      </h4>
                    </div>
                    {reservation.status === "completed" ? (
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                        style={{
                          backgroundColor: '#E8F5E9',
                          color: '#2E7D32',
                        }}
                      >
                        <CheckCircle size={16} />
                        완료
                      </span>
                    ) : (
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                        style={{
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                        }}
                      >
                        <XCircle size={16} />
                        NOSHOW
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2" />
                      {format(reservation.date, "yyyy년 M월 d일 (E)", {
                        locale: ko,
                      })}{" "}
                      {reservation.time}
                    </div>
                    <div className="flex items-center">
                      <DollarSign size={16} className="mr-2" />
                      보증금:{" "}
                      <span
                        className="font-semibold ml-1"
                        style={{
                          color:
                            reservation.status === "completed"
                              ? '#9CA3AF'
                              : '#2E7D32',
                        }}
                      >
                        {reservation.deposit.toFixed(3)} ETH{" "}
                        {reservation.status === "noshow" && "(입금됨)"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">예약 취소</h3>
            <p className="text-gray-600 mb-6">
              {selectedReservation.customerName}님의 예약을 취소하시겠습니까?
              <br />
              <br />
              고객에게 보증금이 환불되며 알림이 전송됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-lg border-2 font-medium"
                style={{ borderColor: '#D1D5DB', color: '#6B7280' }}
              >
                돌아가기
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 py-3 rounded-lg text-white font-medium"
                style={{ backgroundColor: '#DC2626' }}
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
