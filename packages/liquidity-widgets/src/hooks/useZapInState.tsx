import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useWidgetInfo } from "./useWidgetInfo";
import { useWeb3Provider } from "./useProvider";
import { parseUnits } from "ethers/lib/utils";
import useTokenBalance, { useNativeBalance } from "./useTokenBalance";
import { Price, tickToPrice, Token } from "../entities/Pool";
import { NATIVE_TOKEN_ADDRESS, NetworkInfo } from "../constants";
import { BigNumber } from "ethers";
import useDebounce from "./useDebounce";

export const ZAP_URL = "https://zap-api.kyberswap.com";
// export const ZAP_URL = "https://pre-zap-api.kyberengineering.io";

export interface AddLiquidityAction {
  type: "ACTION_TYPE_ADD_LIQUIDITY";
  addLiquidity: {
    token0: {
      address: string;
      amount: string;
      amountUsd: string;
    };
    token1: {
      address: string;
      amount: string;
      amountUsd: string;
    };
  };
}

export interface AggregatorSwapAction {
  type: "ACTION_TYPE_AGGREGATOR_SWAP";
  aggregatorSwap: {
    swaps: Array<{
      tokenIn: {
        address: string;
        amount: string;
        amountUsd: string;
      };
      tokenOut: {
        address: string;
        amount: string;
        amountUsd: string;
      };
    }>;
  };
}

export interface PoolSwapAction {
  type: "ACTION_TYPE_POOL_SWAP";
  poolSwap: {
    swaps: Array<{
      tokenIn: {
        address: string;
        amount: string;
        amountUsd: string;
      };
      tokenOut: {
        address: string;
        amount: string;
        amountUsd: string;
      };
    }>;
  };
}

export interface RefundAction {
  type: "ACTION_TYPE_REFUND";
  refund: {
    tokens: Array<{
      address: string;
      amount: string;
      amountUsd: string;
    }>;
  };
}
export interface ProtocolFeeAction {
  type: "ACTION_TYPE_PROTOCOL_FEE";
  protocolFee: {
    pcm: number;
    tokens: Array<{
      address: string;
      amount: string;
      amountUsd: string;
    }>;
  };
}

export interface ZapRouteDetail {
  poolDetails: {
    uniswapV3: {
      tick: number;
      newTick: number;
      sqrtP: string;
      newSqrtP: string;
    };
  };
  positionDetails: {
    addedLiquidity: string;
    addedAmountUsd: string;
  };
  zapDetails: {
    initialAmountUsd: string;
    actions: Array<
      | ProtocolFeeAction
      | AggregatorSwapAction
      | PoolSwapAction
      | AddLiquidityAction
      | RefundAction
    >;
    finalAmountUsd: string;
    priceImpact: number;
  };
  route: string;
  routerAddress: string;
  gas: string;
  gasUsd: string;
}

const ZapContext = createContext<{
  revertPrice: boolean;
  tickLower: number | null;
  tickUpper: number | null;
  tokenIn: Token | null;
  amountIn: string;
  toggleTokenIn: () => void;
  balanceIn: string;
  setAmountIn: (value: string) => void;
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
  setEnableAggregator: (val: boolean) => void;
  enableAggregator: boolean;
  degenMode: boolean;
  setDegenMode: (val: boolean) => void;
  positionId?: string;
  marketPrice: number | undefined | null;
  source: string;
}>({
  revertPrice: false,
  tickLower: null,
  tickUpper: null,
  tokenIn: null,
  balanceIn: "0",
  amountIn: "",
  toggleTokenIn: () => {},
  setAmountIn: () => {},
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
  enableAggregator: true,
  setEnableAggregator: () => {},
  degenMode: false,
  setDegenMode: () => {},
  marketPrice: undefined,
  source: "",
});

export const chainIdToChain: { [chainId: number]: string } = {
  1: "ethereum",
  137: "polygon",
  56: "bsc",
  42161: "arbitrum",
};

export enum Type {
  PriceLower = "PriceLower",
  PriceUpper = "PriceUpper",
}

