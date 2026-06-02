import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import type { CSSProperties } from "react";

type WalletConnectButtonProps = {
  className?: string;
  style?: CSSProperties;
  iconSize?: number;
};

export function WalletConnectButton({
  className,
  style,
  iconSize = 20,
}: WalletConnectButtonProps) {
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
        const label = !connected
          ? "지갑 연결"
          : chain.unsupported
            ? "네트워크 변경"
            : account.displayName;
        const handleClick = !connected
          ? openConnectModal
          : chain.unsupported
            ? openChainModal
            : openAccountModal;

        return (
          <button
            type="button"
            onClick={handleClick}
            className={className}
            style={style}
            disabled={!mounted}
          >
            <Wallet size={iconSize} />
            <span>{label}</span>
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
