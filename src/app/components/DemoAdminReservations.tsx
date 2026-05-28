import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useNavigate, useSearchParams } from "./routerCompat";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Store,
  User,
  Users,
  XCircle,
} from "lucide-react";
import {
  cancelReservation,
  markReservationAsNoShow,
  subscribeDemoAdminReservations,
} from "../../services/reservationService";
import type { Reservation } from "../../types/reservation";
import LoadingOverlay from "./LoadingOverlay";

const DEMO_STORES = [
  { id: "all", name: "전체" },
  { id: "default-cafe-on", name: "카페 온" },
  { id: "default-study-cafe", name: "스터디 카페 집중" },
  { id: "default-restaurant", name: "레스토랑 미식가" },
];

export function DemoAdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("all");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedReservationId = searchParams.get("reservationId");

  useEffect(() => {
    const unsubscribe = subscribeDemoAdminReservations((items) => {
      setReservations(items);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedReservationId) return;

    const target = document.getElementById(
      `demo-admin-reservation-${selectedReservationId}`
    );

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedReservationId, reservations]);

  const filteredReservations = useMemo(() => {
    if (selectedStoreId === "all") {
      return reservations;
    }

    return reservations.filter(
      (reservation) => reservation.storeId === selectedStoreId
    );
  }, [reservations, selectedStoreId]);

  const pendingReservations = filteredReservations.filter(
    (reservation) =>
      reservation.status === "pending" || reservation.status === "confirmed"
  );

  const pastReservations = filteredReservations.filter(
    (reservation) =>
      reservation.status === "completed" || reservation.status === "noshow"
  );

  const getStoreCount = (storeId: string) => {
    if (storeId === "all") return reservations.length;

    return reservations.filter((reservation) => reservation.storeId === storeId)
      .length;
  };

  const getReservationDate = (date: Date) => {
    return date instanceof Date ? date : new Date(date);
  };

  const getCanOpenAuth = (reservation: Reservation) => {
    return reservation.status === "pending" || reservation.status === "confirmed";
  };

  const isSelectedReservation = (reservationId: string) => {
    return selectedReservationId === reservationId;
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
      setActionMessage("예약을 취소하는 중입니다.");
      await cancelReservation(selectedReservation.id);
      setShowCancelModal(false);
      setSelectedReservation(null);
      alert("예약이 취소되었습니다. 고객에게 보증금이 환불됩니다.");
    } catch (error) {
      console.error(error);
      alert("예약 취소 중 오류가 발생했습니다.");
    } finally {
      setActionMessage("");
    }
  };

  const markAsNoShow = async (reservationId: string) => {
    try {
      setActionMessage("노쇼 처리를 진행하는 중입니다.");
      await markReservationAsNoShow(reservationId);
      alert("노쇼 처리되었습니다. 보증금이 입금됩니다.");
    } catch (error) {
      console.error(error);
      alert("노쇼 처리 중 오류가 발생했습니다.");
    } finally {
      setActionMessage("");
    }
  };

  const renderReservationCard = (reservation: Reservation) => {
    const canOpenAuth = getCanOpenAuth(reservation);

    return (
      <div
        id={`demo-admin-reservation-${reservation.id}`}
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
        <div className="flex justify-between items-start gap-3 mb-3">
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold mb-2 bg-[#F1F5EC] text-[#566F2F]">
              <Store size={12} />
              {reservation.storeName}
            </div>

            <div className="flex items-center gap-2">
              <User size={20} style={{ color: "#566F2F" }} />
              <h4 className="font-semibold text-lg">
                {reservation.consumerName}
              </h4>
            </div>
          </div>

          {reservation.status === "completed" && (
            <span className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 bg-gray-100 text-gray-500">
              <CheckCircle size={16} />
              인증 완료
            </span>
          )}

          {reservation.status === "noshow" && (
            <span className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 bg-red-100 text-red-600">
              <XCircle size={16} />
              NOSHOW
            </span>
          )}

          {reservation.status === "pending" && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
              인증 대기
            </span>
          )}

          {reservation.status === "confirmed" && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
              인증 활성화
            </span>
          )}
        </div>

        {reservation.partySize && reservation.partySize >= 8 && (
          <div className="rounded p-2 mb-3 flex items-start gap-2 bg-amber-50">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-xs text-amber-700">
              예약 인원이 많습니다. 수용 가능 여부를 확인해주세요.
            </p>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600 text-sm">
            <Calendar size={16} className="mr-2" />
            {format(getReservationDate(reservation.date), "yyyy년 M월 d일(E)", {
              locale: ko,
            })}
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
            <span className="font-semibold ml-1 text-amber-600">
              {Number(reservation.deposit ?? 0).toFixed(3)} ETH
            </span>
          </div>
        </div>

        {(reservation.status === "pending" || reservation.status === "confirmed") && (
          <div className="flex gap-2 pt-3 border-t">
            {reservation.status === "pending" && (
              <>
                <div className="flex-1 py-2 rounded-lg text-center text-sm font-medium bg-green-50 text-green-700">
                  카드 선택 시 인증 버튼 활성화
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
                <div className="text-center py-2 rounded-lg mb-2 bg-green-50 text-green-700">
                  <p className="text-sm font-medium">
                    인증 버튼 활성화 완료, 고객 확인 대기 중
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsNoShow(reservation.id);
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
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 pb-20 flex items-center justify-center">
        <p className="text-gray-500">데모 예약 정보를 불러오는 중입니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <LoadingOverlay isOpen={Boolean(actionMessage)} message={actionMessage} />

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "#566F2F" }}>
          데모 관리자 예약관리
        </h2>

        <p className="text-gray-600">
          기본 등록 가게 3개의 예약을 통합 관리합니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">전체 예약</p>
          <p className="text-2xl font-bold" style={{ color: "#566F2F" }}>
            {reservations.length}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">처리 대기</p>
          <p className="text-2xl font-bold text-amber-600">
            {
              reservations.filter(
                (reservation) =>
                  reservation.status === "pending" ||
                  reservation.status === "confirmed"
              ).length
            }
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {DEMO_STORES.map((store) => (
          <button
            key={store.id}
            type="button"
            onClick={() => setSelectedStoreId(store.id)}
            className="shrink-0 px-4 py-2 rounded-full border text-sm font-semibold"
            style={{
              backgroundColor:
                selectedStoreId === store.id ? "#566F2F" : "#FFFFFF",
              borderColor: selectedStoreId === store.id ? "#566F2F" : "#D1D5DB",
              color: selectedStoreId === store.id ? "#FFFFFF" : "#4B5563",
            }}
          >
            {store.name} {getStoreCount(store.id)}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-4">대기 중인 예약</h3>

        {pendingReservations.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <p className="text-gray-500">대기 중인 예약이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReservations.map(renderReservationCard)}
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
            {pastReservations.map(renderReservationCard)}
          </div>
        )}
      </div>

      {showCancelModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">예약 취소</h3>

            <p className="text-gray-600 mb-6">
              {selectedReservation.storeName}의 {selectedReservation.consumerName}
              님 예약을 취소하시겠습니까?
              <br />
              <br />
              인원 수용이 어렵거나 운영 사정이 있는 경우 예약을 취소할 수
              있습니다.
            </p>

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
