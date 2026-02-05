import React, {
  ChangeEvent,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

import { useLingui } from "@lingui/react";

import { NATIVE_TOKEN_ADDRESS, Token } from "@kyber/schema";
import { Button, Input, TokenLogo, TokenSymbol } from "@kyber/ui";
import { fetchTokenInfo } from "@kyber/utils";
import { isAddress } from "@kyber/utils/crypto";
import { formatUnits } from "@kyber/utils/number";

import Check from "@/assets/check.svg?react";
import Info from "@/assets/info.svg?react";
import IconSearch from "@/assets/search.svg?react";
import TrashIcon from "@/assets/trash.svg?react";
import X from "@/assets/x.svg?react";
import {
  CustomizeToken,
  MAX_TOKENS,
  TOKEN_SELECT_MODE,
  TokenSelectorModalProps,
} from "@/types";
import UserPositions, { TokenLoader } from "@/UserPositions";
import { useTokenState } from "@/useTokenState";

export enum TOKEN_TAB {
  ALL,
  IMPORTED,
}

enum MODAL_TAB {
  TOKENS,
  POSITIONS,
}

const MESSAGE_TIMEOUT = 4_000;
const DEBOUNCE_DELAY = 300;

interface TokenSelectorProps extends TokenSelectorModalProps {
  selectedTokens: Token[];
  setSelectedTokens: (tokens: Token[]) => void;
  setTokenToShow: (token: Token) => void;
  setTokenToImport: (token: Token) => void;
}

const normalizeSpecialCharacters = (value: string) => value.replace(/₮/g, "T");

const TOKEN_ROW_HEIGHT = 52;

interface TokenRowData {
  tokens: CustomizeToken[];
  mode: TOKEN_SELECT_MODE;
  tabSelected: TOKEN_TAB;
  selectedTokenAddress?: string;
  modalTokensInAddress: string[];
  onClickToken: (token: CustomizeToken) => void;
  onRemoveImportedToken: (e: React.MouseEvent, token: Token) => void;
  onShowTokenInfo: (e: React.MouseEvent, token: Token) => void;
  i18n: ReturnType<typeof useLingui>["i18n"];
}

const TokenRow = memo(function TokenRow({
  index,
  style,
  data,
}: ListChildComponentProps<TokenRowData>) {
  const {
    tokens,
    mode,
    tabSelected,
    selectedTokenAddress,
    modalTokensInAddress,
    onClickToken,
    onRemoveImportedToken,
    onShowTokenInfo,
  } = data;

  const token = tokens[index];
  if (!token) return null;

  const isSelected =
    mode === TOKEN_SELECT_MODE.SELECT &&
    token.address?.toLowerCase() === selectedTokenAddress?.toLowerCase();

  return (
    <div
      style={style}
      className={`flex items-center justify-between py-2 px-6 cursor-pointer hover:bg-[#0f0f0f] ${
        isSelected ? "bg-[#1d7a5f26]" : ""
      } ${token.disabled ? "!bg-stroke !cursor-not-allowed brightness-50" : ""}`}
      onClick={() => !token.disabled && onClickToken(token)}
    >
      <div className="flex items-center space-x-3">
        {mode === TOKEN_SELECT_MODE.ADD && (
          <div
            className={`w-4 h-4 rounded-[4px] flex items-center justify-center cursor-pointer mr-1 ${
              modalTokensInAddress.includes(token.address?.toLowerCase())
                ? "bg-emerald-400"
                : "bg-gray-700"
            }`}
          >
            {modalTokensInAddress.includes(token.address?.toLowerCase()) && (
              <Check className="h-3 w-3 text-black" />
            )}
          </div>
        )}
        <TokenLogo src={token.logo} size={24} />
        <div>
          <TokenSymbol
            className="leading-6"
            symbol={token.symbol}
            maxWidth={120}
          />
          <p
            className={`${tabSelected === TOKEN_TAB.ALL ? "text-xs" : ""} text-subText`}
          >
            {tabSelected === TOKEN_TAB.ALL ? token.name : token.balance}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        {tabSelected === TOKEN_TAB.ALL ? (
          <span>{token.balance}</span>
        ) : (
          <TrashIcon
            className="w-[18px] text-subText hover:text-text !cursor-pointer"
            onClick={(e) => onRemoveImportedToken(e, token)}
          />
        )}
        <Info
          className="w-[18px] h-[18px] text-subText hover:text-text !cursor-pointer"
          onClick={(e) => onShowTokenInfo(e, token)}
        />
      </div>
    </div>
  );
});

export default function TokenSelector({
  tokensIn = [],
  amountsIn = "",
  account,
  title,
  selectedTokenAddress,
  mode = TOKEN_SELECT_MODE.SELECT,
  chainId,
  positionId,
  poolAddress,
  token0Address = "",
  token1Address = "",
  showUserPositions = false,
  positionsOnly = false,
  excludePositionIds,
  filterExchanges,
  variant = "default",
  selectedTokens,
  setTokensIn,
  setAmountsIn,
  onTokenSelect,
  onConnectWallet,
  onSelectLiquiditySource,
  setSelectedTokens,
  setTokenToShow,
  setTokenToImport,
  onClose,
  initialSlippage,
}: TokenSelectorProps) {
  const { i18n } = useLingui();
  const {
    importedTokens,
    tokens,
    removeImportedToken,
    tokenBalances,
    isLoading,
  } = useTokenState();

  const allTokens = useMemo(
    () => [...tokens, ...importedTokens],
    [tokens, importedTokens],
  );

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [unImportedTokens, setUnImportedTokens] = useState<Token[]>([]);
  const [tabSelected, setTabSelected] = useState<TOKEN_TAB>(TOKEN_TAB.ALL);
  const [modalTabSelected, setModalTabSelected] = useState<MODAL_TAB>(
    positionsOnly ? MODAL_TAB.POSITIONS : MODAL_TAB.TOKENS,
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");
  const [modalTokensIn, setModalTokensIn] = useState<Token[]>([...tokensIn]);
  const [modalAmountsIn, setModalAmountsIn] = useState(amountsIn);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const modalTokensInAddress = useMemo(
    () => modalTokensIn.map((token: Token) => token.address?.toLowerCase()),
    [modalTokensIn],
  );

  const listTokens = useMemo(() => {
    // Skip expensive computation when not showing tokens tab
    if (modalTabSelected === MODAL_TAB.POSITIONS) {
      return [];
    }

    // Pre-compute lowercase addresses once for lookup
    const tokensInSet = new Set(tokensIn.map((t) => t.address.toLowerCase()));
    const selectedTokensSet = new Set(
      selectedTokens.map((t) => t.address.toLowerCase()),
    );
    const token0Lower = token0Address.toLowerCase();
    const token1Lower = token1Address.toLowerCase();
    const nativeTokenLower = NATIVE_TOKEN_ADDRESS.toLowerCase();
    const selectedTokenLower = selectedTokenAddress?.toLowerCase();

    const sourceTokens =
      tabSelected === TOKEN_TAB.ALL ? allTokens : importedTokens;

    return sourceTokens
      .map((token: Token) => {
        const tokenAddrLower = token.address.toLowerCase();
        const isInTokensIn = tokensInSet.has(tokenAddrLower);
        const balanceKey =
          tokenAddrLower === nativeTokenLower
            ? nativeTokenLower
            : tokenAddrLower;
        const balanceInWei = tokenBalances[balanceKey]?.toString() || "0";

        return {
          ...token,
          balance: formatUnits(balanceInWei, token?.decimals, 8),
          disabled:
            mode === TOKEN_SELECT_MODE.ADD ||
            !isInTokensIn ||
            tokenAddrLower === selectedTokenLower
              ? false
              : true,
          selected:
            isInTokensIn || selectedTokensSet.has(tokenAddrLower) ? 1 : 0,
          inPair:
            tokenAddrLower === token0Lower
              ? 2
              : tokenAddrLower === token1Lower
                ? 1
                : 0,
        };
      })
      .sort((a: CustomizeToken, b: CustomizeToken) => {
        // Combined sort: selected > inPair > balance (descending)
        if (b.selected !== a.selected) return b.selected - a.selected;
        if (b.inPair !== a.inPair) return b.inPair - a.inPair;
        return parseFloat(b.balance) - parseFloat(a.balance);
      });
  }, [
    modalTabSelected,
    tabSelected,
    allTokens,
    importedTokens,
    tokensIn,
    tokenBalances,
    mode,
    selectedTokenAddress,
    selectedTokens,
    token0Address,
    token1Address,
  ]);

  // Defer the token list to prevent blocking UI during tab switch
  const deferredListTokens = useDeferredValue(listTokens);

  const filteredTokens = useMemo(() => {
    const search = normalizeSpecialCharacters(searchTerm).toLowerCase().trim();

    return deferredListTokens.filter((item: CustomizeToken) => {
      const normalizeName = normalizeSpecialCharacters(
        item.name || "",
      ).toLowerCase();
      const normalizeSymbol = normalizeSpecialCharacters(
        item.symbol || "",
      ).toLowerCase();
      return (
        normalizeName.includes(search) ||
        normalizeSymbol.includes(search) ||
        item.address?.toLowerCase().includes(search)
      );
    });
  }, [deferredListTokens, searchTerm]);

  const handleClickToken = useCallback(
    (newToken: CustomizeToken) => {
      if (mode === TOKEN_SELECT_MODE.SELECT) {
        onTokenSelect?.(newToken);
        const index = tokensIn.findIndex(
          (token: Token) => token.address === selectedTokenAddress,
        );
        if (index > -1 && setTokensIn && setAmountsIn) {
          const clonedTokensIn = [...tokensIn];
          clonedTokensIn[index] = newToken;
          setTokensIn(clonedTokensIn);

          const listAmountsIn = amountsIn.split(",");
          listAmountsIn[index] = "";
          setAmountsIn(listAmountsIn.join(","));

          onClose();
        } else if (onTokenSelect) {
          // Simple mode - just call the callback
          onClose();
        }
      } else {
        const index = modalTokensIn.findIndex(
          (token: Token) =>
            token.address === newToken.address ||
            token.address.toLowerCase() === newToken.address,
        );
        if (index > -1) {
          const clonedModalTokensIn = [...modalTokensIn];
          clonedModalTokensIn.splice(index, 1);
          setModalTokensIn(clonedModalTokensIn);

          setSelectedTokens(clonedModalTokensIn);

          const listModalAmountsIn = modalAmountsIn.split(",");
          listModalAmountsIn.splice(index, 1);
          setModalAmountsIn(listModalAmountsIn.join(","));
        } else if (modalTokensIn.length < MAX_TOKENS) {
          const clonedModalTokensIn = [...modalTokensIn];
          clonedModalTokensIn.push(newToken);
          setModalTokensIn(clonedModalTokensIn);
          setSelectedTokens(clonedModalTokensIn);
          setModalAmountsIn(`${modalAmountsIn},`);
        } else {
          setMessage(
            i18n._(
              "You have reached the maximum token selection limit. Please deselect one or more tokens to make changes.",
            ),
          );
        }
      }
    },
    [
      mode,
      onTokenSelect,
      tokensIn,
      selectedTokenAddress,
      setTokensIn,
      setAmountsIn,
      amountsIn,
      onClose,
      modalTokensIn,
      setSelectedTokens,
      modalAmountsIn,
      i18n,
    ],
  );

  const handleSaveSelected = () => {
    if (mode === TOKEN_SELECT_MODE.ADD && setTokensIn && setAmountsIn) {
      setTokensIn(modalTokensIn);
      setAmountsIn(modalAmountsIn);

      onClose();
    }
  };

  const handleChangeSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (unImportedTokens.length) setUnImportedTokens([]);
  };

  const handleRemoveImportedToken = useCallback(
    (e: React.MouseEvent, token: Token) => {
      e.stopPropagation();

      const index = tokensIn.findIndex(
        (tokenIn: Token) => tokenIn.address === token.address,
      );

      if (index > -1) {
        if (tokensIn.length === 1) {
          setMessage(
            i18n._(
              "You cannot remove the only selected token, please select another token first.",
            ),
          );
          return;
        }

        if (setTokensIn && setAmountsIn) {
          const clonedTokensIn = [...tokensIn];
          const listAmountsIn = amountsIn.split(",");
          clonedTokensIn.splice(index, 1);
          listAmountsIn.splice(index, 1);
          setTokensIn(clonedTokensIn);
          setAmountsIn(listAmountsIn.join(","));
          setSelectedTokens(clonedTokensIn);
          removeImportedToken(token);

          if (
            token.address === selectedTokenAddress &&
            mode === TOKEN_SELECT_MODE.SELECT
          )
            onClose();
        }

        return;
      }

      removeImportedToken(token);
    },
    [
      tokensIn,
      setTokensIn,
      setAmountsIn,
      amountsIn,
      setSelectedTokens,
      removeImportedToken,
      selectedTokenAddress,
      mode,
      onClose,
      i18n,
    ],
  );

  const handleShowTokenInfo = useCallback(
    (e: React.MouseEvent, token: Token) => {
      e.stopPropagation();
      setTokenToShow(token);
    },
    [setTokenToShow],
  );

  const handleImportToken = (token: Token) => {
    setTokenToImport(token);
  };

  // Memoized data for virtualized token list
  const tokenListData = useMemo<TokenRowData>(
    () => ({
      tokens: filteredTokens,
      mode,
      tabSelected,
      selectedTokenAddress,
      modalTokensInAddress,
      onClickToken: handleClickToken,
      onRemoveImportedToken: handleRemoveImportedToken,
      onShowTokenInfo: handleShowTokenInfo,
      i18n,
    }),
    [
      filteredTokens,
      mode,
      tabSelected,
      selectedTokenAddress,
      modalTokensInAddress,
      handleClickToken,
      handleRemoveImportedToken,
      handleShowTokenInfo,
      i18n,
    ],
  );

  useEffect(() => {
    if (message) {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(
        () => setMessage(""),
        MESSAGE_TIMEOUT,
      );
    }

    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, [message]);

  // Debounce search term for API calls
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    if (unImportedTokens?.length) {
      const cloneUnImportedTokens = [...unImportedTokens].filter(
        (token) =>
          !importedTokens.find(
            (importedToken) => importedToken.address === token.address,
          ),
      );
      setUnImportedTokens(cloneUnImportedTokens);
      setSearchTerm("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importedTokens]);

  useEffect(() => {
    const search = debouncedSearchTerm.toLowerCase().trim();

    // Skip fetching unimported tokens when chainId is not provided (positionsOnly mode)
    if (!filteredTokens.length && isAddress(search) && chainId) {
      fetchTokenInfo(search, chainId).then((res) => {
        setUnImportedTokens(res);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTokens, chainId, debouncedSearchTerm]);

  useEffect(() => {
    const cloneTokensIn = [...tokensIn];
    const cloneAmountsIn = amountsIn.split(",");

    selectedTokens.forEach((token: Token) => {
      if (
        !cloneTokensIn.find(
          (tokenIn: Token) =>
            tokenIn.address.toLowerCase() === token.address.toLowerCase(),
        )
      ) {
        cloneTokensIn.push(token);
        cloneAmountsIn.push("");
      }
    });

    setModalTokensIn(cloneTokensIn);
    setModalAmountsIn(cloneAmountsIn.join(","));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokensIn, amountsIn]);

  return (
    <div className="w-full mx-auto text-white overflow-hidden flex flex-col h-full">
      <div className="space-y-4 flex flex-col flex-1 min-h-0">
        <div className="flex justify-between items-center p-6 pb-0">
          <h2 className="text-xl">
            {title || i18n._("Select Liquidity Source")}
          </h2>
          <div
            className="text-subText hover:text-white cursor-pointer"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </div>
        </div>

        {showUserPositions && onSelectLiquiditySource && !positionsOnly && (
          <div className="border rounded-full p-[2px] flex mx-6 text-sm gap-1 border-icon-200">
            <div
              className={`rounded-full w-full text-center py-2 cursor-pointer hover:bg-[#ffffff33] ${
                modalTabSelected === MODAL_TAB.TOKENS ? "bg-[#ffffff33]" : ""
              }`}
              onClick={() =>
                startTransition(() => setModalTabSelected(MODAL_TAB.TOKENS))
              }
            >
              {i18n._("Token(s)")}
            </div>
            <div
              className={`rounded-full w-full text-center py-2 cursor-pointer hover:bg-[#ffffff33] ${
                modalTabSelected === MODAL_TAB.POSITIONS ? "bg-[#ffffff33]" : ""
              }`}
              onClick={() =>
                startTransition(() => setModalTabSelected(MODAL_TAB.POSITIONS))
              }
            >
              {i18n._("Your Position(s)")}
            </div>
          </div>
        )}

        {mode === TOKEN_SELECT_MODE.SELECT &&
          modalTabSelected === MODAL_TAB.TOKENS && (
            <p className="text-sm text-subText px-6">
              {i18n._("You can search and select")}{" "}
              <span className="text-text">{i18n._("any token(s)")}</span>{" "}
              {i18n._("on KyberSwap")}
            </p>
          )}

        {modalTabSelected === MODAL_TAB.POSITIONS && (
          <p
            className={`text-sm text-subText px-6 ${positionsOnly ? "!-mt-2" : ""}`}
          >
            {i18n._(
              variant === "smart-exit"
                ? "Select the position for setting up Smart Exit."
                : "Use your existing liquidity positions from supported protocols as a source.",
            )}
          </p>
        )}

        <div
          className={`px-6 ${modalTabSelected === MODAL_TAB.POSITIONS ? "!mb-2" : ""}`}
        >
          <div className="relative border-0">
            <Input
              type="text"
              placeholder={i18n._(
                "Search by token name, token symbol or address",
              )}
              className="h-[45px] pl-4 pr-10 py-2 bg-[#0f0f0f] border-[1.5px] border-[#0f0f0f] text-white placeholder-subText rounded-full focus:border-success outline-none"
              value={searchTerm}
              onChange={handleChangeSearch}
            />
            <IconSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-subText h-[18px]" />
          </div>
        </div>

        {mode === TOKEN_SELECT_MODE.ADD &&
          modalTabSelected === MODAL_TAB.TOKENS && (
            <p className="text-sm text-subText px-6">
              {i18n._("The maximum number of tokens selected is {count}.", {
                count: MAX_TOKENS,
              })}
            </p>
          )}

        {modalTabSelected === MODAL_TAB.TOKENS && (
          <TokenFeature
            tabSelected={tabSelected}
            mode={mode}
            selectedTokenAddress={selectedTokenAddress}
            tokensIn={tokensIn}
            setTokensIn={setTokensIn}
            amountsIn={amountsIn}
            setAmountsIn={setAmountsIn}
            setTabSelected={setTabSelected}
            setMessage={setMessage}
            setSelectedTokens={setSelectedTokens}
            onClose={onClose}
          />
        )}

        <div className="token-scroll-container !mt-0 flex-1 min-h-0 flex flex-col">
          {modalTabSelected === MODAL_TAB.TOKENS && (
            <>
              {tabSelected === TOKEN_TAB.ALL &&
                unImportedTokens.map((token: Token, index) => (
                  <div
                    key={`${token.symbol}-${index}`}
                    className="flex items-center justify-between py-2 px-6 text-red"
                  >
                    <div className="flex items-center gap-2">
                      <TokenLogo src={token.logo} size={24} />
                      <TokenSymbol
                        className="ml-2 text-subText"
                        symbol={token.symbol}
                        maxWidth={120}
                      />
                      <p className="text-xs text-[#6C7284]">{token.name}</p>
                    </div>
                    <Button
                      className="rounded-full !bg-accent font-normal !text-[#222222] px-3 py-[6px] h-fit hover:brightness-75"
                      onClick={() => handleImportToken(token)}
                    >
                      {i18n._("Import")}
                    </Button>
                  </div>
                ))}

              {isLoading || isPending ? (
                <TokenLoader />
              ) : filteredTokens?.length > 0 && !unImportedTokens.length ? (
                <div className="flex-1 min-h-0">
                  <AutoSizer>
                    {({ height, width }) => (
                      <List
                        height={height}
                        width={width}
                        itemCount={filteredTokens.length}
                        itemSize={TOKEN_ROW_HEIGHT}
                        itemData={tokenListData}
                        overscanCount={5}
                      >
                        {TokenRow}
                      </List>
                    )}
                  </AutoSizer>
                </div>
              ) : !unImportedTokens.length ||
                (tabSelected === TOKEN_TAB.IMPORTED &&
                  !importedTokens.length) ? (
                <div className="text-center text-[#6C7284] font-medium mt-4">
                  {i18n._("No results found.")}
                </div>
              ) : (
                <></>
              )}
            </>
          )}

          {modalTabSelected === MODAL_TAB.POSITIONS &&
            onSelectLiquiditySource && (
              <div className="flex-1 min-h-0">
                <UserPositions
                  search={searchTerm}
                  chainId={chainId}
                  account={account}
                  positionId={positionId}
                  poolAddress={poolAddress}
                  excludePositionIds={excludePositionIds}
                  filterExchanges={filterExchanges}
                  variant={variant}
                  onConnectWallet={onConnectWallet}
                  onSelectLiquiditySource={onSelectLiquiditySource}
                  onClose={onClose}
                  initialSlippage={initialSlippage}
                />
              </div>
            )}
        </div>

        {message && (
          <div
            className={`text-warning bg-warning-200 py-3 px-4 mt-2 text-xs mx-6 rounded-md transition-all ease-in-out duration-300`}
          >
            {message}
          </div>
        )}

        {mode === TOKEN_SELECT_MODE.ADD &&
          modalTabSelected === MODAL_TAB.TOKENS && (
            <div className="flex space-x-4 rounded-lg px-4">
              <Button
                variant="outline"
                className="flex-1 !bg-transparent text-subText border-subText rounded-full hover:text-accent hover:border-accent"
                onClick={onClose}
              >
                {i18n._("Cancel")}
              </Button>
              <Button
                className="flex-1 !bg-accent text-black rounded-full hover:text-black hover:brightness-110"
                disabled={!modalTokensIn.length}
                onClick={handleSaveSelected}
              >
                {i18n._("Save")}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}

const TokenFeature = memo(function TokenFeature({
  tabSelected,
  mode,
  selectedTokenAddress,
  tokensIn,
  setTokensIn,
  amountsIn,
  setAmountsIn,
  setTabSelected,
  setMessage,
  setSelectedTokens,
  onClose,
}: {
  tabSelected: TOKEN_TAB;
  mode: TOKEN_SELECT_MODE;
  selectedTokenAddress?: string;
  tokensIn: Token[];
  setTokensIn?: (tokens: Token[]) => void;
  amountsIn: string;
  setAmountsIn?: (amounts: string) => void;
  setTabSelected: (tab: TOKEN_TAB) => void;
  setMessage: (message: string) => void;
  setSelectedTokens: (tokens: Token[]) => void;
  onClose: () => void;
}) {
  const { i18n } = useLingui();
  const { importedTokens, removeAllImportedTokens } = useTokenState();

  const handleRemoveAllImportedToken = () => {
    if (
      tokensIn.find((tokenIn: Token) =>
        importedTokens.find(
          (importedToken) => tokenIn.address === importedToken.address,
        ),
      )
    ) {
      if (tokensIn.length === 1) {
        setMessage(
          i18n._(
            "You cannot remove the only selected token, please select another token first.",
          ),
        );
        return;
      }

      if (setTokensIn && setAmountsIn) {
        const clonedTokensIn: (Token | null)[] = [...tokensIn];
        const listAmountsIn: (string | null)[] = amountsIn.split(",");

        for (let i = 0; i < clonedTokensIn.length; i++) {
          if (
            importedTokens.find(
              (importedToken) =>
                importedToken.address === clonedTokensIn[i]?.address,
            )
          ) {
            clonedTokensIn[i] = null;
            listAmountsIn[i] = null;
          }
        }

        const removedTokensIn = clonedTokensIn.filter(
          (token) => token !== null,
        );
        const removedAmountsIn = listAmountsIn.filter(
          (amount) => amount !== null,
        );
        setTokensIn(removedTokensIn as Token[]);
        setAmountsIn(removedAmountsIn.join(","));

        setSelectedTokens(removedTokensIn as Token[]);

        const needClose =
          mode === TOKEN_SELECT_MODE.SELECT &&
          importedTokens.find(
            (importedToken) => importedToken.address === selectedTokenAddress,
          );
        removeAllImportedTokens();

        if (needClose) onClose();
      }

      return;
    }

    removeAllImportedTokens();
  };

  return (
    <>
      <div className="px-6 pb-3 flex gap-4 border-b border-[#505050]">
        <div
          className={`text-sm cursor-pointer ${tabSelected === TOKEN_TAB.ALL ? "text-accent" : ""}`}
          onClick={() => setTabSelected(TOKEN_TAB.ALL)}
        >
          {i18n._("All")}
        </div>
        <div
          className={`text-sm cursor-pointer ${tabSelected === TOKEN_TAB.IMPORTED ? "text-accent" : ""}`}
          onClick={() => setTabSelected(TOKEN_TAB.IMPORTED)}
        >
          {i18n._("Imported")}
        </div>
      </div>

      {tabSelected === TOKEN_TAB.IMPORTED && importedTokens.length ? (
        <div className="flex items-center justify-between px-6 !mt-0 py-[10px]">
          <span className="text-xs text-icon">
            {i18n._("{count} Custom Tokens", { count: importedTokens.length })}
          </span>
          <Button
            className="rounded-full !text-icon flex items-center gap-2 text-xs px-[10px] py-[5px] h-fit font-normal !bg-[#a9a9a933]"
            onClick={handleRemoveAllImportedToken}
          >
            <TrashIcon className="w-[13px] h-[13px]" />
            {i18n._("Clear All")}
          </Button>
        </div>
      ) : null}
    </>
  );
});
