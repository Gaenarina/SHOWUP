import { useEffect, useState } from "react";
import { Link, useNavigate } from "./routerCompat";
import { Bell, CheckCircle, AlertCircle, Store } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { getUserProfile } from "../../services/authService";
import { subscribeSellerReservations } from "../../services/reservationService";
import type { Reservation } from "../../types/reservation";

type SellerNotification = {
  id: string;
  reservationId: string;
  type: "new_reservation" | "attendance_waiting" | "noshow";
  title: string;
  message: string;
  time: string;
  read: boolean;
};

const getStorageKey = (uid: string) => `showup-read-seller-notifications-${uid}`;

const getDateValue = (value: any) => {
  if (value?.toDate) return value.toDate();
  return new Date(value);
};

const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays === 1) return "어제";
  return `${diffDays}일 전`;
};

const buildSellerNotifications = (
  reservations: Reservation[],
  readIds: string[]
): SellerNotification[] => {
  const result: SellerNotification[] = [];

  reservations.forEach((reservation) => {
    const status = String(reservation.status);
    const createdAt = getDateValue(
      (reservation as any).createdAt ?? reservation.date
    );

    if (status === "pending") {
      result.push({
        id: `new-${reservation.id}`,
        reservationId: reservation.id,
        type: "new_reservation",
        title: "새 예약 요청",
        message: `${reservation.consumerName}님이 ${reservation.storeName} 예약을 요청했습니다.`,
        time: getRelativeTime(createdAt),
        read: readIds.includes(`new-${reservation.id}`),
      });
    }

    if (
      (status === "pending" || status === "confirmed") &&
      !reservation.sellerVerified
    ) {
      result.push({
        id: `attendance-${reservation.id}`,
        reservationId: reservation.id,
        type: "attendance_waiting",
        title: "참석 인증 활성화 필요",
        message: `${reservation.consumerName}님의 예약 인증 버튼 활성화가 필요합니다.`,
        time: getRelativeTime(createdAt),
        read: readIds.includes(`attendance-${reservation.id}`),
      });
    }

    if (status === "noshow") {
      result.push({
        id: `noshow-${reservation.id}`,
        reservationId: reservation.id,
        type: "noshow",
        title: "노쇼 처리 완료",
        message: `${reservation.consumerName}님의 예약이 노쇼 처리되었습니다.`,
        time: getRelativeTime(createdAt),
        read: readIds.includes(`noshow-${reservation.id}`),
      });
    }
  });

  return result;
};

export function SellerNotifications() {
  const navigate = useNavigate();

  const [uid, setUid] = useState("");
  const [isSeller, setIsSeller] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const notifications = buildSellerNotifications(
    reservations,
    readNotificationIds
  );

  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    let unsubscribeReservations: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeReservations) {
        unsubscribeReservations();
      }

      if (!user) {
        setUid("");
        setIsSeller(false);
        setReservations([]);
        setReadNotificationIds([]);
        setIsLoading(false);
        return;
      }

      const profile = await getUserProfile(user.uid);

      setUid(user.uid);
      setIsSeller(profile?.role === "seller");

      const savedReadIds = localStorage.getItem(getStorageKey(user.uid));
      setReadNotificationIds(savedReadIds ? JSON.parse(savedReadIds) : []);

      if (profile?.role === "seller") {
        unsubscribeReservations = subscribeSellerReservations(
          user.uid,
          (items) => {
            setReservations(items);
            setIsLoading(false);
          }
        );
      } else {
        setReservations([]);
        setIsLoading(false);
      }
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

  const getIcon = (type: SellerNotification["type"]) => {
    if (type === "new_reservation") {
      return <Bell size={24} style={{ color: "#566F2F" }} />;
    }

    if (type === "attendance_waiting") {
      return <CheckCircle size={24} style={{ color: "#D97706" }} />;
    }

    return <AlertCircle size={24} style={{ color: "#DC2626" }} />;
  };

  const handleClickNotification = (notification: SellerNotification) => {
    setReadNotificationIds((prev) => {
      if (prev.includes(notification.id)) return prev;
      return [...prev, notification.id];
    });

    navigate(`/seller/reservations?reservationId=${notification.reservationId}`);
  };

  const handleMarkAllAsRead = () => {
    setReadNotificationIds(notifications.map((item) => item.id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 pb-20 flex items-center justify-center">
        <p className="text-gray-500">판매자 알림을 불러오는 중입니다.</p>
      </div>
    );
  }

  if (!uid || !isSeller) {
    return (
      <div className="min-h-screen p-4 pb-20 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center w-full max-w-sm">
          <Store size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 mb-5">
            판매자 알림을 확인하려면
            <br />
            판매자 계정으로 로그인해주세요.
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
              판매자 알림
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
              onClick={() => handleClickNotification(notification)}
              className={`bg-white rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                !notification.read ? "border-2" : "border"
              }`}
              style={{
                borderColor: !notification.read ? "#566F2F" : "#E5E7EB",
              }}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>

                <div className="flex-1">
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

                  <p className="text-xs text-gray-400">{notification.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
