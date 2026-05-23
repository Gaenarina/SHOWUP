import { useEffect, useState } from "react";
import { Link, useNavigate } from "./routerCompat";
import { useRef } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import {
  Store,
  MapPin,
  FileText,
  Wallet,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import {
  getUserProfile,
  updateUserWalletAddress,
} from "../../services/authService";
import {
  DEMO_MASTER_UID,
  saveSellerStore,
  saveDemoStore,
  subscribeDemoStores,
  subscribeSellerStore,
} from "../../services/storeService";
import type { AppUser } from "../../types/user";
import type { Store as StoreType } from "../../types/store";
import { WalletConnectButton } from "./WalletConnectButton";
import LoadingOverlay from "./LoadingOverlay";

type StoreForm = {
  name: string;
  address: string;
  description: string;
  reservationNotice: string;
  baseDeposit: string;
  available: boolean;
};

const initialForm: StoreForm = {
  name: "",
  address: "",
  description: "",
  reservationNotice: "",
  baseDeposit: "0.010",
  available: true,
};

export function SellerStoreManage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<AppUser | null>(null);
  const [store, setStore] = useState<StoreType | null>(null);
  const [managedStores, setManagedStores] = useState<StoreType[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [form, setForm] = useState<StoreForm>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { address: connectedWalletAddress } = useAccount();
  const selectedStoreIdRef = useRef("");

  const isDemoMaster = profile?.uid === DEMO_MASTER_UID;

  const applyStoreToForm = (storeData: StoreType) => {
    setForm({
      name: storeData.name ?? "",
      address: storeData.address ?? "",
      description: storeData.description ?? "",
      reservationNotice: storeData.reservationNotice ?? "",
      baseDeposit: String(storeData.baseDeposit ?? 0.01),
      available: Boolean(storeData.available),
    });
    setStore(storeData);
    setSelectedStoreId(storeData.id);
    selectedStoreIdRef.current = storeData.id;
  };

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

      if (userProfile?.role !== "seller") {
        setStore(null);
        setIsLoading(false);
        return;
      }

      if (userProfile.uid === DEMO_MASTER_UID) {
        unsubscribeStore = subscribeDemoStores((storeList) => {
          setManagedStores(storeList);

          const nextStore =
            storeList.find((item) => item.id === selectedStoreIdRef.current) ??
            storeList[0] ??
            null;

          if (nextStore) {
            applyStoreToForm(nextStore);
          } else {
            setStore(null);
          }

          setIsLoading(false);
        });

        return;
      }

      unsubscribeStore = subscribeSellerStore(user.uid, (storeData) => {
        setManagedStores([]);
        setStore(storeData);

        if (storeData) {
          applyStoreToForm(storeData);
        } else {
          setForm({
            ...initialForm,
            name: userProfile.businessName ?? "",
          });
        }

        setIsLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeStore) {
        unsubscribeStore();
      }
    };
  }, []);

  const handleChange = (
    field: keyof StoreForm,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectStore = (storeId: string) => {
    const nextStore = managedStores.find((item) => item.id === storeId);

    if (!nextStore || !profile) return;

    applyStoreToForm(nextStore);
  };

  const handleSave = async () => {
    if (!profile || profile.role !== "seller") return;

    const baseDeposit = Number(form.baseDeposit);

    if (!form.name.trim()) {
      setMessage("매장명을 입력해주세요.");
      return;
    }

    if (!form.address.trim()) {
      setMessage("주소를 입력해주세요.");
      return;
    }

    if (!form.description.trim()) {
      setMessage("매장 설명을 입력해주세요.");
      return;
    }

    if (Number.isNaN(baseDeposit) || baseDeposit < 0) {
      setMessage("기본 보증금은 0 이상의 숫자로 입력해주세요.");
      return;
    }

    const sellerWalletAddress =
      connectedWalletAddress?.trim() || profile.walletAddress?.trim() || "";

    if (!isAddress(sellerWalletAddress)) {
      setMessage("판매자 지갑을 연결한 뒤 매장 정보를 저장해주세요.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      if (sellerWalletAddress !== profile.walletAddress) {
        await updateUserWalletAddress(profile.uid, sellerWalletAddress);
        setProfile((prev) =>
          prev ? { ...prev, walletAddress: sellerWalletAddress } : prev
        );
      }

      const storeData = {
        sellerId: profile.uid,
        sellerName: profile.businessName ?? form.name,
        name: form.name.trim(),
        address: form.address.trim(),
        description: form.description.trim(),
        reservationNotice: form.reservationNotice.trim(),
        sellerWalletAddress,
        baseDeposit,
        available: form.available,
        allowPartySize: store?.allowPartySize,
        minPartySize: store?.minPartySize,
        maxPartySize: store?.maxPartySize,
      };

      if (isDemoMaster && selectedStoreId) {
        await saveDemoStore(selectedStoreId, storeData);
      } else {
        await saveSellerStore(storeData, store?.id);
      }

      setMessage("매장 정보가 저장되었습니다.");
    } catch (error) {
      console.error(error);
      setMessage("매장 정보 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 pb-24 flex items-center justify-center">
        <p className="text-gray-500">매장 정보를 불러오는 중입니다.</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-4 pb-24 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center w-full max-w-sm">
          <Store size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 mb-5">
            매장 관리를 이용하려면 판매자 계정으로 로그인해주세요.
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
            매장 관리는 판매자 계정으로 로그인해야 이용할 수 있습니다.
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
      <LoadingOverlay isOpen={isSaving} message="매장 정보를 저장하는 중입니다." />

      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate("/seller")}
          className="flex items-center gap-1 text-sm mb-4"
          style={{ color: "#566F2F" }}
        >
          <ArrowLeft size={18} />
          판매자 홈으로 돌아가기
        </button>

        <span className="text-sm font-medium" style={{ color: "#718952" }}>
          판매자 설정
        </span>

        <h1 className="text-2xl font-bold mt-1">매장 관리</h1>

        <p className="text-sm text-gray-500 mt-2">
          고객에게 보이는 매장 설명, 주소, 예약 안내사항을 관리합니다.
        </p>
      </div>

      {isDemoMaster && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#E8F5E9" }}
            >
              <Store size={22} style={{ color: "#566F2F" }} />
            </div>

            <div>
              <h2 className="font-bold">데모 매장 선택</h2>
              <p className="text-sm text-gray-500">
                기본 가게 3개 중 수정할 매장을 선택하세요
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            {managedStores.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectStore(item.id)}
                className="w-full px-4 py-3 rounded-xl border text-left"
                style={{
                  borderColor:
                    selectedStoreId === item.id ? "#566F2F" : "#E5E7EB",
                  backgroundColor:
                    selectedStoreId === item.id ? "#F4F7EF" : "#FFFFFF",
                }}
              >
                <span className="block text-sm font-semibold">
                  {item.name}
                </span>
                <span className="block text-xs text-gray-500 mt-1">
                  {item.id}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#E8F5E9" }}
          >
            <Store size={22} style={{ color: "#566F2F" }} />
          </div>

          <div>
            <h2 className="font-bold">기본 정보</h2>
            <p className="text-sm text-gray-500">
              고객에게 표시되는 매장 정보를 입력하세요
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">매장명</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="예: ShowUp 카페"
              className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7] outline-none text-sm focus:ring-2"
              style={{ "--tw-ring-color": "#566F2F" } as React.CSSProperties}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold flex items-center gap-1">
              <MapPin size={16} />
              주소
            </span>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="예: 경기 안성시 중앙로 123"
              className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7] outline-none text-sm focus:ring-2"
              style={{ "--tw-ring-color": "#566F2F" } as React.CSSProperties}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold flex items-center gap-1">
              <FileText size={16} />
              매장 설명
            </span>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="매장의 분위기, 특징, 이용 안내를 입력해주세요."
              rows={4}
              className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7] outline-none text-sm resize-none focus:ring-2"
              style={{ "--tw-ring-color": "#566F2F" } as React.CSSProperties}
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#FFF8E7" }}
          >
            <CheckCircle size={22} style={{ color: "#D97706" }} />
          </div>

          <div>
            <h2 className="font-bold">예약 설정</h2>
            <p className="text-sm text-gray-500">
              예약 전 고객에게 보여줄 안내와 보증금을 설정하세요
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">예약 안내사항</span>
            <textarea
              value={form.reservationNotice}
              onChange={(e) =>
                handleChange("reservationNotice", e.target.value)
              }
              placeholder={`예: 예약 시간 10분 전까지 도착해주세요.\n취소가 필요한 경우 미리 연락해주세요.\n무단 불참 시 노쇼로 처리될 수 있습니다.`}
              rows={5}
              className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7] outline-none text-sm resize-none focus:ring-2"
              style={{ "--tw-ring-color": "#566F2F" } as React.CSSProperties}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold flex items-center gap-1">
              <Wallet size={16} />
              기본 보증금 ETH
            </span>
            <input
              type="number"
              step="0.001"
              min="0"
              value={form.baseDeposit}
              onChange={(e) => handleChange("baseDeposit", e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7] outline-none text-sm focus:ring-2"
              style={{ "--tw-ring-color": "#566F2F" } as React.CSSProperties}
            />
          </label>

          <button
            type="button"
            onClick={() => handleChange("available", !form.available)}
            className="w-full px-4 py-3 rounded-xl border flex items-center justify-between"
            style={{
              borderColor: form.available ? "#566F2F" : "#D1D5DB",
              backgroundColor: form.available ? "#F4F7EF" : "#F9FAFB",
            }}
          >
            <span className="text-sm font-semibold">
              {form.available ? "예약 가능 상태" : "예약 마감 상태"}
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: form.available ? "#566F2F" : "#E5E7EB",
                color: form.available ? "#FFFFFF" : "#6B7280",
              }}
            >
              {form.available ? "ON" : "OFF"}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#F2F7EC" }}
          >
            <Wallet size={22} style={{ color: "#566F2F" }} />
          </div>

          <div>
            <h2 className="font-bold">판매자 지갑</h2>
            <p className="text-sm text-gray-500">
              예약 보증금을 받을 지갑을 연결하고 저장하세요
            </p>
          </div>
        </div>

        <WalletConnectButton
          className="w-full px-4 py-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold"
          style={{
            borderColor: connectedWalletAddress ? "#566F2F" : "#D1D5DB",
            backgroundColor: connectedWalletAddress ? "#F4F7EF" : "#FFFFFF",
            color: connectedWalletAddress ? "#566F2F" : "#374151",
          }}
          iconSize={18}
        />

        <div className="mt-3 space-y-1 text-xs text-gray-500">
          <p>
            현재 연결된 지갑:{" "}
            {connectedWalletAddress
              ? `${connectedWalletAddress.slice(0, 6)}...${connectedWalletAddress.slice(-4)}`
              : "없음"}
          </p>
          <p>
            선택한 매장에 저장된 지갑:{" "}
            {store?.sellerWalletAddress
              ? `${store.sellerWalletAddress.slice(0, 6)}...${store.sellerWalletAddress.slice(-4)}`
              : "없음"}
          </p>
        </div>
      </div>

      {message && (
        <p
          className="text-sm mb-4"
          style={{
            color: message.includes("저장되었습니다") ? "#2E7D32" : "#DC2626",
          }}
        >
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-4 rounded-xl text-white font-semibold disabled:opacity-60"
        style={{ backgroundColor: "#566F2F" }}
      >
        {isSaving ? "저장 중..." : "매장 정보 저장"}
      </button>
    </div>
  );
}
