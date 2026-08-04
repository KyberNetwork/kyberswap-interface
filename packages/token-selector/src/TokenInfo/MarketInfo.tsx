import { useState } from "react";

import { useLingui } from "@lingui/react";

import { useCopy } from "@kyber/hooks";
import { ChainId, Token } from "@kyber/schema";
import { Loading, TokenLogo } from "@kyber/ui";
import { shortenAddress } from "@kyber/utils/crypto";

import useMarketTokenInfo from "@/TokenInfo/useMarketTokenInfo";
import LogoCoingecko from "@/assets/coingecko.svg?react";
import IconDown from "@/assets/down.svg?react";
import IconZiczac from "@/assets/ziczac.svg?react";

const MarketInfo = ({
  token,
  tokenAddress,
  chainId,
}: {
  token: Token;
  tokenAddress: string;
  chainId: ChainId;
}) => {
  const { i18n } = useLingui();
  const Copy = useCopy({
    text: tokenAddress,
    copyClassName: "w-4 h-4 text-text hover:text-subText",
    successClassName: "w-4 h-4",
  });

  const { marketTokenInfo, loading } = useMarketTokenInfo({
    tokenAddress,
    chainId,
    i18n,
  });
  const [expand, setExpand] = useState<boolean>(false);

  const handleChangeExpand = () => setExpand((prev) => !prev);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 text-text bg-icon-200">
        <div className="flex items-center gap-2">
          {" "}
          <IconZiczac className="h-6 w-6" />
          <span>{i18n._("Market Info")}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-subText text-xs">{i18n._("Powered by")}</span>{" "}
          <LogoCoingecko className="h-5" />
        </div>
      </div>
      <div
        className={`flex flex-col gap-3 overflow-hidden px-6 pt-4 transition-all duration-300 ease-in-out ${
          expand ? "h-56" : "h-[88px]"
        }`}
      >
        {(marketTokenInfo || []).map(
          (item: { label: string; value: string }) => (
            <div
              key={item.label}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-subText">{item.label}</span>
              <span>
                {loading ? (
                  <Loading className="text-accent w-[10px] h-[10px]" />
                ) : (
                  item.value
                )}
              </span>
            </div>
          ),
        )}
      </div>
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-subText">{i18n._("Contract Address")}</span>
          <div className="flex items-center gap-1">
            {token ? (
              <>
                <TokenLogo src={token.logo} />
                <span>{shortenAddress(tokenAddress, 3)}</span>
                {Copy}
              </>
            ) : (
              <Loading className="text-accent w-[10px] h-[10px]" />
            )}
          </div>
        </div>
        <div
          className="text-xs font-medium text-accent cursor-pointer mx-auto w-fit flex items-center"
          onClick={handleChangeExpand}
        >
          <span>{!expand ? i18n._("View more") : i18n._("View less")}</span>
          <IconDown
            className={`transition ease-in-out duration-300 ${expand ? "rotate-[-180deg]" : ""}`}
          />
        </div>
      </div>
    </>
  );
};

export default MarketInfo;
