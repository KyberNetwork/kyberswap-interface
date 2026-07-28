import { useMemo } from "react";

import { ChainId, NATIVE_TOKEN_ADDRESS, Token } from "@kyber/schema";

import MarketInfo from "@/TokenInfo/MarketInfo";
import SecurityInfo from "@/TokenInfo/SecurityInfo";
import { getNetworkInfo } from "@/TokenInfo/utils";
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
  const networkInfo = getNetworkInfo(chainId);
  const tokenAddress = useMemo(
    () =>
      (token?.address
        ? token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? networkInfo?.wrappedToken.address || ""
          : token.address
        : ""
      ).toLowerCase(),
    [token, networkInfo],
  );

  return (
    <div className="h-full w-full overflow-y-auto text-white">
      <div className="flex items-center gap-2 p-4">
        <ChevronLeft
          className="text-subText w-5 h-5 cursor-pointer hover:text-text"
          onClick={onGoBack}
        />
        <span className="font-medium">{token.symbol || ""}</span>
        <span className="text-xs text-subText">{token.name || ""}</span>
      </div>
      {tokenAddress ? (
        <>
          <MarketInfo
            token={token}
            tokenAddress={tokenAddress}
            chainId={chainId}
          />
          <SecurityInfo tokenAddress={tokenAddress} chainId={chainId} />
        </>
      ) : null}
    </div>
  );
};

export default TokenInfo;