export const ZapContextProvider = ({
  children,
  source,
  excludedSources,
  includedSources,
}: {
  children: ReactNode;
  source: string;
  includedSources?: string;
  excludedSources?: string;
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

  // Setting
  const [showSetting, setShowSeting] = useState(false);
  const [slippage, setSlippage] = useState(10);
  const [ttl, setTtl] = useState(20);
  const [enableAggregator, setEnableAggregator] = useState(true);

  const toggleSetting = () => {
    setShowSeting((prev) => !prev);
  };

  const [revertPrice, setRevertPrice] = useState(false);
  const [tickLower, setTickLower] = useState<number | null>(
    position?.tickLower ?? null
  );
  const [tickUpper, setTickUpper] = useState<number | null>(
    position?.tickUpper ?? null
  );

  useEffect(() => {
    console.log("Tick:", {
      tickLower,
      tickUpper,
      tickCurrent: pool?.tickCurrent,
    });
  }, [tickLower, tickUpper, pool?.tickCurrent]);

  useEffect(() => {
    if (position?.tickUpper !== undefined && position.tickLower !== undefined) {
      setTickLower(position.tickLower);
      setTickUpper(position.tickUpper);
    }
  }, [position?.tickUpper, position?.tickLower]);

  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [amountIn, setAmountIn] = useState("");
  const [zapInfo, setZapInfo] = useState<ZapRouteDetail | null>(null);
  const [zapApiError, setZapApiError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [degenMode, setDegenMode] = useState(false);

  const debounceTickLower = useDebounce(tickLower, 300);
  const debounceTickUpper = useDebounce(tickUpper, 300);
  const debounceAmountIn = useDebounce(amountIn, 300);

  const toggleRevertPrice = useCallback(() => {
    setRevertPrice((prev) => !prev);
  }, []);

  const { balance: balanceToken0 } = useTokenBalance(
    pool?.token0?.address || ""
  );
  const { balance: balanceToken1 } = useTokenBalance(
    pool?.token1?.address || ""
  );

  const nativeBalance = useNativeBalance();

  const balanceIn = useMemo(() => {
    if (tokenIn?.address === NATIVE_TOKEN_ADDRESS) return nativeBalance;
    if (pool?.token0.address === tokenIn?.address) return balanceToken0;
    return balanceToken1;
  }, [
    balanceToken0,
    balanceToken1,
    pool?.token0.address,
    tokenIn?.address,
    nativeBalance,
  ]);

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

  const isToken0Native =
    pool?.token0.address.toLowerCase() ===
    NetworkInfo[chainId].wrappedToken.address.toLowerCase();
  const isToken1Native =
    pool?.token1.address.toLowerCase() ===
    NetworkInfo[chainId].wrappedToken.address.toLowerCase();

  //native => wrapped => other
  const toggleTokenIn = () => {
    if (!pool) return;
    // tokenIn is native
    if (tokenIn?.address === NATIVE_TOKEN_ADDRESS) {
      setTokenIn(isToken0Native ? pool.token0 : pool.token1);
    } else if (tokenIn?.address === pool.token0.address) {
      // token1: native
      // selected: token0
      if (isToken1Native) setTokenIn(nativeToken);
      else setTokenIn(pool.token1);
    } else {
      // selected: token1
      // token0: native
      if (isToken0Native) setTokenIn(nativeToken);
      else setTokenIn(pool.token0);
    }
  };

  useEffect(() => {
    if (pool && !tokenIn)
      setTokenIn(isToken0Native ? nativeToken : pool.token0);
  }, [pool, tokenIn, nativeToken, isToken0Native]);

  const setTick = useCallback(
    (type: Type, value: number) => {
      if (pool && (value > pool.maxTick || value < pool.minTick)) {
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
    [revertPrice, pool]
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
    if (!account) return "Please connect wallet";
    if (chainId !== networkChainId) return "Wrong network";

    if (!tokenIn) return "Select token in";
    if (tickLower === null) return "Enter min price";
    if (tickUpper === null) return "Enter max price";

    if (tickLower >= tickUpper) return "Invalid price range";

    if (!amountIn || +amountIn === 0) return "Enter an amount";
    try {
      const amountInWei = parseUnits(amountIn, tokenIn.decimals);
      if (amountInWei.gt(BigNumber.from(balanceIn)))
        return "Insufficient balance";
    } catch (e) {
      return "Invalid input amount";
    }

    if (zapApiError) return zapApiError;
    return "";
  }, [
    tokenIn,
    tickLower,
    tickUpper,
    amountIn,
    account,
    zapApiError,
    balanceIn,
    networkChainId,
    chainId,
  ]);

  const [marketPrice, setMarketPrice] = useState<number | null | undefined>(
    undefined
  );

  useEffect(() => {
    if (!pool) return;
    const priceUrl = "https://price.kyberswap.com";
    fetch(
      `${priceUrl}/${chainIdToChain[chainId]}/api/v1/prices?ids=${pool.token0.address},${pool.token1.address}`
    )
      .then((res) => res.json())
      .then((res) => {
        const token0Price = res.data.prices.find(
          (item: { address: string; price: number; marketPrice: number }) =>
            item.address.toLowerCase() === pool.token0.address.toLowerCase()
        );
        const token1Price = res.data.prices.find(
          (item: { address: string; price: number; marketPrice: number }) =>
            item.address.toLowerCase() === pool.token1.address.toLowerCase()
        );
        const price0 = token0Price?.marketPrice || token0Price?.price || 0;
        const price1 = token1Price?.marketPrice || token1Price?.price || 0;
        if (price0 && price1) setMarketPrice(price0 / price1);
        else setMarketPrice(null);
      });
  }, [chainId, pool]);

  useEffect(() => {
    if (
      debounceTickLower !== null &&
      debounceTickUpper !== null &&
      debounceAmountIn &&
      pool &&
      tokenIn?.address
    ) {
      let amountInWei = "";
      try {
        amountInWei = parseUnits(debounceAmountIn, tokenIn.decimals).toString();
      } catch (error) {
        console.log(error);
      }
      if (!amountInWei) {
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
        tokenIn: tokenIn.address,
        amountIn: amountInWei,
        slippage,
        "aggregatorOptions.disable": !enableAggregator,
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
        `${ZAP_URL}/${chainIdToChain[chainId]}/api/v1/in/route?${tmp.slice(1)}`,
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
          setZapInfo(null);
          setZapApiError(e.message || "Something went wrong");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [
    debounceAmountIn,
    chainId,
    poolType,
    debounceTickLower,
    debounceTickUpper,
    feeAddress,
    feePcm,
    tokenIn?.address,
    poolAddress,
    pool,
    tokenIn?.decimals,
    enableAggregator,
    slippage,
    positionId,
    includedSources,
    excludedSources,
    source,
  ]);

  return (
    <ZapContext.Provider
      value={{
        revertPrice,
        tickLower,
        tickUpper,
        tokenIn,
        balanceIn,
        amountIn,
        toggleTokenIn,
        setAmountIn,
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
        enableAggregator,
        setEnableAggregator,
        positionId,
        degenMode,
        setDegenMode,
        marketPrice,
        source,
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
