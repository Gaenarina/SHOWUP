import { useEffect, useState } from "react";
import { useParams, useNavigate } from "./routerCompat";
import { DayPicker } from "react-day-picker";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { getStoreById } from "@/services/storeService";
import type { Store } from "@/types/store";
import PageLoading from "./PageLoading";

interface TimeSlot {
  time: string;
  available: boolean;
}

const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

const parseDateKey = (dateKey: string) => new Date(`${dateKey}T00:00:00`);

export function Booking() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();

  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined
  );
  const [partySizeInput, setPartySizeInput] = useState("1");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(Boolean(user));
    });

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

    return () => unsubscribeAuth();
  }, [storeId]);

  useEffect(() => {
    if (!store?.allowPartySize) {
      setPartySizeInput("1");
      return;
    }

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
  const blockedDateSet = new Set(store.blockedDates ?? []);
  const blockedDateObjects = (store.blockedDates ?? []).map(parseDateKey);
  const selectedDateKey = selectedDate ? getDateKey(selectedDate) : "";
  const isSelectedDateBlocked =
    Boolean(selectedDateKey) && blockedDateSet.has(selectedDateKey);
  const blockedTimeSet = new Set(
    selectedDateKey
      ? store.blockedDateTimeSlots?.[selectedDateKey] ?? []
      : []
  );
  const hasConfiguredTimeSlots =
    store.availableTimeSlots && store.availableTimeSlots.length > 0;
  const storeTimeSlots = (store.availableTimeSlots ?? []).map((time) => ({
    time,
    available:
      store.available &&
      !isSelectedDateBlocked &&
      !blockedTimeSet.has(time),
  }));
  const hasAvailableTimeSlot = storeTimeSlots.some((slot) => slot.available);
  const isPartySizeValid =
    !store.allowPartySize ||
    (partySizeInput.trim() !== "" &&
      Number.isInteger(partySize) &&
      partySize >= 1);

  const handleDateSelect = (date: Date | undefined) => {
    if (date && blockedDateSet.has(getDateKey(date))) {
      return;
    }

    setSelectedDate(date);
    setSelectedTime(undefined);
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

    if (!isLoggedIn) {
      alert("예약하려면 먼저 로그인해주세요.");
      navigate("/login");
      return;
    }

    const selectedSlot = storeTimeSlots.find(
      (slot) => slot.time === selectedTime
    );

    if (!store.available || !selectedSlot?.available) {
      alert("선택한 날짜 또는 시간은 예약할 수 없습니다.");
      return;
    }

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
            disabled={[{ before: new Date() }, ...blockedDateObjects]}
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
          <h3 className="font-semibold mb-4">예약 가능한 시간</h3>
          {!store.available && (
            <p className="text-sm text-red-500 mb-3">
              판매자가 현재 예약을 마감한 상태입니다.
            </p>
          )}
          {store.available && isSelectedDateBlocked && (
            <p className="text-sm text-red-500 mb-3">
              판매자가 이 날짜의 예약을 받지 않습니다.
            </p>
          )}
          {store.available && !isSelectedDateBlocked && !hasAvailableTimeSlot && (
            <p className="text-sm text-red-500 mb-3">
              {hasConfiguredTimeSlots
                ? "이 날짜에는 예약 가능한 시간이 없습니다."
                : "판매자가 아직 예약 가능 시간을 설정하지 않았습니다."}
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {storeTimeSlots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => slot.available && setSelectedTime(slot.time)}
                disabled={!slot.available}
                className="py-3 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor:
                    selectedTime === slot.time
                      ? "#566F2F"
                      : slot.available
                      ? "white"
                      : "#F3F4F6",
                  color:
                    selectedTime === slot.time
                      ? "white"
                      : slot.available
                      ? "#566F2F"
                      : "#9CA3AF",
                  border: `2px solid ${
                    selectedTime === slot.time
                      ? "#566F2F"
                      : slot.available
                      ? "#D1D5DB"
                      : "#E5E7EB"
                  }`,
                  cursor: slot.available ? "pointer" : "not-allowed",
                }}
              >
                {slot.time}
                {!slot.available && <div className="text-xs mt-1">마감</div>}
              </button>
            ))}
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
        disabled={
          !store.available ||
          !selectedDate ||
          !selectedTime ||
          !isPartySizeValid
        }
        className="w-full py-4 rounded-lg text-white font-semibold text-lg shadow-md transition-all"
        style={{
          backgroundColor:
            store.available && selectedDate && selectedTime && isPartySizeValid
              ? "#566F2F"
              : "#D1D5DB",
          cursor:
            store.available && selectedDate && selectedTime && isPartySizeValid
              ? "pointer"
              : "not-allowed",
        }}
      >
        다음 단계로
      </button>
    </div>
  );
}
