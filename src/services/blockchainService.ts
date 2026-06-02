import { ethers } from "ethers";
import UserReputationABI from "../abi/UserReputation.json";

const USER_REPUTATION_ADDRESS =
  process.env.NEXT_PUBLIC_USER_REPUTATION_ADDRESS;

export const connectWallet = async (): Promise<string> => {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask가 설치되어 있지 않습니다.");
  }

  const accounts = await (window as any).ethereum.request({
    method: "eth_requestAccounts",
  });

  return accounts[0];
};

const getProvider = () => {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask가 없습니다.");
  }

  return new ethers.BrowserProvider((window as any).ethereum);
};

const getSigner = async () => {
  const provider = getProvider();
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
};

const getContract = async () => {
  if (!USER_REPUTATION_ADDRESS) {
    throw new Error("평판 컨트랙트 주소가 설정되지 않았습니다.");
  }

  const signer = await getSigner();

  return new ethers.Contract(
    USER_REPUTATION_ADDRESS,
    UserReputationABI.abi,
    signer
  );
};

export const registerReputation = async (name: string) => {
  const contract = await getContract();
  const tx = await contract.register(name);
  await tx.wait();
};

export const recordNoShow = async (userAddress: string) => {
  const contract = await getContract();

  const tx = await contract.recordNoShow(userAddress);
  await tx.wait();

  console.log("노쇼 기록 완료");
};

export const getReputation = async (userAddress: string) => {
  const contract = await getContract();
  const [, reputation, noShowCount, isRegistered] =
    await contract.getUser(userAddress);

  return {
    reputation: Number(reputation),
    noShowCount: Number(noShowCount),
    isRegistered: Boolean(isRegistered),
  };
};
