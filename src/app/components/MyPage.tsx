import { useEffect, useState } from "react";
import { Link, useNavigate } from "./routerCompat";
import {
  User,
  Award,
  Calendar,
  LogOut,
  ChevronRight,
  Star,
  TrendingUp,
  TrendingDown,
  Store,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase"; 
import { doc, onSnapshot } from "firebase/firestore"; 
import { getUserProfile, logoutUser } from "../../services/authService";
import { subscribeConsumerReservations } from "../../services/reservationService";
import type { AppUser } from "../../types/user";
import type { Reservation } from "../../types/reservation";
import PageLoading from "./PageLoading";
import { WalletStatusRow } from "./WalletStatusRow";
// 기획서 반영: 수정된 named export 구조의 모달 불러오기
import { ReputationModal } from "./ReputationModal";

export function MyPage() {
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 5번 지시사항: 기획서 가이드와 명칭 통일 (showReputation)
  const [showReputation, setShowReputation] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeReservations: (() => void) | undefined;
    let unsubscribeUser: (() => void) | undefined; 

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeReservations) {
        unsubscribeReservations();
      }
      if (unsubscribeUser) {
        unsubscribeUser();
      }

      if (!user) {
        setUserData(null);
        setReservations([]);
        setIsLoading(false);
        return;
      }

      {/* 6번 지시사항: 즉시 반영용 실시간 리스너 완벽 유지 */}
      const userRef = doc(db, "users", user.uid);
      unsubscribeUser = onSnapshot(userRef, (snap) => {
        if (!snap.exists()) {
          setUserData(null);
          return;
        }

        setUserData(snap.data() as AppUser);
        setIsLoading(false);
      });

      unsubscribeReservations = subscribeConsumerReservations(
        user.uid,
        setReservations
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeReservations) {
        unsubscribeReservations();
      }

      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  const clearLoginStorage = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
  };

  const handleLogout = async () => {
    await logoutUser();

    clearLoginStorage();
    setUserData(null);
    setReservations([]);

    navigate("/login");
  };

  const totalReservations = reservations.length;

  const completedReservations = reservations.filter((reservation) => {
    const status = String(reservation.status);
    return status === "completed" || status === "verified";
  }).length;

  const reservationNoShowCount = reservations.filter(
    (reservation) => String(reservation.status) === "noshow"
  ).length;

  const noShowCount = Math.max(
    userData?.noShowCount ?? 0,
    reservationNoShowCount
  );

  const attendanceRate =
    totalReservations === 0
      ? 100
      : Math.round((completedReservations / totalReservations) * 100);

  const currentDeposit = 0.01 + noShowCount * 0.005;
  const reputationScore = userData?.reputationScore ?? 100;

  const getReputationBadge = () => {
    if (reputationScore >= 81) {
      return {
        title: "약속왕",
        color: "#2E7D32",
        bgColor: "#E8F5E9",
        icon: <Star fill="#FFD700" color="#FFD700" size={20} />,
      };
    }

    if (reputationScore >= 61) {
      return {
        title: "우수함",
        color: "#1976D2",
        bgColor: "#E3F2FD",
        icon: <TrendingUp color="#1976D2" size={20} />,
      };
    }

    if (reputationScore >= 41) {
      return {
        title: "일반",
        color: "#757575",
        bgColor: "#F5F5F5",
        icon: <Award color="#757575" size={20} />,
      };
    }

    if (reputationScore >= 21) {
      return {
        title: "주의 필요",
        color: "#D97706",
        bgColor: "#FEF3C7",
        icon: <TrendingDown color="#D97706" size={20} />,
      };
    }

    return {
      title: "노쇼왕",
      color: "#DC2626",
      bgColor: "#FEE2E2",
      icon: <TrendingDown color="#DC2626" size={20} />,
    };
  };
  const badge = getReputationBadge();

  if (isLoading) {
    return <PageLoading message="내 정보를 불러오는 중입니다." />;
  }

  if (!userData) {
    return (
      <div className="min-h-screen p-4 pb-20 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center w-full max-w-sm">
          <User size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 mb-5">
            마이페이지를 이용하려면 로그인해주세요.
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

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "#566F2F" }}>
          마이페이지
        </h2>
        <p className="text-gray-600">내 정보를 관리하세요</p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#E8F5E9" }}
          >
            <User size={32} style={{ color: "#566F2F" }} />
          </div>

          <div>
            <h3 className="text-xl font-bold">{userData.name}</h3>
            <p className="text-sm text-gray-600">{userData.email}</p>
          </div>
        </div>

        {/* 5번 지시사항: 평판 카드 클릭 이벤트 및 커서 스타일 반영 */}
        <div
          onClick={() => setShowReputation(true)}
          className="rounded-lg p-4 flex items-center justify-between cursor-pointer"
          style={{ backgroundColor: badge.bgColor }}
        >
          <div className="flex items-center gap-3">
            {badge.icon}
            <div>
              <p className="font-semibold" style={{ color: badge.color }}>
                {badge.title}
              </p>
              <p className="text-xs" style={{ color: badge.color }}>
                평판 점수 {reputationScore}점
              </p>
            </div>
          </div>
          <ChevronRight style={{ color: badge.color }} />
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Award size={20} style={{ color: "#566F2F" }} />
          <h3 className="font-semibold">평판 현황</h3>
        </div>

        <div className="text-center mb-4">
          <p className="text-2xl font-bold" style={{ color: "#566F2F" }}>
            {reputationScore}
          </p>
          <p className="text-xs text-gray-600 mt-1">평판 점수</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "#566F2F" }}>
              {totalReservations}
            </p>
            <p className="text-xs text-gray-600 mt-1">총 예약</p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "#2E7D32" }}>
              {completedReservations}
            </p>
            <p className="text-xs text-gray-600 mt-1">완료</p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "#DC2626" }}>
              {noShowCount}
            </p>
            <p className="text-xs text-gray-600 mt-1">노쇼</p>
          </div>
        </div>
      </div>

      <div
        className="rounded-lg p-4 mb-4"
        style={{ backgroundColor: "#FEF3C7", border: "2px solid #D97706" }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold" style={{ color: "#92400E" }}>
            내 보증금
          </h3>
          <p className="text-xl font-bold" style={{ color: "#D97706" }}>
            {currentDeposit.toFixed(3)} ETH
          </p>
        </div>
        <p className="text-xs" style={{ color: "#92400E" }}>
          노쇼 {noShowCount}회 기준 다음 예약에 적용될 보증금입니다.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-4 divide-y">
        <WalletStatusRow savedWalletAddress={userData.walletAddress} />

        <Link
          to="/reservations"
          className="p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Calendar size={20} style={{ color: "#566F2F" }} />
            <p className="font-medium">내 예약 현황</p>
          </div>
          <ChevronRight className="text-gray-400" />
        </Link>

        <Link to="/seller" className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store size={20} style={{ color: "#566F2F" }} />
            <p className="font-medium">판매자 페이지</p>
          </div>
          <ChevronRight className="text-gray-400" />
        </Link>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full bg-white rounded-lg p-4 shadow-sm flex items-center gap-3 text-red-600"
      >
        <LogOut size={20} />
        <span className="font-medium">로그아웃</span>
      </button>

      {/* 5번 지시사항: 모달 조건부 렌더링 세팅 완료 */}
      {showReputation && userData && (
        <ReputationModal
          score={userData.reputationScore ?? 100}
          onClose={() => setShowReputation(false)}
        />
      )}
    </div>
  );
}