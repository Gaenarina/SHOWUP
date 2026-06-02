import { useEffect, useState } from "react";
import { useParams, Link } from "./routerCompat";
import { MapPin, Clock, DollarSign, Star } from "lucide-react";
import { getStoreById } from "@/services/storeService";

interface StoreInfo {
  id: string;
  name: string;
  address: string;
  baseDeposit: string;
  description: string;
  hours: string;
  rating: number;
  available?: boolean;
  sellerId?: string;
  sellerName?: string;
  sellerWalletAddress?: string;
  storeType?: string;
}

/*
const mockStoreData: Record<string, StoreInfo> = {
  "1": {
    id: "1",
    name: "카페 온",
    address: "안성시 중앙로 123",
    baseDeposit: "0.01 ETH",
    description: "조용하고 아늑한 분위기의 카페입니다. 스터디와 작업에 좋은 공간을 제공합니다.",
    hours: "09:00 - 22:00",
    rating: 4.5,
  },
  "2": {
    id: "2",
    name: "스터디 카페 집중",
    address: "안성시 대학로 456",
    baseDeposit: "0.015 ETH",
    description: "집중하기 좋은 개인 공간과 무료 음료를 제공하는 스터디 카페입니다.",
    hours: "08:00 - 24:00",
    rating: 4.8,
  },
  "3": {
    id: "3",
    name: "오늘의 미식가",
    address: "천안시 번화가 789",
    baseDeposit: "0.02 ETH",
    description: "신선한 재료로 만든 정성 가득한 식사를 즐길 수 있는 식당입니다.",
    hours: "11:00 - 21:00",
    rating: 4.7,
  },
};
*/

export function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStore = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const storeData = await getStoreById(id);

        if (!storeData) {
          setStore(null);
          return;
        }

        setStore({
          id: storeData.id,
          name: storeData.name || "이름 없음",
          address: storeData.address || "주소 정보 없음",
          baseDeposit: `${Number(storeData.baseDeposit ?? 0.01).toFixed(3)} ETH`,
          description: storeData.description || "등록된 설명이 없습니다.",
          hours: "운영 시간 정보 없음",
          rating: 4.5,
          available: storeData.available,
          sellerId: storeData.sellerId,
          sellerName: storeData.sellerName,
          sellerWalletAddress: storeData.sellerWalletAddress,
          storeType: storeData.storeType,
        });
      } catch (error) {
        console.error("매장 정보 불러오기 실패:", error);
        setStore(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">업체 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">업체를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        className="h-48 flex items-center justify-center"
        style={{ backgroundColor: "#566F2F" }}
      >
        <p className="text-white text-lg font-semibold">{store.name}</p>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-2xl font-bold">{store.name}</h1>
            <div className="flex items-center">
              <Star size={18} fill="#FFD700" color="#FFD700" />
              <span className="ml-1 font-semibold">{store.rating}</span>
            </div>
          </div>

          <p className="text-gray-700 mb-4">{store.description}</p>

          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <MapPin size={18} className="mr-2" />
              <span>{store.address}</span>
            </div>

            <div className="flex items-center text-gray-600">
              <Clock size={18} className="mr-2" />
              <span>{store.hours}</span>
            </div>

            <div className="flex items-center">
              <DollarSign size={18} className="mr-2 text-gray-600" />
              <span className="text-gray-600">
                기본 보증금{" "}
                <span className="font-semibold" style={{ color: "#D97706" }}>
                  {store.baseDeposit}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div
          className="rounded-lg p-4 mb-4"
          style={{
            backgroundColor: "#FEF3C7",
            borderLeft: "4px solid #D97706",
          }}
        >
          <h3 className="font-semibold mb-2" style={{ color: "#92400E" }}>
            보증금 안내
          </h3>
          <p className="text-sm" style={{ color: "#92400E" }}>
            노쇼 기록에 따라 추가 보증금이 부과될 수 있습니다.
            <br />
            정상 참석 시 보증금은 자동으로 환불됩니다.
            <br />
            노쇼 시 보증금은 업체에 전달되며 평판에 반영됩니다.
          </p>
        </div>

        <Link to={`/booking/${store.id}`}>
          <button
            className="w-full py-4 rounded-lg text-white font-semibold text-lg shadow-md hover:shadow-lg transition-shadow"
            style={{ backgroundColor: "#566F2F" }}
          >
            예약하기
          </button>
        </Link>
      </div>
    </div>
  );
}
