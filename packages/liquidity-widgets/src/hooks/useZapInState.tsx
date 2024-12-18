import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTokenList } from "@/hooks/useTokenList";
import { ZapRouteDetail } from "@/hooks/types/zapInTypes";
import useMarketPrice from "@/hooks/useMarketPrice";
import useDebounce from "@/hooks/useDebounce";
import useTokenBalances from "@/hooks/useTokenBalances";

import {
  NATIVE_TOKEN_ADDRESS,
  NetworkInfo,
  PATHS,
  ZERO_ADDRESS,
  chainIdToChain,
} from "@/constants";
import { assertUnreachable, formatWei } from "@/utils";
import {
  Token,
  univ2PoolNormalize,
  univ3PoolNormalize,
  univ3PoolType,
  univ3Position,
} from "@/schema";
import { useWidgetContext } from "@/stores/widget";
import { divideBigIntToString, formatDisplayNumber } from "@kyber/utils/number";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import { formatUnits, parseUnits } from "@kyber/utils/crypto";

export const ERROR_MESSAGE = {
  CONNECT_WALLET: "Connect wallet",
  WRONG_NETWORK: "Switch network",
  SELECT_TOKEN_IN: "Select token in",
  ENTER_MIN_PRICE: "Enter min price",
  ENTER_MAX_PRICE: "Enter max price",
  INVALID_PRICE_RANGE: "Invalid price range",
  ENTER_AMOUNT: "Enter amount for",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  INVALID_INPUT_AMOUNTT: "Invalid input amount",
};

