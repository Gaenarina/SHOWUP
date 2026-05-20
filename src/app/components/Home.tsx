import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Search, MapPin } from "lucide-react";
import {
  seedDefaultStores,
  subscribeStores,
} from "../../services/storeService";
import type { Store } from "../../types/store";

export function Home() {
  const [region, setRegion] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const regions = ["전체", "서울", "경기", "안성", "천안"];

  useEffect(() => {
    seedDefaultStores().catch((error) => {
      console.error("기본 가게 생성 실패:", error);
    });

    const unsubscribe = subscribeStores((items) => {
      setStores(items);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredStores = stores.filter((store) => {
    const matchesRegion = region === "전체" || store.address.includes(region);
    const matchesSearch =
      searchQuery === "" ||
      store.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRegion && matchesSearch;
  });

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2 gap-4">
          <div>
            <div className="flex flex-col gap-1">
              <span
                className="text-sm font-medium"
                style={{ color: "#718952" }}
              >
                신뢰 기반 예약 플랫폼
              </span>

              <h1 className="showup-logo mb-2">ShowUp</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link to="/login">
              <button
                type="button"
                className="px-3 py-2 rounded-lg border text-sm font-medium whitespace-nowrap"
                style={{
                  borderColor: "#566F2F",
                  color: "#566F2F",
                  backgroundColor: "#FFFFFF",
                }}
              >
                로그인
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {regions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className="px-4 py-2 rounded-full whitespace-nowrap transition-colors"
              style={{
                backgroundColor: region === r ? "#566F2F" : "white",
                color: region === r ? "white" : "#566F2F",
                border: `1px solid ${
                  region === r ? "#566F2F" : "#D1D5DB"
                }`,
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />

          <input
            type="text"
            placeholder="카페, 스터디룸, 음식점 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "#566F2F" } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-center text-gray-500 py-8">
            업체 정보를 불러오는 중입니다.
          </p>
        ) : filteredStores.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            검색 결과가 없습니다.
          </p>
        ) : (
          filteredStores.map((store) => (
            <Link
              key={store.id}
              to={`/booking/${store.id}`}
              className="block"
            >
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{store.name}</h3>

                    {store.storeType === "seller" && (
                      <p className="text-xs mt-1" style={{ color: "#718952" }}>
                        판매자 등록 가게
                      </p>
                    )}
                  </div>

                  {store.available ? (
                    <span
                      className="text-sm px-2 py-1 rounded"
                      style={{
                        backgroundColor: "#E8F5E9",
                        color: "#2E7D32",
                      }}
                    >
                      예약 가능
                    </span>
                  ) : (
                    <span className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-600">
                      예약 마감
                    </span>
                  )}
                </div>

                <div className="flex items-center text-gray-600 text-sm mb-2">
                  <MapPin size={16} className="mr-1" />
                  {store.address}
                </div>

                <p className="text-sm text-gray-500 mb-3">
                  {store.description}
                </p>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    기본 보증금:{" "}
                    <span
                      className="font-semibold"
                      style={{ color: "#D97706" }}
                    >
                      {store.baseDeposit.toFixed(3)} ETH
                    </span>
                  </span>

                  <button
                    type="button"
                    disabled={!store.available}
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: "#566F2F" }}
                  >
                    예약하기
                  </button>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}