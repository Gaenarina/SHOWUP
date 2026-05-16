import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { DayPicker } from "react-day-picker";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";

interface TimeSlot {
  time: string;
  available: boolean;
}

const mockTimeSlots: TimeSlot[] = [
  { time: "10:00", available: true },
  { time: "11:00", available: false },
  { time: "13:00", available: true },
  { time: "15:00", available: true },
  { time: "17:00", available: true },
  { time: "19:00", available: false },
];

const storeNames: Record<string, string> = {
  "1": "카페 온",
  "2": "스터디 카페 집중",
  "3": "레스토랑 미식가",
};

export function Booking() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);

  const storeName = storeId ? storeNames[storeId] : "알 수 없는 업체";

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      navigate("/booking/confirm", {
        state: {
          storeId,
          storeName,
          date: selectedDate,
          time: selectedTime,
        },
      });
    }
  };

  return (
    <div className="min-h-screen p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#566F2F' }}>
          {storeName}
        </h2>
        <p className="text-gray-600">예약 날짜와 시간을 선택하세요</p>
      </div>

      {/* Store Info Card */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
        <h3 className="font-semibold mb-2">업체 정보</h3>
        <p className="text-sm text-gray-600 mb-1">기본 보증금: 0.01 ETH</p>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
        <h3 className="font-semibold mb-4">날짜 선택</h3>
        <div className="flex justify-center">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ko}
            disabled={{ before: new Date() }}
            modifiersStyles={{
              selected: {
                backgroundColor: '#566F2F',
                color: 'white',
              },
            }}
            className="rdp-custom"
          />
        </div>
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <p className="text-sm text-gray-600">선택한 날짜</p>
          <p className="text-lg font-semibold" style={{ color: '#566F2F' }}>
            {format(selectedDate, "yyyy년 M월 d일 (E)", { locale: ko })}
          </p>
        </div>
      )}

      {/* Time Slots */}
      {selectedDate && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <h3 className="font-semibold mb-4">예약 가능 시간</h3>
          <div className="grid grid-cols-3 gap-3">
            {mockTimeSlots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => slot.available && setSelectedTime(slot.time)}
                disabled={!slot.available}
                className="py-3 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor:
                    selectedTime === slot.time
                      ? '#566F2F'
                      : slot.available
                      ? 'white'
                      : '#F3F4F6',
                  color:
                    selectedTime === slot.time
                      ? 'white'
                      : slot.available
                      ? '#566F2F'
                      : '#9CA3AF',
                  border: `2px solid ${
                    selectedTime === slot.time
                      ? '#566F2F'
                      : slot.available
                      ? '#D1D5DB'
                      : '#E5E7EB'
                  }`,
                  cursor: slot.available ? 'pointer' : 'not-allowed',
                }}
              >
                {slot.time}
                {!slot.available && (
                  <div className="text-xs mt-1">마감</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Time Display */}
      {selectedTime && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <p className="text-sm text-gray-600">선택한 시간</p>
          <p className="text-lg font-semibold" style={{ color: '#566F2F' }}>
            {selectedTime}
          </p>
        </div>
      )}

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={!selectedDate || !selectedTime}
        className="w-full py-4 rounded-lg text-white font-semibold text-lg shadow-md transition-all"
        style={{
          backgroundColor: selectedDate && selectedTime ? '#566F2F' : '#D1D5DB',
          cursor: selectedDate && selectedTime ? 'pointer' : 'not-allowed',
        }}
      >
        다음 단계로
      </button>
    </div>
  );
}
