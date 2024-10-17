import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { useWeb3Provider } from "@/hooks/useProvider";
import { useTokenList } from "@/hooks/useTokenList";
import { ZapRouteDetail, Type } from "@/hooks/types/zapInTypes";
import useMarketPrice from "@/hooks/useMarketPrice";
import useDebounce from "@/hooks/useDebounce";
import useTokenBalances from "@/hooks/useTokenBalances";

import { formatUnits, parseUnits } from "ethers/lib/utils";
import { BigNumber } from "ethers";
import { Price, tickToPrice, Token } from "@/entities/Pool";
import {
  NATIVE_TOKEN_ADDRESS,
  NetworkInfo,
  PATHS,
  chainIdToChain,
} from "@/constants";
import { formatWei } from "@/utils";

const ERROR_MESSAGE = {
  CONNECT_WALLET: "Please connect wallet",
  WRONG_NETWORK: "Wrong network",
  SELECT_TOKEN_IN: "Select token in",
  ENTER_MIN_PRICE: "Enter min price",
  ENTER_MAX_PRICE: "Enter max price",
  INVALID_PRICE_RANGE: "Invalid price range",
  ENTER_AMOUNT: "Enter amount for",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  INVALID_INPUT_AMOUNTT: "Invalid input amount",
};

const ZapContext = createContext<{
  revertPrice: boolean;
  tickLower: number | null;
  tickUpper: number | null;
  tokensIn: Token[];
  amountsIn: string;
  setTokensIn: (value: Token[]) => void;
  setAmountsIn: (value: string) => void;
  toggleRevertPrice: () => void;
  setTick: (type: Type, value: number) => void;
  error: string;
  zapInfo: ZapRouteDetail | null;
  loading: boolean;
  priceLower: Price | null;
  priceUpper: Price | null;
  slippage: number;
  setSlippage: (val: number) => void;
  ttl: number;
  setTtl: (val: number) => void;
  toggleSetting: () => void;
  setShowSeting: (val: boolean) => void;
  showSetting: boolean;
  degenMode: boolean;
  setDegenMode: (val: boolean) => void;
  positionId?: string;
  marketPrice: number | undefined | null;
  source: string;
  balanceTokens: {
    [key: string]: BigNumber;
  };
  tokensInUsdPrice: number[];
  token0Price: number;
  token1Price: number;
}>({
  revertPrice: false,
  tickLower: null,
  tickUpper: null,
  tokensIn: [],
  setTokensIn: () => {},
  amountsIn: "",
  setAmountsIn: () => {},
  toggleRevertPrice: () => {},
  setTick: () => {},
  error: "",
  zapInfo: null,
  loading: false,
  priceLower: null,
  priceUpper: null,
  slippage: 10,
  setSlippage: () => {},
  ttl: 20, // 20min
  setTtl: () => {},
  toggleSetting: () => {},
  setShowSeting: () => {},
  showSetting: false,
  degenMode: false,
  setDegenMode: () => {},
  marketPrice: undefined,
  source: "",
  balanceTokens: {},
  tokensInUsdPrice: [],
  token0Price: 0,
  token1Price: 0,
});

