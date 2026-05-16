import { useState } from "react";
import { Link } from "react-router";
import { Search, MapPin, Store } from "lucide-react";

interface Store {
  id: string;
  name: string;
  address: string;
  baseDeposit: string;
  available: boolean;
}

const mockStores: Store[] = [
  {
    id: "1",
    name: "카페 온",
    address: "안성시 중앙로 123",
    baseDeposit: "0.01 ETH",
    available: true,
  },
  {
    id: "2",
    name: "스터디 카페 집중",
    address: "안성시 대학로 456",
    baseDeposit: "0.015 ETH",
    available: true,
  },
  {
    id: "3",
    name: "레스토랑 미식가",
    address: "천안시 번화가 789",
    baseDeposit: "0.02 ETH",
    available: true,
  },
  {
    id: "4",
    name: "북카페 책과 커피",
    address: "서울시 강남구 101",
    baseDeposit: "0.01 ETH",
    available: false,
  },
];

export function Home() {
  const [region, setRegion] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const regions = ["전체", "서울", "경기", "안성", "천안"];

  const filteredStores = mockStores.filter((store) => {
    const matchesRegion = region === "전체" || store.address.includes(region);
    const matchesSearch =
      searchQuery === "" ||
      store.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  return (
    <div className="min-h-screen p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#566F2F' }}>
              ShowUp
            </h1>
            <p className="text-gray-600">신뢰 기반 예약 플랫폼</p>
          </div>
          <Link to="/seller/reservations">
            <button
              className="px-4 py-2 rounded-lg flex items-center gap-2 border-2"
              style={{ borderColor: '#566F2F', color: '#566F2F' }}
            >
              <Store size={18} />
              <span className="text-sm font-medium">판매자</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Region Selector */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className="px-4 py-2 rounded-full whitespace-nowrap transition-colors"
              style={{
                backgroundColor: region === r ? '#566F2F' : 'white',
                color: region === r ? 'white' : '#566F2F',
                border: `1px solid ${region === r ? '#566F2F' : '#D1D5DB'}`,
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
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
            style={{ '--tw-ring-color': '#566F2F' } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Store List */}
      <div className="space-y-4">
        {filteredStores.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            검색 결과가 없습니다.
          </p>
        ) : (
          filteredStores.map((store) => (
            <Link key={store.id} to={`/store/${store.id}`}>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{store.name}</h3>
                  {store.available ? (
                    <span
                      className="text-sm px-2 py-1 rounded"
                      style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}
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
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    기본 보증금: <span className="font-semibold" style={{ color: '#D97706' }}>{store.baseDeposit}</span>
                  </span>
                  <button
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: '#566F2F' }}
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