const ZapContext = createContext<{
  price: number | null;
  revertPrice: boolean;
  tickLower: number | null;
  tickUpper: number | null;
  tokensIn: Token[];
  amountsIn: string;
  setTokensIn: (value: Token[]) => void;
  setAmountsIn: (value: string) => void;
  toggleRevertPrice: () => void;
  setTickLower: (value: number) => void;
  setTickUpper: (value: number) => void;
  error: string;
  zapInfo: ZapRouteDetail | null;
  loading: boolean;
  slippage: number;
  priceLower: string | null;
  priceUpper: string | null;
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
    [key: string]: bigint;
  };
  tokensInUsdPrice: number[];
  token0Price: number;
  token1Price: number;
}>({
  price: null,
  revertPrice: false,
  tickLower: null,
  tickUpper: null,
  priceLower: null,
  priceUpper: null,
  tokensIn: [],
  setTokensIn: () => {},
  amountsIn: "",
  setAmountsIn: () => {},
  toggleRevertPrice: () => {},
  setTickLower: () => {},
  setTickUpper: () => {},
  error: "",
  zapInfo: null,
  loading: false,
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
    feeConfig,
    chainId,
    connectedAccount,
  } = useWidgetContext((s) => s);
  const { feePcm, feeAddress } = feeConfig || {};
  const account = connectedAccount?.address;

  const networkChainId = connectedAccount?.chainId;
  const { allTokens } = useTokenList();
  const { balances } = useTokenBalances(allTokens.map((item) => item.address));

  const [showSetting, setShowSeting] = useState(false);
  const [slippage, setSlippage] = useState(10);
  const [ttl, setTtl] = useState(20);
  const [revertPrice, setRevertPrice] = useState(false);
  const [tickLower, setTickLower] = useState<number | null>(null);
  const [tickUpper, setTickUpper] = useState<number | null>(null);
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

  const marketPrice = useMemo(() => {
    return pool !== "loading" && pool.token0.price && pool.token1.price
      ? pool.token0.price / pool.token1.price
      : undefined;
  }, [pool]);

  const nativeToken = useMemo(
    () => ({
      address: NATIVE_TOKEN_ADDRESS,
      decimals: NetworkInfo[chainId].wrappedToken.decimals,
      symbol: NetworkInfo[chainId].wrappedToken.symbol.slice(1) || "",
      logo: NetworkInfo[chainId].nativeLogo,
    }),
    [chainId]
  );

  const priceLower = useMemo(() => {
    if (pool === "loading" || tickLower == null) return null;
    return formatDisplayNumber(
      +tickToPrice(
        tickLower,
        pool.token0.decimals,
        pool.token1.decimals,
        false
      ),
      { significantDigits: 8 }
    );
  }, [pool, tickUpper]);

  const priceUpper = useMemo(() => {
    if (pool === "loading" || tickUpper === null) return null;
    return formatDisplayNumber(
      +tickToPrice(
        tickUpper,
        pool.token0.decimals,
        pool.token1.decimals,
        false
      ),
      { significantDigits: 8 }
    );
  }, [pool, tickUpper]);

  const isUniv3Pool = useMemo(
    () => univ3PoolType.safeParse(poolType).success,
    [poolType]
  );

  const error = useMemo(() => {
    if (!account) return ERROR_MESSAGE.CONNECT_WALLET;
    if (chainId !== networkChainId) return ERROR_MESSAGE.WRONG_NETWORK;

    if (!tokensIn.length) return ERROR_MESSAGE.SELECT_TOKEN_IN;
    if (isUniv3Pool) {
      if (tickLower === null) return ERROR_MESSAGE.ENTER_MIN_PRICE;
      if (tickUpper === null) return ERROR_MESSAGE.ENTER_MAX_PRICE;

      if (tickLower >= tickUpper) return ERROR_MESSAGE.INVALID_PRICE_RANGE;
    }

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
    isUniv3Pool,
  ]);

  const toggleRevertPrice = useCallback(() => {
    setRevertPrice((prev) => !prev);
  }, []);

  const toggleSetting = () => {
    setShowSeting((prev) => !prev);
  };

  useEffect(() => {
    if (position !== "loading") {
      const { success, data } = univ3Position.safeParse(position);

      if (
        success &&
        data?.tickUpper !== undefined &&
        data.tickLower !== undefined
      ) {
        setTickLower(data.tickLower);
        setTickUpper(data.tickUpper);
      }
    }
  }, [position]);

  const token0Price = pool !== "loading" ? pool.token0.price || 0 : 0;
  const token1Price = pool !== "loading" ? pool.token1.price || 0 : 0;
  // set init tokens in
  useEffect(() => {
    if (!pool || tokensIn.length) return;

    // with params
    if (initDepositTokens && allTokens.length) {
      const listInitTokens = initDepositTokens
        .split(",")
        .map((address: string) =>
          allTokens.find(
            (token) => token.address.toLowerCase() === address.toLowerCase()
          )
        )
        .filter((item) => !!item);
      const listInitAmounts = initAmounts?.split(",") || [];
      const parseListAmountsIn: string[] = [];

      if (listInitTokens.length) {
        listInitTokens.forEach((_, index: number) => {
          parseListAmountsIn.push(listInitAmounts[index] || "");
        });
        setTokensIn(listInitTokens as Token[]);
        setAmountsIn(parseListAmountsIn.join(","));
      }

      return;
    }

    // without wallet connect
    if (!account && pool !== "loading") {
      const isToken0Native =
        pool.token0.address.toLowerCase() ===
        NetworkInfo[chainId].wrappedToken.address.toLowerCase();

      const token0 = isToken0Native ? nativeToken : pool.token0;

      setTokensIn([token0] as Token[]);
    }

    // with balance compare
    if (
      !initDepositTokens &&
      pool !== "loading" &&
      pool.token0.price &&
      pool.token1.price &&
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
      ] as Token[]);
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
      (isUniv3Pool
        ? debounceTickLower !== null && debounceTickUpper !== null
        : true) &&
      pool !== "loading" &&
      (!error ||
        error === zapApiError ||
        error === ERROR_MESSAGE.INSUFFICIENT_BALANCE ||
        error === ERROR_MESSAGE.CONNECT_WALLET ||
        error === ERROR_MESSAGE.WRONG_NETWORK)
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
        "pool.fee": pool.fee * 10_000,
        ...(isUniv3Pool &&
        debounceTickUpper !== null &&
        debounceTickLower !== null
          ? {
              "position.tickUpper": debounceTickUpper,
              "position.tickLower": debounceTickLower,
            }
          : { "position.id": account || ZERO_ADDRESS }),
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

  const price = useMemo(() => {
    if (pool === "loading") return null;
    const { success, data } = univ3PoolNormalize.safeParse(pool);
    if (success) {
      return +tickToPrice(
        data.tick,
        data.token0.decimals,
        data.token1.decimals,
        revertPrice
      );
    }

    const { success: isUniV2, data: uniV2Pool } =
      univ2PoolNormalize.safeParse(pool);

    if (isUniV2) {
      const p = +divideBigIntToString(
        BigInt(uniV2Pool.reserves[1]) * BigInt(uniV2Pool.token0.decimals),
        BigInt(uniV2Pool.reserves[0]) * BigInt(uniV2Pool.token1.decimals),
        18
      );
      return revertPrice ? 1 / p : p;
    }

    return assertUnreachable(poolType as never, "poolType is not handled");
  }, [pool, revertPrice]);

  return (
    <ZapContext.Provider
      value={{
        price,
        revertPrice,
        tickLower,
        tickUpper,
        tokensIn,
        setTokensIn,
        amountsIn,
        setAmountsIn,
        toggleRevertPrice,
        setTickLower,
        setTickUpper,
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
