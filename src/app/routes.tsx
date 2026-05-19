import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { StoreDetail } from "./components/StoreDetail";
import { Booking } from "./components/Booking";
import { BookingConfirm } from "./components/BookingConfirm";
import { BookingComplete } from "./components/BookingComplete";
import { Reservations } from "./components/Reservations";
import { Notifications } from "./components/Notifications";
import { MyPage } from "./components/MyPage";
import { SellerReservations } from "./components/SellerReservations";
import { Login } from "./components/Login";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "store/:id", Component: StoreDetail },
      { path: "booking/:storeId", Component: Booking },
      { path: "booking/confirm", Component: BookingConfirm },
      { path: "booking/complete", Component: BookingComplete },
      { path: "reservations", Component: Reservations },
      { path: "notifications", Component: Notifications },
      { path: "mypage", Component: MyPage },
      { path: "seller/reservations", Component: SellerReservations },
    ],
  },
]);
