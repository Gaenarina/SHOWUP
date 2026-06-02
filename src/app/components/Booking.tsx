import { useEffect, useState } from "react";
import { useParams, useNavigate } from "./routerCompat";
import { DayPicker } from "react-day-picker";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";
import { getStoreById } from "@/services/storeService";
import type { Store } from "@/types/store";
import PageLoading from "./PageLoading";

export function Booking() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();

  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");
  const [partySizeInput, setPartySizeInput] = useState("1");

  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  useEffect(() => {
    const loadStore = async () => {
      if (!storeId) {
        setIsLoading(false);
        return;
      }

      const storeData = await getStoreById(storeId);
      setStore(storeData);
      setIsLoading(false);
    };

    loadStore();
  }, [storeId]);

  useEffect(() => {
    setPartySizeInput("1");
  }, [store]);

  if (isLoading) {
    return <PageLoading message="업체 정보를 불러오는 중입니다." />;
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">업체 정보를 찾을 수 없습니다.</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-6 py-2 rounded-lg text-white"
            style={{ backgroundColor: "#566F2F" }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const hasReservationNotice =
    store.reservationNotice && store.reservationNotice.trim() !== "";

  const partySize = Number(partySizeInput);

  const isPartySizeValid =
    !store.allowPartySize ||
    (partySizeInput.trim() !== "" &&
      Number.isInteger(partySize) &&
      partySize >= 1);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(undefined);
    setSelectedHour("");
    setSelectedMinute("");
  };

  const handleHourChange = (hour: string) => {
    setSelectedHour(hour);

    if (hour && selectedMinute) {
      setSelectedTime(`${hour}:${selectedMinute}`);
    } else {
      setSelectedTime(undefined);
    }
  };

  const handleMinuteChange = (minute: string) => {
    setSelectedMinute(minute);

    if (selectedHour && minute) {
      setSelectedTime(`${selectedHour}:${minute}`);
    } else {
      setSelectedTime(undefined);
    }
  };

  const handlePartySizeChange = (value: string) => {
    if (/^\d*$/.test(value)) {
      setPartySizeInput(value);
    }
  };

  const handlePartySizeBlur = () => {
    const nextPartySize = Number(partySizeInput);

    if (!partySizeInput || !Number.isInteger(nextPartySize) || nextPartySize < 1) {
      setPartySizeInput("1");
    }
  };

  const handleConfirm = () => {
    if (!store || !selectedDate || !selectedTime) return;

    if (!isPartySizeValid) {
      alert("예약 인원은 1명 이상으로 입력해주세요.");
      return;
    }

    navigate("/booking/confirm", {
      state: {
        storeId: store.id,
        sellerId: store.sellerId,
        sellerWalletAddress: store.sellerWalletAddress,
        storeName: store.name,
        address: store.address,
        baseDeposit: store.baseDeposit,
        date: selectedDate,
        time: selectedTime,
        partySize: store.allowPartySize ? partySize : 1,
      },
    });
  };

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: "#566F2F" }}>
          {store.name}
        </h2>
        <p className="text-gray-600">예약 날짜와 시간을 선택하세요</p>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h3 className="font-semibold mb-2">업체 정보</h3>
        <p className="text-sm text-gray-600 mb-1">{store.address}</p>
        <p className="text-sm text-gray-600 mb-1">{store.description}</p>
        <p className="text-sm text-gray-600 mb-1">
          기본 보증금 {store.baseDeposit.toFixed(3)} ETH
        </p>
      </div>

      {hasReservationNotice && (
        <div className="bg-[#FFF8E7] rounded-lg p-4 shadow-sm border border-[#F0D89A] mb-6">
          <h3 className="font-semibold mb-2" style={{ color: "#92400E" }}>
            예약 안내사항
          </h3>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-6">
            {store.reservationNotice}
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
        <h3 className="font-semibold mb-4">날짜 선택</h3>
        <div className="flex justify-center">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            locale={ko}
            disabled={{ before: new Date() }}
            modifiersStyles={{
              selected: {
                backgroundColor: "#566F2F",
                color: "white",
              },
            }}
            className="rdp-custom"
          />
        </div>
      </div>

      {selectedDate && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <p className="text-sm text-gray-600">선택한 날짜</p>
          <p className="text-lg font-semibold" style={{ color: "#566F2F" }}>
            {format(selectedDate, "yyyy년 M월 d일(E)", { locale: ko })}
          </p>
        </div>
      )}

      {selectedDate && store.allowPartySize && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <h3 className="font-semibold mb-3">예약 인원</h3>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={partySizeInput}
              onChange={(event) => handlePartySizeChange(event.target.value)}
              onBlur={handlePartySizeBlur}
              inputMode="numeric"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg font-semibold outline-none focus:border-[#566F2F]"
              placeholder="예: 4"
            />
            <span className="text-lg font-semibold" style={{ color: "#566F2F" }}>
              명
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            인원 제한 없이 입력할 수 있습니다. 판매자가 인원 수용이 어렵다고 판단하면 예약을 취소할 수 있습니다.
          </p>
          {!isPartySizeValid && (
            <p className="text-sm text-red-500 mt-2">
              예약 인원은 1명 이상으로 입력해주세요.
            </p>
          )}
        </div>
      )}

      {selectedDate && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <h3 className="font-semibold mb-4">예약 시간 선택</h3>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={selectedHour}
              onChange={(event) => handleHourChange(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg font-semibold outline-none focus:border-[#566F2F] bg-white"
            >
              <option value="">시 선택</option>
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}시
                </option>
              ))}
            </select>

            <select
              value={selectedMinute}
              onChange={(event) => handleMinuteChange(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg font-semibold outline-none focus:border-[#566F2F] bg-white"
            >
              <option value="">분 선택</option>
              {minutes.map((minute) => (
                <option key={minute} value={minute}>
                  {minute}분
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {selectedTime && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <p className="text-sm text-gray-600">선택한 시간</p>
          <p className="text-lg font-semibold" style={{ color: "#566F2F" }}>
            {selectedTime}
          </p>

          {store.allowPartySize && (
            <>
              <p className="text-sm text-gray-600 mt-3">예약 인원</p>
              <p className="text-lg font-semibold" style={{ color: "#566F2F" }}>
                {isPartySizeValid ? partySize : "-"}명
              </p>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selectedDate || !selectedTime || !isPartySizeValid}
        className="w-full py-4 rounded-lg text-white font-semibold text-lg shadow-md transition-all"
        style={{
          backgroundColor:
            selectedDate && selectedTime && isPartySizeValid
              ? "#566F2F"
              : "#D1D5DB",
          cursor:
            selectedDate && selectedTime && isPartySizeValid
              ? "pointer"
              : "not-allowed",
        }}
      >
        다음 단계로
      </button>
    </div>
  );
}