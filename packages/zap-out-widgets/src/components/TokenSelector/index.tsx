import { ChangeEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { Input, ScrollArea, Button } from "@kyber/ui";
import { formatWei } from "@/utils";
import { NATIVE_TOKEN_ADDRESS } from "@/constants";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import TrashIcon from "@/assets/svg/trash.svg";
import IconSearch from "@/assets/svg/search.svg";
import Info from "@/assets/svg/info.svg";
import X from "@/assets/svg/x.svg";
import { Token } from "@/schema";
import { formatUnits, isAddress } from "@kyber/utils/crypto";
import { useZapOutUserState } from "@/stores/state";
import { useTokenList } from "@/hooks/useTokenList";
import { useZapOutContext } from "@/stores";

export enum TOKEN_TAB {
  ALL,
  IMPORTED,
}

interface CustomizeToken extends Token {
  balance: string;
  balanceToSort: string;
  disabled: boolean;
}

const MESSAGE_TIMEOUT = 4_000;
let messageTimeout: ReturnType<typeof setTimeout>;

export default function TokenSelector({
  setTokenToShow,
  setTokenToImport,
  onClose,
  balanceTokens,
}: {
  setTokenToShow: (token: Token) => void;
  setTokenToImport: (token: Token) => void;
  onClose: () => void;
  balanceTokens: { [key: string]: bigint };
}) {
  const { pool } = useZapOutContext((s) => s);

  const { tokenOut, setTokenOut } = useZapOutUserState();
  const { importedTokens, allTokens, fetchTokenInfo, removeToken } =
    useTokenList();

  const defaultToken = {
    decimals: undefined,
    address: "",
    logo: "",
    symbol: "",
  };
  const { address: token0Address } =
    pool === "loading" ? defaultToken : pool.token0;
  const { address: token1Address } =
    pool === "loading" ? defaultToken : pool.token1;

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [unImportedTokens, setUnImportedTokens] = useState<Token[]>([]);
  const [tabSelected, setTabSelected] = useState<TOKEN_TAB>(TOKEN_TAB.ALL);

  const [message, setMessage] = useState<string>("");

  const listTokens = useMemo(
    () =>
      (tabSelected === TOKEN_TAB.ALL ? allTokens : importedTokens)
        .map((token: Token) => {
          const balanceInWei =
            balanceTokens[
              token.address === NATIVE_TOKEN_ADDRESS.toLowerCase()
                ? NATIVE_TOKEN_ADDRESS
                : token.address.toLowerCase()
            ]?.toString() || "0";

          return {
            ...token,
            balance: formatWei(balanceInWei, token?.decimals),
            balanceToSort: formatUnits(balanceInWei, token?.decimals),
            disabled:
              tokenOut?.address.toLowerCase() === token.address.toLowerCase(),
          };
        })
        .sort(
          (a: CustomizeToken, b: CustomizeToken) =>
            parseFloat(b.balanceToSort) - parseFloat(a.balanceToSort)
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      tabSelected,
      allTokens,
      importedTokens,
      balanceTokens,
      token0Address,
      token1Address,
    ]
  );

  const filteredTokens = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return listTokens.filter(
      (item: CustomizeToken) =>
        item.name?.toLowerCase().includes(search) ||
        item.symbol?.toLowerCase().includes(search) ||
        item.address?.toLowerCase().includes(search)
    );
  }, [listTokens, searchTerm]);

  const handleClickToken = (newToken: CustomizeToken) => {
    setTokenOut(newToken);
    onClose();
  };

  const handleChangeSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (unImportedTokens.length) setUnImportedTokens([]);
  };

  const handleRemoveImportedToken = (
    e: MouseEvent<SVGSVGElement>,
    token: Token
  ) => {
    e.stopPropagation();

    const isSelected =
      tokenOut?.address.toLowerCase() === token.address.toLowerCase();

    if (isSelected) {
      setMessage(
        "You cannot remove the selected token, please select another token first."
      );
      return;
    }

    removeToken(token);
  };

  const handleShowTokenInfo = (e: MouseEvent<SVGSVGElement>, token: Token) => {
    e.stopPropagation();
    setTokenToShow(token);
  };

  const handleImportToken = (token: Token) => {
    setTokenToImport(token);
  };

  useEffect(() => {
    if (message) {
      if (messageTimeout) clearTimeout(messageTimeout);
      messageTimeout = setTimeout(() => setMessage(""), MESSAGE_TIMEOUT);
    }

    return () => {
      clearTimeout(messageTimeout);
    };
  }, [message]);

  useEffect(() => {
    if (unImportedTokens?.length) {
      const cloneUnImportedTokens = [...unImportedTokens].filter(
        (token) =>
          !importedTokens.find(
            (importedToken) => importedToken.address === token.address
          )
      );
      setUnImportedTokens(cloneUnImportedTokens);
      setSearchTerm("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importedTokens]);

  useEffect(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!filteredTokens.length && isAddress(search)) {
      fetchTokenInfo(search).then((res) => setUnImportedTokens(res));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTokens]);

  if (pool === "loading") return null;

  return (
    <div className="w-full mx-auto text-white overflow-hidden">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-6 pt-6 pb-0">
          <h2 className="text-xl">Select Token Out</h2>
          <div
            className="text-subText hover:text-white cursor-pointer"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </div>
        </div>

        <p className="text-sm text-subText px-6">
          You can search and select{" "}
          <span className="text-text">any token(s)</span> on KyberSwap
        </p>

        <div className={`px-6`}>
          <div className="relative border-0">
            <Input
              type="text"
              placeholder="Search by token name, token symbol or address"
              className="h-[45px] pl-4 pr-10 py-2 bg-[#0f0f0f] border-[1.5px] border-[#0f0f0f] text-white placeholder-subText rounded-full focus:border-success"
              value={searchTerm}
              onChange={handleChangeSearch}
            />
            <IconSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-subText h-[18px]" />
          </div>
        </div>

        <TokenFeature
          tabSelected={tabSelected}
          setTabSelected={setTabSelected}
          setMessage={setMessage}
        />

        <ScrollArea className={`custom-scrollbar !mt-0 h-[360px]`}>
          <>
            {tabSelected === TOKEN_TAB.ALL &&
              unImportedTokens.map((token: Token, index) => (
                <div
                  key={`${token.symbol}-${index}`}
                  className="flex items-center justify-between py-2 px-6 text-red"
                >
                  <div className="flex items-center gap-2">
                    <img
                      className="h-6 w-6"
                      src={token.logo}
                      alt=""
                      onError={({ currentTarget }) => {
                        currentTarget.onerror = null;
                        currentTarget.src = defaultTokenLogo;
                      }}
                    />
                    <p className="ml-2 text-subText">{token.symbol}</p>
                    <p className="text-xs text-[#6C7284]">{token.name}</p>
                  </div>
                  <Button
                    className="rounded-full !bg-accent font-normal !text-[#222222] px-3 py-[6px] h-fit hover:brightness-75"
                    onClick={() => handleImportToken(token)}
                  >
                    Import
                  </Button>
                </div>
              ))}

            {filteredTokens?.length > 0 && !unImportedTokens.length ? (
              filteredTokens.map((token: CustomizeToken, index) => (
                <div
                  key={`${token.symbol}-${index}`}
                  className={`flex items-center justify-between py-2 px-6 cursor-pointer hover:bg-[#0f0f0f] ${
                    token.address?.toLowerCase() ===
                    tokenOut?.address.toLowerCase()
                      ? "bg-[#1d7a5f26]"
                      : ""
                  } ${
                    token.disabled
                      ? "!bg-stroke !cursor-not-allowed brightness-50"
                      : ""
                  }`}
                  onClick={() => !token.disabled && handleClickToken(token)}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      className="h-6 w-6"
                      src={token.logo ? token.logo : defaultTokenLogo}
                      alt=""
                      onError={({ currentTarget }) => {
                        currentTarget.onerror = null;
                        currentTarget.src = defaultTokenLogo;
                      }}
                    />
                    <div>
                      <p className="leading-6">{token.symbol}</p>
                      <p
                        className={`${
                          tabSelected === TOKEN_TAB.ALL ? "text-xs" : ""
                        } text-subText`}
                      >
                        {tabSelected === TOKEN_TAB.ALL
                          ? token.name
                          : token.balance}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    {tabSelected === TOKEN_TAB.ALL ? (
                      <span>{token.balance}</span>
                    ) : (
                      <TrashIcon
                        className="w-[18px] text-subText hover:text-text !cursor-pointer"
                        onClick={(e) => handleRemoveImportedToken(e, token)}
                      />
                    )}
                    <Info
                      className="w-[18px] h-[18px] text-subText hover:text-text !cursor-pointer"
                      onClick={(e) => handleShowTokenInfo(e, token)}
                    />
                  </div>
                </div>
              ))
            ) : !unImportedTokens.length ||
              (tabSelected === TOKEN_TAB.IMPORTED && !importedTokens.length) ? (
              <div className="text-center text-[#6C7284] font-medium mt-4">
                No results found.
              </div>
            ) : (
              <></>
            )}
          </>
        </ScrollArea>

        {message && (
          <div
            className={`text-warning bg-warning-200 py-3 px-4 mt-2 text-xs mx-6 rounded-md transition-all ease-in-out duration-300`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

const TokenFeature = ({
  tabSelected,
  setTabSelected,
  setMessage,
}: //onClose,
{
  tabSelected: TOKEN_TAB;
  setTabSelected: (tab: TOKEN_TAB) => void;
  setMessage: (message: string) => void;
  //onClose: () => void;
}) => {
  const { tokenOut } = useZapOutUserState();
  const { importedTokens, removeAllTokens } = useTokenList();

  const handleRemoveAllImportedToken = () => {
    if (
      importedTokens.find(
        (importedToken) =>
          tokenOut?.address.toLowerCase() ===
          importedToken.address.toLowerCase()
      )
    ) {
      setMessage(
        "You cannot remove the only selected token, please select another token first."
      );
      return;
    }

    removeAllTokens();
  };

  return (
    <>
      <div className="px-6 pb-3 flex gap-4 border-b border-[#505050]">
        <div
          className={`text-sm cursor-pointer ${
            tabSelected === TOKEN_TAB.ALL ? "text-accent" : ""
          }`}
          onClick={() => setTabSelected(TOKEN_TAB.ALL)}
        >
          All
        </div>
        <div
          className={`text-sm cursor-pointer ${
            tabSelected === TOKEN_TAB.IMPORTED ? "text-accent" : ""
          }`}
          onClick={() => setTabSelected(TOKEN_TAB.IMPORTED)}
        >
          Imported
        </div>
      </div>

      {tabSelected === TOKEN_TAB.IMPORTED && importedTokens.length ? (
        <div className="flex items-center justify-between px-6 !mt-0 py-[10px]">
          <span className="text-xs text-icon">
            {importedTokens.length} Custom Tokens
          </span>
          <Button
            className="rounded-full !text-icon flex items-center gap-2 text-xs px-[10px] py-[5px] h-fit font-normal !bg-[#a9a9a933]"
            onClick={handleRemoveAllImportedToken}
          >
            <TrashIcon className="w-[13px] h-[13px]" />
            Clear All
          </Button>
        </div>
      ) : null}
    </>
  );
};
