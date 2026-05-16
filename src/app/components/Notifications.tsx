import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Bell, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Notification {
  id: string;
  type: "booking_confirmed" | "booking_cancelled" | "reminder" | "noshow";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "reminder",
    title: "예약 당일 알림",
    message: "오늘 13:00에 카페 온 예약이 있습니다. 참석 확인을 잊지 마세요!",
    timestamp: new Date(2026, 4, 8, 9, 0),
    read: false,
  },
  {
    id: "2",
    type: "booking_confirmed",
    title: "예약 완료",
    message: "카페 온 예약이 완료되었습니다. (2026년 5월 10일 13:00)",
    timestamp: new Date(2026, 4, 7, 14, 30),
    read: true,
  },
  {
    id: "3",
    type: "booking_cancelled",
    title: "예약 취소",
    message: "스터디 카페 집중 예약이 업체 측에 의해 취소되었습니다. 보증금이 환불되었습니다.",
    timestamp: new Date(2026, 4, 6, 11, 20),
    read: true,
  },
  {
    id: "4",
    type: "noshow",
    title: "노쇼 처리",
    message: "레스토랑 미식가 예약에서 노쇼 처리되었습니다. 보증금 0.02 ETH가 차감되었습니다.",
    timestamp: new Date(2026, 3, 28, 20, 0),
    read: true,
  },
];

export function Notifications() {
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "booking_confirmed":
        return <CheckCircle size={24} style={{ color: '#2E7D32' }} />;
      case "booking_cancelled":
        return <XCircle size={24} style={{ color: '#DC2626' }} />;
      case "reminder":
        return <Bell size={24} style={{ color: '#566F2F' }} />;
      case "noshow":
        return <AlertCircle size={24} style={{ color: '#DC2626' }} />;
      default:
        return <Bell size={24} style={{ color: '#9CA3AF' }} />;
    }
  };

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#566F2F' }}>
          알림
        </h2>
        {unreadCount > 0 && (
          <p className="text-gray-600">읽지 않은 알림 {unreadCount}개</p>
        )}
      </div>

      {/* Notifications List */}
      {mockNotifications.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <Bell size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">알림이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mockNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg p-4 shadow-sm ${
                !notification.read ? 'border-2' : 'border'
              }`}
              style={{
                borderColor: !notification.read ? '#566F2F' : '#E5E7EB',
              }}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4
                      className={`font-semibold ${
                        !notification.read ? 'text-base' : 'text-base'
                      }`}
                    >
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0 ml-2 mt-1.5"
                        style={{ backgroundColor: '#566F2F' }}
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(notification.timestamp, "M월 d일 (E) HH:mm", {
                      locale: ko,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
