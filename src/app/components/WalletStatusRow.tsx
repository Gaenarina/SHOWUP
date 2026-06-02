import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronRight, Wallet } from "lucide-react";

type WalletStatusRowProps = {
  savedWalletAddress?: string;
};

const shortenAddress = (address?: string) => {
  if (!address) return "";
  if (address.length <= 12) return address;

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function WalletStatusRow({ savedWalletAddress }: WalletStatusRowProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const connected = mounted && account && chain;
        const title = !mounted
          ? "지갑 상태 확인 중"
          : !connected
            ? "지갑 미연결"
            : chain.unsupported
              ? "네트워크 변경 필요"
              : "지갑 연결됨";
        const description = !mounted
          ? "잠시만 기다려주세요"
          : !connected
            ? savedWalletAddress
              ? `저장된 지갑 ${shortenAddress(savedWalletAddress)}`
              : "새로운 지갑을 연결하세요"
            : chain.unsupported
              ? chain.name
              : `${account.displayName} · ${chain.name}`;
        const handleClick = !connected
          ? openConnectModal
          : chain.unsupported
            ? openChainModal
            : openAccountModal;

        return (
          <button
            type="button"
            onClick={handleClick}
            disabled={!mounted}
            className="w-full p-4 flex items-center justify-between text-left disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <Wallet size={20} style={{ color: "#566F2F" }} />
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" />
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
