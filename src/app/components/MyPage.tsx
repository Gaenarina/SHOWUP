import { useState } from "react";
import { Link } from "react-router";
import {
  User,
  Award,
  Wallet,
  Calendar,
  LogOut,
  ChevronRight,
  Star,
  TrendingUp,
  TrendingDown,
  Store,
} from "lucide-react";

export function MyPage() {
  const [walletConnected] = useState(true);

  // Mock user data
  const userData = {
    name: "홍길동",
    email: "hong@example.com",
    walletAddress: "0x1234...5678",
    reputation: {
      title: "참석왕",
      level: 2,
      totalReservations: 15,
      completedReservations: 13,
      noShowCount: 2,
      attendanceRate: 87,
    },
    currentDeposit: 0.01,
  };

  const getReputationBadge = () => {
    const { noShowCount } = userData.reputation;
    if (noShowCount === 0) {
      return {
        title: "참석왕",
        color: "#2E7D32",
        bgColor: "#E8F5E9",
        icon: <Star fill="#FFD700" color="#FFD700" size={20} />,
      };
    } else if (noShowCount <= 2) {
      return {
        title: "참석왕 ⭐",
        color: "#D97706",
        bgColor: "#FEF3C7",
        icon: <TrendingUp color="#D97706" size={20} />,
      };
    } else {
      return {
        title: `노쇼왕 ${"⭐".repeat(Math.min(noShowCount - 2, 3))}`,
        color: "#DC2626",
        bgColor: "#FEE2E2",
        icon: <TrendingDown color="#DC2626" size={20} />,
      };
    }
  };

  const badge = getReputationBadge();

  return (
    <div className="min-h-screen p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#566F2F' }}>
          마이페이지
        </h2>
        <p className="text-gray-600">내 정보를 관리하세요</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#E8F5E9' }}
          >
            <User size={32} style={{ color: '#566F2F' }} />
          </div>
          <div>
            <h3 className="text-xl font-bold">{userData.name}</h3>
            <p className="text-sm text-gray-600">{userData.email}</p>
          </div>
        </div>

        {/* Reputation Badge */}
        <div
          className="rounded-lg p-4 flex items-center justify-between"
          style={{ backgroundColor: badge.bgColor }}
        >
          <div className="flex items-center gap-3">
            {badge.icon}
            <div>
              <p className="font-semibold" style={{ color: badge.color }}>
                {badge.title}
              </p>
              <p className="text-xs" style={{ color: badge.color }}>
                참석률 {userData.reputation.attendanceRate}%
              </p>
            </div>
          </div>
          <ChevronRight style={{ color: badge.color }} />
        </div>
      </div>

      {/* Reputation Stats */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Award size={20} style={{ color: '#566F2F' }} />
          <h3 className="font-semibold">평판 통계</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#566F2F' }}>
              {userData.reputation.totalReservations}
            </p>
            <p className="text-xs text-gray-600 mt-1">총 예약</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#2E7D32' }}>
              {userData.reputation.completedReservations}
            </p>
            <p className="text-xs text-gray-600 mt-1">완료</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#DC2626' }}>
              {userData.reputation.noShowCount}
            </p>
            <p className="text-xs text-gray-600 mt-1">노쇼</p>
          </div>
        </div>
      </div>

      {/* Deposit Info */}
      <div
        className="rounded-lg p-4 mb-4"
        style={{ backgroundColor: '#FEF3C7', border: '2px solid #D97706' }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold" style={{ color: '#92400E' }}>
            내 보증금
          </h3>
          <p className="text-xl font-bold" style={{ color: '#D97706' }}>
            {userData.currentDeposit.toFixed(3)} ETH
          </p>
        </div>
        <p className="text-xs" style={{ color: '#92400E' }}>
          노쇼 {userData.reputation.noShowCount}회 기준 다음 예약 시 적용되는 보증금
        </p>
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-lg shadow-sm mb-4 divide-y">
        {walletConnected ? (
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet size={20} style={{ color: '#566F2F' }} />
              <div>
                <p className="font-medium">지갑 연결됨</p>
                <p className="text-sm text-gray-600">{userData.walletAddress}</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" />
          </div>
        ) : (
          <button className="w-full p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet size={20} style={{ color: '#566F2F' }} />
              <p className="font-medium">지갑 연결하기</p>
            </div>
            <ChevronRight className="text-gray-400" />
          </button>
        )}

        <Link to="/reservations" className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={20} style={{ color: '#566F2F' }} />
            <p className="font-medium">내 예약 현황</p>
          </div>
          <ChevronRight className="text-gray-400" />
        </Link>

        <Link to="/seller/reservations" className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store size={20} style={{ color: '#566F2F' }} />
            <p className="font-medium">판매자 모드</p>
          </div>
          <ChevronRight className="text-gray-400" />
        </Link>
      </div>

      {/* Logout Button */}
      <button
        className="w-full bg-white rounded-lg p-4 shadow-sm flex items-center justify-center gap-2 text-red-600 font-medium"
      >
        <LogOut size={20} />
        로그아웃
      </button>
    </div>
  );
}
