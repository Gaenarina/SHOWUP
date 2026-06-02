import { useEffect, useState } from "react";
import { Link, useNavigate } from "@/app/components/routerCompat";
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
import { isAddress } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { getUserProfile, logoutUser } from "@/services/authService";
import { subscribeConsumerReservations } from "@/services/reservationService";
import type { AppUser } from "@/types/user";
import type { Reservation } from "@/types/reservation";
import { appConfig } from "@/config/appConfig";
import {
  USER_REPUTATION_ADDRESS,
  userReputationAbi,
} from "@/services/web3/contracts";
import PageLoading from "@/app/components/PageLoading";
import { WalletStatusRow } from "@/app/components/WalletStatusRow";
import { ReputationModal } from "@/app/components/ReputationModal";

export function MyPage() {
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReputation, setShowReputation] = useState(false);
  const [contractReputation, setContractReputation] = useState<{
    name: string;
    reputation: number;
    noShowCount: number;
    isRegistered: boolean;
  } | null>(null);
  const [isReputationLoading, setIsReputationLoading] = useState(false);
  const [isRegisteringReputation, setIsRegisteringReputation] = useState(false);
  const [reputationError, setReputationError] = useState("");

  const navigate = useNavigate();
  const publicClient = usePublicClient();
  const { address: connectedWalletAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();

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

  const reputationWalletAddress =
    connectedWalletAddress || userData?.walletAddress || "";

  const loadContractReputation = async () => {
    if (
      !publicClient ||
      !USER_REPUTATION_ADDRESS ||
      !isAddress(reputationWalletAddress)
    ) {
      setContractReputation(null);
      return;
    }

    try {
      setIsReputationLoading(true);
      setReputationError("");

      const reputationContractCode = await publicClient.getCode({
        address: USER_REPUTATION_ADDRESS,
      });

      if (!reputationContractCode) {
        setContractReputation(null);
        setReputationError(
          "평판 컨트랙트가 현재 네트워크에 배포되어 있지 않습니다."
        );
        return;
      }

      const [name, reputation, noShowCount, isRegistered] =
        await publicClient.readContract({
          address: USER_REPUTATION_ADDRESS,
          abi: userReputationAbi,
          functionName: "getUser",
          args: [reputationWalletAddress],
        });

      setContractReputation({
        name,
        reputation: Number(reputation),
        noShowCount: Number(noShowCount),
        isRegistered,
      });
    } catch (error) {
      console.warn(error);
      setContractReputation(null);
      setReputationError("컨트랙트 평판을 불러오지 못했습니다.");
    } finally {
      setIsReputationLoading(false);
    }
  };

  useEffect(() => {
    loadContractReputation();
  }, [publicClient, reputationWalletAddress]);

  const handleRegisterReputation = async () => {
    if (!userData) return;

    try {
      setIsRegisteringReputation(true);
      setReputationError("");

      if (!USER_REPUTATION_ADDRESS) {
        throw new Error("평판 컨트랙트 주소가 설정되지 않았습니다.");
      }

      if (!connectedWalletAddress) {
        throw new Error("MetaMask 지갑을 연결해주세요.");
      }

      if (!publicClient) {
        throw new Error("블록체인 네트워크 연결을 확인해주세요.");
      }

      const hash = await writeContractAsync({
        address: USER_REPUTATION_ADDRESS,
        abi: userReputationAbi,
        functionName: "register",
        args: [userData.name],
        gas: BigInt(200000),
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await loadContractReputation();
    } catch (error) {
      console.error(error);
      setReputationError(
        error instanceof Error
          ? error.message
          : "평판 등록 중 오류가 발생했습니다."
      );
    } finally {
      setIsRegisteringReputation(false);
    }
  };

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

  const attendanceRate =
    totalReservations === 0
      ? 100
      : Math.round((completedReservations / totalReservations) * 100);

  const isContractReputationReady =
    Boolean(USER_REPUTATION_ADDRESS) &&
    isAddress(reputationWalletAddress) &&
    contractReputation?.isRegistered;
  const noShowCount = isContractReputationReady
    ? contractReputation.noShowCount
    : null;
  const reputationScore = isContractReputationReady
    ? contractReputation.reputation
    : null;
  const currentDeposit =
    appConfig.defaultBaseDepositEth +
    (noShowCount ?? 0) * appConfig.noShowExtraDepositEth;

  const getReputationBadge = () => {
    if (reputationScore === null) {
      return {
        title: "평판 미등록",
        color: "#92400E",
        bgColor: "#FFF8E7",
        icon: <Award color="#D97706" size={20} />,
      };
    }

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

        <div
          onClick={() => {
            if (reputationScore !== null) {
              setShowReputation(true);
            }
          }}
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
                {reputationScore === null
                  ? "컨트랙트 등록 필요"
                  : `평판 점수 ${reputationScore}점`}
              </p>
            </div>
          </div>
          <ChevronRight style={{ color: badge.color }} />
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Award size={20} style={{ color: "#566F2F" }} />
          <h3 className="font-semibold">블록체인 평판</h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          방문 완료와 노쇼 정산 결과가 반영되는 컨트랙트 평판입니다.
        </p>

        {isReputationLoading ? (
          <p className="text-sm text-gray-500">컨트랙트 평판을 불러오는 중입니다.</p>
        ) : isContractReputationReady ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#F4F7EF] p-3 text-center">
              <p className="text-xs text-gray-500">평판 점수</p>
              <p className="text-xl font-bold" style={{ color: "#566F2F" }}>
                {contractReputation.reputation}
              </p>
            </div>
            <div className="rounded-lg bg-[#F4F7EF] p-3 text-center">
              <p className="text-xs text-gray-500">노쇼</p>
              <p className="text-xl font-bold text-red-600">
                {contractReputation.noShowCount}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-[#FFF8E7] p-4">
            <p className="text-sm text-[#92400E] mb-3">
              연결된 지갑이 아직 평판 컨트랙트에 등록되지 않았습니다.
            </p>
            <button
              type="button"
              onClick={handleRegisterReputation}
              disabled={isRegisteringReputation || !connectedWalletAddress}
              className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-60"
              style={{ backgroundColor: "#566F2F" }}
            >
              {isRegisteringReputation
                ? "등록 중..."
                : connectedWalletAddress
                ? "평판 컨트랙트 등록"
                : "지갑 연결 후 등록 가능"}
            </button>
          </div>
        )}

        {reputationError && (
          <p className="text-sm text-red-600 mt-3">{reputationError}</p>
        )}
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Award size={20} style={{ color: "#566F2F" }} />
          <h3 className="font-semibold">평판 현황</h3>
        </div>

        <div className="text-center mb-4">
          <p className="text-2xl font-bold" style={{ color: "#566F2F" }}>
            {reputationScore ?? "-"}
          </p>
          <p className="text-xs text-gray-600 mt-1">평판 점수</p>
          {!isContractReputationReady && (
            <p className="text-xs text-amber-700 mt-2">
              컨트랙트 등록 후 블록체인 평판이 표시됩니다.
            </p>
          )}
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
              {noShowCount ?? "-"}
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
          {noShowCount === null
            ? "평판 컨트랙트 등록 전에는 기본 보증금이 적용됩니다."
            : `노쇼 ${noShowCount}회 기준 다음 예약에 적용될 보증금입니다.`}
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

      {showReputation && userData && reputationScore !== null && (
        <ReputationModal
          score={reputationScore}
          onClose={() => setShowReputation(false)}
        />
      )}
    </div>
  );
}