export const ZapContextProvider = ({
  children,
  source,
  excludedSources,
  includedSources,
  initDepositTokens,
  initAmounts,
}: {
  children: ReactNode;
  source: string;
  includedSources?: string;
  excludedSources?: string;
  initDepositTokens?: string;
  initAmounts?: string;
}) => {
  const {
    pool,
    poolType,
    poolAddress,
    position,
    positionId,
    feePcm,
    feeAddress,
  } = useWidgetInfo();
  const { chainId, account, networkChainId } = useWeb3Provider();
  const { allTokens } = useTokenList();
  const { balances } = useTokenBalances(allTokens.map((item) => item.address));

  const [showSetting, setShowSeting] = useState(false);
  const [slippage, setSlippage] = useState(10);
  const [ttl, setTtl] = useState(20);
  const [revertPrice, setRevertPrice] = useState(false);
  const [tickLower, setTickLower] = useState<number | null>(
    position?.tickLower ?? null
  );
  const [tickUpper, setTickUpper] = useState<number | null>(
    position?.tickUpper ?? null
  );
  const [tokensIn, setTokensIn] = useState<Token[]>([]);
  const [amountsIn, setAmountsIn] = useState<string>("");
  const [zapInfo, setZapInfo] = useState<ZapRouteDetail | null>(null);
  const [zapApiError, setZapApiError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [degenMode, setDegenMode] = useState(false);

  const debounceTickLower = useDebounce(tickLower, 300);
  const debounceTickUpper = useDebounce(tickUpper, 300);
  const debounceAmountsIn = useDebounce(amountsIn, 300);

  const tokensInUsdPrice = useMarketPrice(
    tokensIn
      .map((token) =>
        token.address.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? token.address
          : NetworkInfo[chainId].wrappedToken.address
      )
      ?.join(",")
  );
  const token0Price = useMarketPrice(pool?.token0.address || "")?.[0];
  const token1Price = useMarketPrice(pool?.token1.address || "")?.[0];

  const marketPrice = useMemo(() => {
    return token0Price && token1Price ? token0Price / token1Price : undefined;
  }, [token0Price, token1Price]);

  const nativeToken = useMemo(
    () => ({
      chainId,
      address: NATIVE_TOKEN_ADDRESS,
      decimals: NetworkInfo[chainId].wrappedToken.decimals,
      symbol: NetworkInfo[chainId].wrappedToken.symbol.slice(1),
      logoURI: NetworkInfo[chainId].nativeLogo,
    }),
    [chainId]
  );

  const priceLower = useMemo(() => {
    if (!pool || tickLower == null) return null;
    return tickToPrice(poolType, pool.token0, pool.token1, tickLower) as Price;
  }, [pool, tickLower, poolType]);

  const priceUpper = useMemo(() => {
    if (!pool || tickUpper === null) return null;
    return tickToPrice(poolType, pool.token0, pool.token1, tickUpper) as Price;
  }, [pool, tickUpper, poolType]);

  const error = useMemo(() => {
    if (!account) return ERROR_MESSAGE.CONNECT_WALLET;
    if (chainId !== networkChainId) return ERROR_MESSAGE.WRONG_NETWORK;

    if (!tokensIn.length) return ERROR_MESSAGE.SELECT_TOKEN_IN;
    if (tickLower === null) return ERROR_MESSAGE.ENTER_MIN_PRICE;
    if (tickUpper === null) return ERROR_MESSAGE.ENTER_MAX_PRICE;

    if (tickLower >= tickUpper) return ERROR_MESSAGE.INVALID_PRICE_RANGE;

    const listAmountsIn = debounceAmountsIn.split(",");
    const listTokenEmptyAmount = tokensIn.filter(
      (_, index) =>
        !listAmountsIn[index] ||
        listAmountsIn[index] === "0" ||
        !parseFloat(listAmountsIn[index])
    );
    if (listTokenEmptyAmount.length)
      return (
        ERROR_MESSAGE.ENTER_AMOUNT +
        " " +
        listTokenEmptyAmount.map((token: Token) => token.symbol).join(", ")
      );

    try {
      for (let i = 0; i < tokensIn.length; i++) {
        const balance = formatUnits(
          balances[
            tokensIn[i]?.address === NATIVE_TOKEN_ADDRESS ||
            tokensIn[i]?.address === NATIVE_TOKEN_ADDRESS.toLowerCase()
              ? NATIVE_TOKEN_ADDRESS
              : tokensIn[i]?.address.toLowerCase()
          ]?.toString() || "0",
          tokensIn[i].decimals
        );

        if (parseFloat(listAmountsIn[i]) > parseFloat(balance))
          return ERROR_MESSAGE.INSUFFICIENT_BALANCE;
      }
    } catch (e) {
      return ERROR_MESSAGE.INVALID_INPUT_AMOUNTT;
    }

    if (zapApiError) return zapApiError;
    return "";
  }, [
    account,
    chainId,
    networkChainId,
    tokensIn,
    debounceAmountsIn,
    tickLower,
    tickUpper,
    zapApiError,
    balances,
  ]);

  const setTick = useCallback(
    (type: Type, value: number) => {
      if (
        position ||
        (pool && (value > pool.maxTick || value < pool.minTick))
      ) {
        return;
      }

      if (type === Type.PriceLower) {
        if (revertPrice) setTickUpper(value);
        else setTickLower(value);
      } else {
        if (revertPrice) setTickLower(value);
        else setTickUpper(value);
      }
    },
    [position, pool, revertPrice]
  );

  const toggleRevertPrice = useCallback(() => {
    setRevertPrice((prev) => !prev);
  }, []);

  const toggleSetting = () => {
    setShowSeting((prev) => !prev);
  };

  useEffect(() => {
    if (position?.tickUpper !== undefined && position.tickLower !== undefined) {
      setTickLower(position.tickLower);
      setTickUpper(position.tickUpper);
    }
  }, [position?.tickUpper, position?.tickLower]);

  // set init tokens in
  useEffect(() => {
    if (!pool || tokensIn.length) return;

    // with params
    if (initDepositTokens && allTokens.length) {
      const listInitTokens = initDepositTokens
        .split(",")
        .map((address: string) =>
          allTokens.find(
            (token: Token) =>
              token.address.toLowerCase() === address.toLowerCase()
          )
        )
        .filter((item) => !!item);
      const listInitAmounts = initAmounts?.split(",") || [];
      const parseListAmountsIn: string[] = [];

      if (listInitTokens.length) {
        listInitTokens.forEach((_: Token | undefined, index: number) => {
          parseListAmountsIn.push(listInitAmounts[index] || "");
        });
        setTokensIn(listInitTokens as Token[]);
        setAmountsIn(parseListAmountsIn.join(","));
      }

      return;
    }

    // without wallet connect
    if (!account) {
      const isToken0Native =
        pool?.token0.address.toLowerCase() ===
        NetworkInfo[chainId].wrappedToken.address.toLowerCase();

      const token0 = isToken0Native ? nativeToken : pool.token0;

      setTokensIn([token0]);
    }

    // with balance compare
    if (
      !initDepositTokens &&
      token0Price &&
      token1Price &&
      Object.keys(balances).length
    ) {
      const isToken0Native =
        pool?.token0.address.toLowerCase() ===
        NetworkInfo[chainId].wrappedToken.address.toLowerCase();
      const isToken1Native =
        pool?.token1.address.toLowerCase() ===
        NetworkInfo[chainId].wrappedToken.address.toLowerCase();

      const token0 = isToken0Native ? nativeToken : pool.token0;
      const token1 = isToken1Native ? nativeToken : pool.token1;

      const token0Balance = formatWei(
        balances[
          isToken0Native
            ? NATIVE_TOKEN_ADDRESS
            : pool.token0.address.toLowerCase()
        ]?.toString() || "0",
        token0.decimals
      );
      const token1Balance = formatWei(
        balances[
          isToken1Native
            ? NATIVE_TOKEN_ADDRESS
            : pool.token1.address.toLowerCase()
        ]?.toString() || "0",
        token1.decimals
      );

      setTokensIn([
        token0Price * parseFloat(token0Balance) >=
        token1Price * parseFloat(token1Balance)
          ? token0
          : token1,
      ]);
    }
  }, [
    pool,
    tokensIn,
    nativeToken,
    chainId,
    token0Price,
    token1Price,
    balances,
    initDepositTokens,
    allTokens,
    initAmounts,
    account,
  ]);

  // Get zap route
  useEffect(() => {
    if (
      debounceTickLower !== null &&
      debounceTickUpper !== null &&
      pool &&
      (!error ||
        error === zapApiError ||
        error === ERROR_MESSAGE.INSUFFICIENT_BALANCE ||
        error === ERROR_MESSAGE.CONNECT_WALLET)
    ) {
      let formattedTokensIn = "";
      let formattedAmountsInWeis = "";
      const listAmountsIn = amountsIn.split(",");

      try {
        formattedTokensIn = tokensIn
          .map((token: Token) => token.address)
          .join(",");

        formattedAmountsInWeis = tokensIn
          .map((token: Token, index: number) =>
            parseUnits(listAmountsIn[index] || "0", token.decimals).toString()
          )
          .join(",");
      } catch (error) {
        console.log(error);
      }

      if (
        !formattedTokensIn ||
        !formattedAmountsInWeis ||
        !formattedAmountsInWeis.length ||
        !formattedAmountsInWeis[0] ||
        formattedAmountsInWeis[0] === "0"
      ) {
        setZapInfo(null);
        return;
      }

      setLoading(true);
      const params: { [key: string]: string | number | boolean } = {
        dex: poolType,
        "pool.id": poolAddress,
        "pool.token0": pool.token0.address,
        "pool.token1": pool.token1.address,
        "pool.fee": pool.fee,
        "position.tickUpper": debounceTickUpper,
        "position.tickLower": debounceTickLower,
        tokensIn: formattedTokensIn,
        amountsIn: formattedAmountsInWeis,
        slippage,
        "aggregatorOptions.disable": false,
        ...(positionId ? { "position.id": positionId } : {}),
        ...(feeAddress ? { feeAddress, feePcm } : {}),
        ...(includedSources
          ? { "aggregatorOptions.includedSources": includedSources }
          : {}),
        ...(excludedSources
          ? { "aggregatorOptions.excludedSources": excludedSources }
          : {}),
      };

      let tmp = "";
      Object.keys(params).forEach((key) => {
        tmp = `${tmp}&${key}=${params[key]}`;
      });

      fetch(
        `${PATHS.ZAP_API}/${
          chainIdToChain[chainId]
        }/api/v1/in/route?${tmp.slice(1)}`,
        {
          headers: {
            "X-Client-Id": source,
          },
        }
      )
        .then((res) => res.json())
        .then((res) => {
          if (res.data) {
            setZapApiError("");
            setZapInfo(res.data);
          } else {
            setZapInfo(null);
            setZapApiError(res.message || "Something went wrong");
          }
        })
        .catch((e) => {
          // setZapInfo(null);
          setZapApiError(e.message || "Something went wrong");
        })
        .finally(() => {
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chainId,
    poolType,
    debounceTickLower,
    debounceTickUpper,
    feeAddress,
    feePcm,
    poolAddress,
    pool,
    slippage,
    positionId,
    includedSources,
    excludedSources,
    source,
    tokensIn,
    debounceAmountsIn,
    error,
    zapApiError,
  ]);

  return (
    <ZapContext.Provider
      value={{
        revertPrice,
        tickLower,
        tickUpper,
        tokensIn,
        setTokensIn,
        amountsIn,
        setAmountsIn,
        toggleRevertPrice,
        setTick,
        error,
        zapInfo,
        loading,
        priceLower,
        priceUpper,
        slippage,
        setSlippage,
        ttl,
        setTtl,
        toggleSetting,
        setShowSeting,
        showSetting,
        positionId,
        degenMode,
        setDegenMode,
        marketPrice,
        source,
        balanceTokens: balances,
        tokensInUsdPrice,
        token0Price,
        token1Price,
      }}
    >
      {children}
    </ZapContext.Provider>
  );
};

export const useZapState = () => {
  const context = useContext(ZapContext);
  if (context === undefined) {
    throw new Error("useZapState must be used within a ZapContextProvider");
  }
  return context;
};
