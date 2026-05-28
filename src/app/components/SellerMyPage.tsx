import { useEffect, useState } from "react";
import { Link, useNavigate } from "./routerCompat";
import {
  Store,
  LogOut,
  ChevronRight,
  Home,
  Building2,
  BadgeCheck,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { getUserProfile, logoutUser } from "../../services/authService";
import { subscribeSellerStore } from "../../services/storeService";
import type { AppUser } from "../../types/user";
import type { Store as StoreType } from "../../types/store";
import { WalletStatusRow } from "./WalletStatusRow";

export function SellerMyPage() {
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [store, setStore] = useState<StoreType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeStore: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeStore) {
        unsubscribeStore();
      }

      if (!user) {
        setProfile(null);
        setStore(null);
        setIsLoading(false);
        return;
      }

      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      setIsLoading(false);

      if (userProfile?.role === "seller") {
        unsubscribeStore = subscribeSellerStore(user.uid, setStore);
      }
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeStore) {
        unsubscribeStore();
      }
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 pb-20 flex items-center justify-center">
        <p className="text-gray-500">판매자 정보를 불러오는 중입니다.</p>
      </div>
    );
  }

  if (!profile || profile.role !== "seller") {
    return (
      <div className="min-h-screen p-4 pb-20 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center w-full max-w-sm">
          <Store size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 mb-5">
            매장 정보를 확인하려면
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

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "#566F2F" }}>
          판매자 마이페이지
        </h2>
        <p className="text-gray-600">매장 정보를 확인하세요</p>
      </div>

      <div className="bg-white rounded-lg p-5 shadow-sm mb-4">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#E8F5E9" }}
          >
            <Store size={32} style={{ color: "#566F2F" }} />
          </div>

          <div>
            <h3 className="text-xl font-bold">
              {store?.name ?? profile.businessName ?? "등록된 매장 없음"}
            </h3>
            <p className="text-sm text-gray-600">{profile.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-4 divide-y">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 size={20} style={{ color: "#566F2F" }} />
            <div>
              <p className="font-medium">대표자명</p>
              <p className="text-sm text-gray-600">{profile.name}</p>
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BadgeCheck size={20} style={{ color: "#566F2F" }} />
            <div>
              <p className="font-medium">사업자등록번호</p>
              <p className="text-sm text-gray-600">
                {profile.businessNumber ?? "등록 정보 없음"}
              </p>
            </div>
          </div>
        </div>

        <WalletStatusRow savedWalletAddress={profile.walletAddress} />

        <Link to="/" className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Home size={20} style={{ color: "#566F2F" }} />
            <p className="font-medium">고객 화면으로 이동</p>
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
    </div>
  );
}
