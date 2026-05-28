import { useEffect, useState } from "react";
import { Link, useNavigate } from "./routerCompat";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  CalendarCheck,
  Users,
  Wallet,
  AlertCircle,
  Clock,
  CheckCircle,
  Bell,
  ChevronRight,
  Store,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { getUserProfile, logoutUser } from "../../services/authService";
import { subscribeSellerReservations } from "../../services/reservationService";
import { subscribeSellerStore } from "../../services/storeService";
import type { AppUser } from "../../types/user";
import type { Reservation } from "../../types/reservation";
import type { Store as StoreType } from "../../types/store";
import PageLoading from "./PageLoading";

export function SellerHome() {
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [store, setStore] = useState<StoreType | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeReservations: (() => void) | undefined;
    let unsubscribeStore: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeReservations) {
        unsubscribeReservations();
      }

      if (unsubscribeStore) {
        unsubscribeStore();
      }

      if (!user) {
        setProfile(null);
        setStore(null);
        setReservations([]);
        setIsLoading(false);
        return;
      }

      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      setIsLoading(false);

      if (userProfile?.role !== "seller") {
        setStore(null);
        setReservations([]);
        return;
      }

      unsubscribeReservations = subscribeSellerReservations(
        user.uid,
        setReservations
      );

      unsubscribeStore = subscribeSellerStore(user.uid, setStore);
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeReservations) {
        unsubscribeReservations();
      }

      if (unsubscribeStore) {
        unsubscribeStore();
      }
    };
  }, []);

  const getDateValue = (value: any) => {
    if (value?.toDate) return value.toDate();
    return new Date(value);
  };

  const isToday = (date: Date) => {
    const target = getDateValue(date);
    const today = new Date();

    return (
      target.getFullYear() === today.getFullYear() &&
      target.getMonth() === today.getMonth() &&
      target.getDate() === today.getDate()
    );
  };

  const getStatusText = (status: string) => {
    if (status === "pending") return "예약 요청";
    if (status === "confirmed") return "인증 대기";
    if (status === "completed" || status === "verified") return "완료";
    if (status === "noshow") return "노쇼";
    return "예약 상태 확인";
  };

  const todayReservations = reservations.filter((reservation) =>
    isToday(reservation.date)
  );

  const waitingReservations = reservations.filter((reservation) => {
    const status = String(reservation.status);
    return (
      (status === "pending" || status === "confirmed") &&
      !reservation.consumerVerified
    );
  });

  const newReservationCount = reservations.filter(
    (reservation) => String(reservation.status) === "pending"
  ).length;

  const noShowCount = reservations.filter(
    (reservation) => String(reservation.status) === "noshow"
  ).length;

  const activeDepositTotal = reservations
    .filter((reservation) => {
      const status = String(reservation.status);
      return status === "pending" || status === "confirmed";
    })
    .reduce((sum, reservation) => sum + Number(reservation.deposit ?? 0), 0);

  const recentReservations = [...reservations]
    .sort(
      (a, b) =>
        getDateValue(b.date).getTime() - getDateValue(a.date).getTime()
    )
    .slice(0, 3);

  const todayTasks = [
    {
      id: "1",
      title: "인증 대기",
      description:
        waitingReservations.length > 0
          ? `인증 대기가 필요한 예약 ${waitingReservations.length}건이 있습니다.`
          : "현재 인증 대기 중인 예약이 없습니다.",
      icon: CheckCircle,
      color: "#566F2F",
      path: "/seller/reservations",
    },
    {
      id: "2",
      title: "신규 예약 요청",
      description:
        newReservationCount > 0
          ? `새로운 예약 요청 ${newReservationCount}건을 확인해주세요.`
          : "새로운 예약 요청이 없습니다.",
      icon: Bell,
      color: "#D97706",
      path: "/seller/reservations",
    },
    {
      id: "3",
      title: "노쇼 처리 확인",
      description:
        noShowCount > 0
          ? `노쇼 처리된 예약 ${noShowCount}건이 있습니다.`
          : "노쇼 처리된 예약이 없습니다.",
      icon: AlertCircle,
      color: "#DC2626",
      path: "/seller/reservations",
    },
  ];

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <PageLoading message="판매자 정보를 불러오는 중입니다." bottomPadding="seller" />
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-4 pb-24 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center w-full max-w-sm">
          <Store size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 mb-5">
            판매자 홈을 이용하려면
            <br />
            판매자 계정으로 로그인해주세요.
          </p>
          <Link to="/login">
            <button
              type="button"
              className="w-full py-3 rounded-lg text-white font-semibold"
              style={{ backgroundColor: "#566F2F" }}
            >
              로그인하러 가기
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (profile.role !== "seller") {
    return (
      <div className="min-h-screen p-4 pb-24 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center w-full max-w-sm">
          <Store size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">판매자 계정이 아닙니다</h2>
          <p className="text-gray-500 mb-5">
            판매자 홈은 판매자 계정으로 로그인해야 이용할 수 있습니다.
          </p>
          <Link to="/login">
            <button
              type="button"
              className="w-full py-3 rounded-lg text-white font-semibold"
              style={{ backgroundColor: "#566F2F" }}
            >
              판매자 계정으로 로그인
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium" style={{ color: "#718952" }}>
              노쇼 방지 예약 플랫폼
            </span>

            <h1 className="showup-logo mb-1">ShowUp</h1>

            <p className="text-base font-semibold" style={{ color: "#566F2F" }}>
              판매자 홈
            </p>

            <p className="text-sm text-gray-500">
              예약 현황, 보증금, 인증 대기, 매장 정보를 한눈에 관리하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex-shrink-0 px-3 py-2 rounded-lg border text-sm font-medium whitespace-nowrap"
            style={{
              borderColor: "#566F2F",
              color: "#566F2F",
              backgroundColor: "#FFFFFF",
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#E8F5E9" }}
          >
            <Store size={28} style={{ color: "#566F2F" }} />
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-bold">
              {store?.name ?? profile.businessName ?? "등록된 매장 없음"}
            </h2>
            <p className="text-sm text-gray-500">
              {store?.available ? "예약 가능" : "예약 마감"}
            </p>
          </div>

          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: store?.available ? "#E8F5E9" : "#F3F4F6",
              color: store?.available ? "#2E7D32" : "#6B7280",
            }}
          >
            {store?.available ? "운영 중" : "운영 중지"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <CalendarCheck size={24} style={{ color: "#566F2F" }} />
          <p className="text-sm text-gray-500 mt-3">오늘 예약</p>
          <p className="text-2xl font-bold mt-1">{todayReservations.length}건</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Users size={24} style={{ color: "#566F2F" }} />
          <p className="text-sm text-gray-500 mt-3">인증 대기</p>
          <p className="text-2xl font-bold mt-1">
            {waitingReservations.length}건
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Wallet size={24} style={{ color: "#D97706" }} />
          <p className="text-sm text-gray-500 mt-3">예치 보증금</p>
          <p className="text-2xl font-bold mt-1">
            {activeDepositTotal.toFixed(3)} ETH
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <AlertCircle size={24} style={{ color: "#DC2626" }} />
          <p className="text-sm text-gray-500 mt-3">노쇼 건수</p>
          <p className="text-2xl font-bold mt-1">{noShowCount}건</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">오늘 할 일</h3>

          <Link
            to="/seller/notifications"
            className="text-sm font-medium"
            style={{ color: "#566F2F" }}
          >
            알림 보기
          </Link>
        </div>

        <div className="space-y-3">
          {todayTasks.map((task) => {
            const Icon = task.icon;

            return (
              <Link
                key={task.id}
                to={task.path}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#F4F7EF" }}
                >
                  <Icon size={20} style={{ color: task.color }} />
                </div>

                <div className="flex-1">
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {task.description}
                  </p>
                </div>

                <ChevronRight size={20} className="text-gray-300" />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">최근 예약 요청</h3>

          <Link
            to="/seller/reservations"
            className="text-sm font-medium"
            style={{ color: "#566F2F" }}
          >
            전체 보기
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
          {recentReservations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              최근 예약 요청이 없습니다.
            </div>
          ) : (
            recentReservations.map((reservation) => (
              <Link
                key={reservation.id}
                to={`/seller/reservations?reservationId=${reservation.id}`}
                className="p-4 flex items-center justify-between gap-3 hover:bg-[#FAFAF7] transition-colors"
              >
                <div>
                  <p className="font-semibold">{reservation.consumerName}</p>

                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Clock size={14} />
                    <span>
                      {format(getDateValue(reservation.date), "M월 d일(E)", {
                        locale: ko,
                      })}{" "}
                      {reservation.time}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#566F2F" }}
                  >
                    {getStatusText(String(reservation.status))}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {Number(reservation.deposit ?? 0).toFixed(3)} ETH
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/seller/reservations">
          <button
            type="button"
            className="w-full py-3 rounded-xl text-white font-semibold"
            style={{ backgroundColor: "#566F2F" }}
          >
            예약 관리
          </button>
        </Link>

        <Link to="/seller/store">
          <button
            type="button"
            className="w-full py-3 rounded-xl border font-semibold"
            style={{
              borderColor: "#566F2F",
              color: "#566F2F",
              backgroundColor: "#FFFFFF",
            }}
          >
            매장 관리
          </button>
        </Link>
      </div>
    </div>
  );
}
