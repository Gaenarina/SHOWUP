import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Wallet, AlertCircle } from "lucide-react";

export function BookingConfirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { storeId, storeName, date, time } = location.state || {};
  const [walletConnected, setWalletConnected] = useState(false);

  // Mock user data
  const userNoShowCount = 2;
  const baseDeposit = 0.01;
  const penaltyDeposit = userNoShowCount * 0.005;
  const totalDeposit = baseDeposit + penaltyDeposit;

  if (!storeId || !storeName || !date || !time) {
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

  const handleConfirmBooking = () => {
    // Here would be blockchain transaction
    navigate("/booking/complete", {
      state: {
        storeId,
        storeName,
        date,
        time,
        deposit: totalDeposit,
      },
    });
  };

  return (
    <div className="min-h-screen p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#566F2F' }}>
          보증금 확인
        </h2>
        <p className="text-gray-600">예약 전 보증금을 확인해주세요</p>
      </div>

      {/* Booking Summary */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h3 className="font-semibold mb-3">예약 정보</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">업체명</span>
            <span className="font-medium">{storeName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">날짜</span>
            <span className="font-medium">
              {format(new Date(date), "yyyy년 M월 d일 (E)", { locale: ko })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">시간</span>
            <span className="font-medium">{time}</span>
          </div>
        </div>
      </div>

      {/* Deposit Breakdown */}
      <div
        className="rounded-lg p-4 mb-4"
        style={{ backgroundColor: '#FEF3C7', border: '2px solid #D97706' }}
      >
        <h3 className="font-semibold mb-3" style={{ color: '#92400E' }}>
          보증금 안내
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between" style={{ color: '#92400E' }}>
            <span>기본 보증금</span>
            <span className="font-semibold">{baseDeposit.toFixed(3)} ETH</span>
          </div>
          <div className="flex justify-between" style={{ color: '#92400E' }}>
            <span>내 노쇼 기록</span>
            <span className="font-semibold">{userNoShowCount}회</span>
          </div>
          <div className="flex justify-between" style={{ color: '#92400E' }}>
            <span>평판 반영 추가 보증금</span>
            <span className="font-semibold">{penaltyDeposit.toFixed(3)} ETH</span>
          </div>
          <div className="border-t border-amber-300 pt-2 mt-2">
            <div className="flex justify-between text-base">
              <span className="font-bold" style={{ color: '#92400E' }}>
                최종 예치 보증금
              </span>
              <span className="font-bold text-lg" style={{ color: '#D97706' }}>
                {totalDeposit.toFixed(3)} ETH
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      {userNoShowCount > 0 && (
        <div
          className="rounded-lg p-4 mb-4 flex items-start gap-3"
          style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444' }}
        >
          <AlertCircle size={20} style={{ color: '#DC2626', marginTop: 2 }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: '#991B1B' }}>
              노쇼 기록이 있습니다
            </p>
            <p className="text-xs mt-1" style={{ color: '#991B1B' }}>
              노쇼가 누적되면 보증금이 계속 증가합니다. 약속을 꼭 지켜주세요!
            </p>
          </div>
        </div>
      )}

      {/* Wallet Connection */}
      {!walletConnected ? (
        <button
          onClick={() => setWalletConnected(true)}
          className="w-full py-4 rounded-lg font-semibold text-lg shadow-md mb-4 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#566F2F', color: 'white' }}
        >
          <Wallet size={24} />
          지갑 연결
        </button>
      ) : (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4 border-2" style={{ borderColor: '#566F2F' }}>
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={20} style={{ color: '#566F2F' }} />
            <span className="font-semibold" style={{ color: '#566F2F' }}>
              지갑 연결됨
            </span>
          </div>
          <p className="text-sm text-gray-600">0x1234...5678</p>
        </div>
      )}

      {/* Confirm Button */}
      <button
        onClick={handleConfirmBooking}
        disabled={!walletConnected}
        className="w-full py-4 rounded-lg text-white font-semibold text-lg shadow-md transition-all"
        style={{
          backgroundColor: walletConnected ? '#566F2F' : '#D1D5DB',
          cursor: walletConnected ? 'pointer' : 'not-allowed',
        }}
      >
        보증금 예치하고 예약 확정
      </button>
    </div>
  );
}
