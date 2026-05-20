import { Link, useLocation } from "react-router";
import { Home, Bell, User, CalendarCheck } from "lucide-react";

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: "/", icon: Home, label: "홈" },
    { path: "/reservations", icon: CalendarCheck, label: "예약관리" },
    { path: "/notifications", icon: Bell, label: "알림" },
    { path: "/mypage", icon: User, label: "마이페이지" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-screen-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full"
            >
              <Icon
                size={24}
                style={{ color: active ? "#566F2F" : "#9CA3AF" }}
              />

              <span
                className="text-xs mt-1"
                style={{ color: active ? "#566F2F" : "#9CA3AF" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}