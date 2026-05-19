import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { User, Store, Mail, Lock } from "lucide-react";

export function Login() {
  const [role, setRole] = useState<"consumer" | "seller">("consumer");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (role === "seller") {
      navigate("/seller/reservations");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-[#fffdf8]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#E6EAD9] p-7">
        <div className="mb-8">
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ color: "#8A967C" }}
          >
            신뢰 기반 예약 플랫폼
          </span>

          <h1 className="showup-logo mt-2">ShowUp</h1>

          <p className="text-sm text-gray-500 mt-3">
            예약을 관리하려면 로그인해주세요.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole("consumer")}
            className="py-3 rounded-xl flex items-center justify-center gap-2 border transition"
            style={{
              backgroundColor: role === "consumer" ? "#566F2F" : "#FFFFFF",
              color: role === "consumer" ? "#FFFFFF" : "#566F2F",
              borderColor: "#566F2F",
            }}
          >
            <User size={18} />
            <span className="text-sm font-semibold">소비자</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("seller")}
            className="py-3 rounded-xl flex items-center justify-center gap-2 border transition"
            style={{
              backgroundColor: role === "seller" ? "#566F2F" : "#FFFFFF",
              color: role === "seller" ? "#FFFFFF" : "#566F2F",
              borderColor: "#566F2F",
            }}
          >
            <Store size={18} />
            <span className="text-sm font-semibold">판매자</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7]">
            <Mail size={18} className="text-gray-400" />
            <input
              type="email"
              placeholder="이메일"
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7]">
            <Lock size={18} className="text-gray-400" />
            <input
              type="password"
              placeholder="비밀번호"
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          className="w-full mt-6 py-3 rounded-xl text-white font-semibold"
          style={{ backgroundColor: "#566F2F" }}
        >
          로그인
        </button>

        <div className="flex justify-between items-center mt-5 text-sm">
          <Link to="/" className="text-gray-500">
            메인으로 돌아가기
          </Link>

          <button
            type="button"
            className="font-medium"
            style={{ color: "#566F2F" }}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}