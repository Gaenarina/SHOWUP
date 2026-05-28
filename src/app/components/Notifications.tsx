import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Bell, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "./routerCompat";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { subscribeConsumerReservations } from "../../services/reservationService";
import type { Reservation } from "../../types/reservation";
import PageLoading from "./PageLoading";

type AppNotification = {
  id: string;
  reservationId: string;
  type: "booking_confirmed" | "booking_cancelled" | "reminder" | "noshow";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
};

const getStorageKey = (uid: string) => `showup-read-notifications-${uid}`;

const getDateValue = (value: any) => {
  if (value?.toDate) return value.toDate();
  return new Date(value);
};

const getReservationDateText = (reservation: Reservation) => {
  return `${format(getDateValue(reservation.date), "yyyy년 M월 d일", {
    locale: ko,
  })} ${reservation.time}`;
};

const buildNotifications = (
  reservations: Reservation[],
  readIds: string[]
): AppNotification[] => {
  const result: AppNotification[] = [];

  reservations.forEach((reservation) => {
    const status = String(reservation.status);
    const createdAt = getDateValue(
      (reservation as any).createdAt ?? reservation.date
    );

    if (status === "pending" || status === "confirmed") {
      result.push({
        id: `created-${reservation.id}`,
        reservationId: reservation.id,
        type: "booking_confirmed",
        title: "예약 생성",
        message: `${reservation.storeName} 예약이 생성되었습니다. (${getReservationDateText(
          reservation
        )})`,
        timestamp: createdAt,
        read: readIds.includes(`created-${reservation.id}`),
      });
    }

    if (
      reservation.verificationEnabled &&
      !reservation.consumerVerified &&
      (status === "pending" || status === "confirmed")
    ) {
      result.push({
        id: `verify-${reservation.id}`,
        reservationId: reservation.id,
        type: "reminder",
        title: "참석 인증 필요",
        message: `${reservation.storeName} 예약의 참석 인증 버튼이 활성화되었습니다. 참석 인증을 완료해주세요.`,
        timestamp: new Date(),
        read: readIds.includes(`verify-${reservation.id}`),
      });
    }

    if (status === "completed" || status === "verified") {
      result.push({
        id: `completed-${reservation.id}`,
        reservationId: reservation.id,
        type: "booking_confirmed",
        title: "예약 완료",
        message: `${reservation.storeName} 예약이 완료되었습니다.`,
        timestamp: createdAt,
        read: readIds.includes(`completed-${reservation.id}`),
      });
    }

    if (status === "noshow") {
      result.push({
        id: `noshow-${reservation.id}`,
        reservationId: reservation.id,
        type: "noshow",
        title: "노쇼 처리",
        message: `${reservation.storeName} 예약이 노쇼 처리되었습니다. 보증금 ${Number(
          reservation.deposit ?? 0
        ).toFixed(3)} ETH가 차감됩니다.`,
        timestamp: createdAt,
        read: readIds.includes(`noshow-${reservation.id}`),
      });
    }

    if (status === "cancelled") {
      result.push({
        id: `cancelled-${reservation.id}`,
        reservationId: reservation.id,
        type: "booking_cancelled",
        title: "예약 취소",
        message: `${reservation.storeName} 예약이 취소되었습니다.`,
        timestamp: createdAt,
        read: readIds.includes(`cancelled-${reservation.id}`),
      });
    }
  });

  return result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export function Notifications() {
  const navigate = useNavigate();

  const [uid, setUid] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const notifications = buildNotifications(reservations, readNotificationIds);
  const unreadCount = notifications.filter((notification) => !notification.read)
    .length;

  useEffect(() => {
    let unsubscribeReservations: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeReservations) {
        unsubscribeReservations();
      }

      if (!user) {
        setUid("");
        setReservations([]);
        setReadNotificationIds([]);
        setIsLoading(false);
        return;
      }

      setUid(user.uid);

      const savedReadIds = localStorage.getItem(getStorageKey(user.uid));
      setReadNotificationIds(savedReadIds ? JSON.parse(savedReadIds) : []);

      unsubscribeReservations = subscribeConsumerReservations(
        user.uid,
        (items) => {
          setReservations(items);
          setIsLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeReservations) {
        unsubscribeReservations();
      }
    };
  }, []);

  useEffect(() => {
    if (!uid) return;

    localStorage.setItem(
      getStorageKey(uid),
      JSON.stringify(readNotificationIds)
    );
  }, [uid, readNotificationIds]);

  const getNotificationIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "booking_confirmed":
        return <CheckCircle size={24} style={{ color: "#2E7D32" }} />;
      case "booking_cancelled":
        return <XCircle size={24} style={{ color: "#DC2626" }} />;
      case "reminder":
        return <Bell size={24} style={{ color: "#566F2F" }} />;
      case "noshow":
        return <AlertCircle size={24} style={{ color: "#DC2626" }} />;
      default:
        return <Bell size={24} style={{ color: "#9CA3AF" }} />;
    }
  };

  const markAsRead = (notificationId: string) => {
    setReadNotificationIds((prev) => {
      if (prev.includes(notificationId)) return prev;
      return [...prev, notificationId];
    });
  };

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id);
    navigate(`/reservations?reservationId=${notification.reservationId}`);
  };

  const handleMarkAllAsRead = () => {
    setReadNotificationIds(notifications.map((notification) => notification.id));
  };

  if (isLoading) {
    return <PageLoading message="알림을 불러오는 중입니다." />;
  }

  if (!uid) {
    return (
      <div className="min-h-screen p-4 pb-20 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center w-full max-w-sm">
          <Bell size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 mb-5">
            알림을 확인하려면 로그인해주세요.
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

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="mb-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: "#566F2F" }}>
              알림
            </h2>

            {unreadCount > 0 ? (
              <p className="text-gray-600">읽지 않은 알림 {unreadCount}개</p>
            ) : (
              <p className="text-gray-500">모든 알림을 확인했습니다</p>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-3 py-2 rounded-lg border text-sm font-medium whitespace-nowrap"
              style={{
                borderColor: "#566F2F",
                color: "#566F2F",
                backgroundColor: "#FFFFFF",
              }}
            >
              모두 읽음
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <Bell size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">알림이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`bg-white rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                !notification.read ? "border-2" : "border"
              }`}
              style={{
                borderColor: !notification.read ? "#566F2F" : "#E5E7EB",
              }}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-base">
                      {notification.title}
                    </h4>

                    {!notification.read && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0 ml-2 mt-1.5"
                        style={{ backgroundColor: "#566F2F" }}
                      />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>

                  <p className="text-xs text-gray-400">
                    {format(notification.timestamp, "M월 d일(E) HH:mm", {
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
