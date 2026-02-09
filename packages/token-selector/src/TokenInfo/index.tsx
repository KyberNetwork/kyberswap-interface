import { useMemo } from "react";

import {
  ChainId,
  NATIVE_TOKEN_ADDRESS,
  NETWORKS_INFO,
  Token,
} from "@kyber/schema";

import MarketInfo from "@/TokenInfo/MarketInfo";
import SecurityInfo from "@/TokenInfo/SecurityInfo";
import ChevronLeft from "@/assets/chevron-left.svg?react";

const TokenInfo = ({
  token,
  chainId,
  onGoBack,
}: {
  token: Token;
  chainId: ChainId;
  onGoBack: () => void;
}) => {
  const tokenAddress = useMemo(
    () =>
      (token?.address
        ? token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NETWORKS_INFO[chainId].wrappedToken.address
          : token.address
        : ""
      ).toLowerCase(),
    [token, chainId],
  );

  return (
    <div className="w-full mx-auto text-white overflow-hidden">
      <div className="flex items-center gap-1 p-4 pb-[14px]">
        <ChevronLeft
          className="text-subText w-[26px] h-[26px] cursor-pointer hover:text-text"
          onClick={onGoBack}
        />
        <span className="ml-1">{token.symbol || ""}</span>
        <span className="text-xs text-subText mt-1">{token.name || ""}</span>
      </div>
      <MarketInfo token={token} tokenAddress={tokenAddress} chainId={chainId} />
      <SecurityInfo tokenAddress={tokenAddress} chainId={chainId} />
    </div>
  );
};

export default TokenInfo;
