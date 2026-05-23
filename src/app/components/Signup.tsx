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

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}
import type { MetaMaskInpageProvider } from "@metamask/providers";

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
  const [walletAddress, setWalletAddress] = useState<string>("");

  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  // =========================
  // 1. MetaMask 연결
  // =========================
  const handleWalletConnect = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask가 설치되어 있지 않습니다.");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const address = accounts[0];

      console.log("지갑 주소:", address);

      setWalletAddress(address);
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("지갑 연결 실패");
    }
  };

  // =========================
  // 2. 회원가입
  // =========================
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
      setErrorMessage("판매자 정보가 필요합니다.");
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
        walletAddress: walletAddress, // ⭐ 핵심: 실제 지갑 주소
      });

      navigate("/login");
    } catch (error) {
      console.error(error);
      setErrorMessage("회원가입 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8 bg-[#fffdf8]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#E6EAD9] p-7">

        {/* 헤더 */}
        <div className="mb-7">
          <span className="text-xs font-semibold" style={{ color: "#8A967C" }}>
            신뢰 기반 예약 플랫폼
          </span>
          <h1 className="showup-logo mt-2">ShowUp</h1>
        </div>

        {/* 역할 선택 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setRole("consumer")}
            className="py-3 rounded-xl border"
            style={{
              backgroundColor: role === "consumer" ? "#566F2F" : "#fff",
              color: role === "consumer" ? "#fff" : "#566F2F",
            }}
          >
            <User size={18} /> 소비자
          </button>

          <button
            onClick={() => setRole("seller")}
            className="py-3 rounded-xl border"
            style={{
              backgroundColor: role === "seller" ? "#566F2F" : "#fff",
              color: role === "seller" ? "#fff" : "#566F2F",
            }}
          >
            <Store size={18} /> 판매자
          </button>
        </div>

        {/* 기본 정보 */}
        <div className="space-y-3">
          <input placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} className="input" />
          <input placeholder="전화번호" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
        </div>

        {/* 계정 정보 */}
        <div className="space-y-3 mt-4">
          <input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
          <input type="password" placeholder="비밀번호 확인" value={passwordCheck} onChange={(e) => setPasswordCheck(e.target.value)} className="input" />
        </div>

        {/* 판매자 정보 */}
        {role === "seller" && (
          <div className="space-y-3 mt-4">
            <input placeholder="상호명" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="input" />
            <input placeholder="사업자번호" value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} className="input" />
          </div>
        )}

        {/* 지갑 연결 */}
        <div className="mt-5">
          <button
            onClick={handleWalletConnect}
            className="w-full py-3 rounded-xl border"
            style={{
              borderColor: walletConnected ? "#566F2F" : "#ccc",
              color: walletConnected ? "#566F2F" : "#333",
            }}
          >
            <Wallet /> {walletConnected ? "지갑 연결 완료" : "지갑 연결하기"}
          </button>

          {walletAddress && (
            <p className="text-xs mt-2 text-gray-500">
              {walletAddress}
            </p>
          )}
        </div>

        {/* 에러 */}
        {errorMessage && (
          <p className="text-red-500 text-sm mt-3">{errorMessage}</p>
        )}

        {/* 회원가입 */}
        <button
          onClick={handleSignup}
          className="w-full mt-5 py-3 bg-[#566F2F] text-white rounded-xl"
        >
          회원가입
        </button>

        <div className="mt-4 flex justify-between text-sm">
          <Link to="/">메인</Link>
          <Link to="/login">로그인</Link>
        </div>
      </div>
    </div>
  );
}