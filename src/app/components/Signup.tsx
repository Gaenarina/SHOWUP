import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { registerUser } from "../../services/authService";
import {
  User,
  Store,
  Mail,
  Lock,
  Phone,
  Calendar,
  Wallet,
  Building2,
  BadgeCheck,
} from "lucide-react";

export function Signup() {
  const [role, setRole] = useState<"consumer" | "seller">("consumer");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");

  const [walletConnected, setWalletConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleSignup = async () => {
    if (
        !name ||
        !phone ||
        !birthYear ||
        !birthMonth ||
        !birthDay ||
        !email ||
        !password ||
        !passwordCheck
    ) {
        setErrorMessage("필수 정보를 모두 입력해주세요.");
        return;
    }

    if (role === "seller" && (!businessName || !businessNumber)) {
        setErrorMessage("판매자 정보인 상호명과 사업자등록번호를 입력해주세요.");
        return;
    }

    if (password !== passwordCheck) {
        setErrorMessage("비밀번호가 일치하지 않습니다.");
        return;
    }

    try {
        setErrorMessage("");

        await registerUser({
        email,
        password,
        name,
        role,
        phone,
        birthDate: `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`,
        businessName: role === "seller" ? businessName : null,
        businessNumber: role === "seller" ? businessNumber : null,
        walletAddress: walletConnected ? "connected" : "",
        });

        navigate("/login");
    } catch (error) {
        console.error(error);
        setErrorMessage("회원가입 중 오류가 발생했습니다.");
    }
  };

  const handleWalletConnect = () => {
    setWalletConnected(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8 bg-[#fffdf8]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#E6EAD9] p-7">
        <div className="mb-7">
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ color: "#8A967C" }}
          >
            신뢰 기반 예약 플랫폼
          </span>

          <h1 className="showup-logo mt-2">ShowUp</h1>

          <p className="text-sm text-gray-500 mt-3">
            예약 서비스를 이용하기 위해 회원 정보를 입력해주세요.
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

        <div className="mb-5">
          <p className="text-sm font-semibold mb-3" style={{ color: "#566F2F" }}>
            기본 정보
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7]">
              <User size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7]">
              <Phone size={18} className="text-gray-400" />
              <input
                type="tel"
                placeholder="전화번호"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            <div className="px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7]">
                <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-500">생년월일</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <input
                    type="text"
                    inputMode="numeric"
                    placeholder="연도"
                    maxLength={4}
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full bg-white rounded-lg px-3 py-2 outline-none text-sm border border-gray-100"
                    />

                    <input
                    type="text"
                    inputMode="numeric"
                    placeholder="월"
                    maxLength={2}
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="w-full bg-white rounded-lg px-3 py-2 outline-none text-sm border border-gray-100"
                    />

                    <input
                    type="text"
                    inputMode="numeric"
                    placeholder="일"
                    maxLength={2}
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="w-full bg-white rounded-lg px-3 py-2 outline-none text-sm border border-gray-100"
                    />
                </div>
                </div>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm font-semibold mb-3" style={{ color: "#566F2F" }}>
            계정 정보
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7]">
              <Mail size={18} className="text-gray-400" />
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7]">
              <Lock size={18} className="text-gray-400" />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7]">
              <Lock size={18} className="text-gray-400" />
              <input
                type="password"
                placeholder="비밀번호 확인"
                value={passwordCheck}
                onChange={(e) => setPasswordCheck(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {role === "seller" && (
          <div className="mb-5">
            <p className="text-sm font-semibold mb-3" style={{ color: "#566F2F" }}>
              판매자 정보
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7]">
                <Building2 size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="상호명"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                />
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAF7]">
                <BadgeCheck size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="사업자등록번호"
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              판매자 예약 관리 기능 이용을 위한 기본 확인 정보입니다.
            </p>
          </div>
        )}

        <div className="mb-5">
          <p className="text-sm font-semibold mb-3" style={{ color: "#566F2F" }}>
            지갑 연결
          </p>

          <button
            type="button"
            onClick={handleWalletConnect}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold"
            style={{
              borderColor: walletConnected ? "#566F2F" : "#D1D5DB",
              color: walletConnected ? "#566F2F" : "#6B7280",
              backgroundColor: walletConnected ? "#F2F7EC" : "#FFFFFF",
            }}
          >
            <Wallet size={18} />
            {walletConnected ? "지갑 연결 완료" : "지갑 연결하기 (선택)"}
          </button>

          <p className="text-xs text-gray-400 mt-2">
            지갑 연결은 선택 사항이며, 보증금 결제 단계에서 나중에 진행할 수 있습니다.
          </p>
        </div>

        {errorMessage && (
          <p className="text-sm text-red-500 mb-3">{errorMessage}</p>
        )}

        <button
          type="button"
          onClick={handleSignup}
          className="w-full py-3 rounded-xl text-white font-semibold"
          style={{ backgroundColor: "#566F2F" }}
        >
          회원가입
        </button>

        <div className="flex justify-between items-center mt-5 text-sm">
          <Link to="/" className="text-gray-500">
            메인으로 돌아가기
          </Link>

          <Link
            to="/login"
            className="font-medium"
            style={{ color: "#566F2F" }}
          >
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}