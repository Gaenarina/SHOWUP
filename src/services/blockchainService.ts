import { ethers } from "ethers";
import UserReputationABI from "../abi/UserReputation.json";

const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

// ----------------------
// 1. MetaMask 연결
// ----------------------
export const connectWallet = async (): Promise<string> => {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask가 설치되어 있지 않습니다.");
  }

  const accounts = await (window as any).ethereum.request({
    method: "eth_requestAccounts",
  });

  return accounts[0];
};

// ----------------------
// 2. provider
// ----------------------
const getProvider = () => {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask가 없습니다.");
  }

  return new ethers.BrowserProvider((window as any).ethereum);
};

// ----------------------
// 3. signer
// ----------------------
const getSigner = async () => {
  const provider = getProvider();
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
};

// ----------------------
// 4. contract
// ----------------------
const getContract = async () => {
  const signer = await getSigner();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    UserReputationABI.abi,
    signer
  );
};

// ----------------------
// 5. 노쇼 기록
// ----------------------
export const recordNoShow = async (userAddress: string) => {
  const contract = await getContract();

  const tx = await contract.recordNoShow(userAddress);
  await tx.wait();

  console.log("노쇼 기록 완료");
};

// ----------------------
// 6. 평판 조회
// ----------------------
export const getReputation = async (userAddress: string) => {
  const contract = await getContract();

  const score = await contract.getReputation(userAddress);

  return score.toString();
};