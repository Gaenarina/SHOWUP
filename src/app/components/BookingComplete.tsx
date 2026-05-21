import { useNavigate, useLocation, Link } from "./routerCompat";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";

export function BookingComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const { storeId, storeName, date, time, deposit } = location.state || {};

  if (!storeId || !storeName || !date || !time || deposit === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">예약 정보가 없습니다.</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 rounded-lg text-white"
            style={{ backgroundColor: '#566F2F' }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="rounded-full p-4"
            style={{ backgroundColor: '#E8F5E9' }}
          >
            <CheckCircle2 size={64} style={{ color: '#2E7D32' }} />
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-2xl font-bold text-center mb-2">
          예약이 완료되었습니다
        </h2>
        <p className="text-center text-gray-600 mb-6">
          예약 정보가 안전하게 기록되었습니다.
        </p>

        {/* Booking Details */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h3 className="font-semibold mb-4 pb-2 border-b">예약 정보</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">예약 장소</p>
              <p className="font-semibold">{storeName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">예약 시간</p>
              <p className="font-semibold">
                {format(new Date(date), "yyyy년 M월 d일(E)", { locale: ko })} {time}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">예치 보증금</p>
              <p className="font-semibold" style={{ color: '#D97706' }}>
                {deposit.toFixed(3)} ETH
              </p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div
          className="rounded-lg p-4 mb-6"
          style={{ backgroundColor: '#FEF3C7', border: '1px solid #D97706' }}
        >
          <p className="text-sm font-medium" style={{ color: '#92400E' }}>
            예약 당일 현장 참석 인증이 필요합니다.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link to="/reservations" className="block">
            <button
              className="w-full py-4 rounded-lg text-white font-semibold text-lg shadow-md"
              style={{ backgroundColor: '#566F2F' }}
            >
              내 예약 보기
            </button>
          </Link>
          <Link to="/" className="block">
            <button className="w-full py-4 rounded-lg font-semibold text-lg border-2"
              style={{ borderColor: '#566F2F', color: '#566F2F', backgroundColor: 'white' }}
            >
              홈으로 돌아가기
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
