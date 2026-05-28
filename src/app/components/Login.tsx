import { useState } from "react";
import { Link, useNavigate } from "./routerCompat";
import type { FormEvent } from "react";
import { User, Store, Mail, Lock } from "lucide-react";
import { getUserProfile, loginUser, logoutUser } from "../../services/authService";
import type { UserRole } from "../../types/user";
import LoadingOverlay from "./LoadingOverlay";

export function Login() {
  const [role, setRole] = useState<UserRole>("consumer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const clearLoginStorage = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const user = await loginUser(email, password);
      const profile = await getUserProfile(user.uid);

      if (!profile) {
        await logoutUser();
        clearLoginStorage();
        setErrorMessage("사용자 정보를 찾을 수 없습니다.");
        return;
      }

      if (profile.role !== role) {
        await logoutUser();
        clearLoginStorage();
        setErrorMessage("선택한 역할과 가입 정보가 일치하지 않습니다.");
        return;
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", profile.role);
      localStorage.setItem("userId", user.uid);

      if (profile.role === "seller") {
        navigate("/seller");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoading) {
      void handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-[#fffdf8]">
      <LoadingOverlay isOpen={isLoading} message="로그인 중입니다." />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#E6EAD9] p-7">
        <div className="mb-8">
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ color: "#8A967C" }}
          >
            노쇼 방지 예약 플랫폼
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

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7]">
              <Mail size={18} className="text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7]">
              <Lock size={18} className="text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-500 mt-4">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-3 rounded-xl text-white font-semibold disabled:opacity-60"
            style={{ backgroundColor: "#566F2F" }}
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="flex justify-between items-center mt-5 text-sm">
          <Link to="/" className="text-gray-500">
            홈으로 돌아가기
          </Link>

          <Link
            to="/signup"
            className="font-medium"
            style={{ color: "#566F2F" }}
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
