import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { formatUnits, parseUnits } from "viem";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { useWeb3Provider } from "@/hooks/useProvider";
import { useTokens } from "@/hooks/useTokens";
import useMarketPrice from "@/hooks/useMarketPrice";
import useTokenBalance from "@/hooks/useTokenBalance";
import { Price, Token } from "@pancakeswap/sdk";
import { tickToPrice } from "@pancakeswap/v3-sdk";
import { useDebounce } from "@kyber/hooks/use-debounce";
import { chainIdToChain, NATIVE_TOKEN_ADDRESS, NetworkInfo } from "@/constants";
import { ZapRouteDetail, Type, PancakeTokenAdvanced } from "@/types/zapInTypes";
import { useTokenPrices } from "@kyber/hooks/use-token-prices";

export const ZAP_URL = "https://zap-api.kyberswap.com";

const ERROR_MESSAGE = {
  WRONG_NETWORK: "Wrong network",
  SELECT_TOKEN_IN: "Select token in",
  INVALID_TOKENS_AND_AMOUNTS:
    "Number of init tokens and amounts must be the same",
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
  tokensIn: PancakeTokenAdvanced[];
  amountsIn: string;
  setAmountsIn: (value: string) => void;
  toggleRevertPrice: () => void;
  setTick: (type: Type, value: number) => void;
  error: string;
  zapInfo: ZapRouteDetail | null;
  loading: boolean;
  priceLower: Price<Token, Token> | null;
  priceUpper: Price<Token, Token> | null;
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
}>({
  revertPrice: false,
  tickLower: null,
  tickUpper: null,
  tokensIn: [],
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
});

export const ZapContextProvider = ({
  children,
  source,
  excludedSources,
  includedSources,
  initTickLower,
  initTickUpper,
  initDepositTokens,
  initAmounts,
}: {
  children: ReactNode;
  source: string;
  includedSources?: string;
  excludedSources?: string;
  initTickLower?: number;
  initTickUpper?: number;
  initDepositTokens: string;
  initAmounts: string;
}) => {
  const {
    pool,
    poolAddress,
    position,
    positionId,
    feePcm,
    feeAddress,
    onAddTokens,
  } = useWidgetInfo();
  const { chainId, networkChainId } = useWeb3Provider();
  const { getToken } = useTokens();

  // Setting
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
  const [tokensIn, setTokensIn] = useState<PancakeTokenAdvanced[]>([]);
  const [amountsIn, setAmountsIn] = useState(initAmounts);
  const [zapInfo, setZapInfo] = useState<ZapRouteDetail | null>(null);
  const [zapApiError, setZapApiError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [degenMode, setDegenMode] = useState(false);
  const [marketPrice, setMarketPrice] = useState<number | null | undefined>(
    undefined
  );

  const debounceTickLower = useDebounce(tickLower, 300);
  const debounceTickUpper = useDebounce(tickUpper, 300);
  const debounceAmountsIn = useDebounce(amountsIn, 300);

  const prices = useMarketPrice({ tokens: tokensIn });

  useEffect(() => {
    if (prices.length) {
      const tokensInClone = [...tokensIn];
      tokensInClone.forEach((token) => {
        const address =
          token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
            ? NetworkInfo[chainId].wrappedToken.address.toLowerCase()
            : token.address.toLowerCase();

        const price = prices.find(
          (price) => price.address.toLowerCase() === address
        );
        token.price = price?.price;
      });
      setTokensIn(tokensInClone);
    }
  }, [prices, chainId]);

  const balances = useTokenBalance({ tokens: tokensIn });

  useEffect(() => {
    if (balances.length) {
      const tokensInClone = [...tokensIn];
      tokensInClone.forEach((token) => {
        const balance = balances.find(
          (balance) => balance.address === token.address
        );
        token.balance = balance?.balance;
      });
      setTokensIn(tokensInClone);
    }
  }, [balances]);

  const toggleSetting = () => setShowSeting((prev) => !prev);

  const toggleRevertPrice = useCallback(
    () => setRevertPrice((prev) => !prev),
    []
  );

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

  const tokensInAddress = useMemo(
    () => tokensIn.map((token) => token.address?.toLowerCase()).join(","),
    [tokensIn]
  );

  const priceLower = useMemo(() => {
    if (!pool || tickLower == null) return null;
    return tickToPrice(pool.token0, pool.token1, tickLower) as Price<
      Token,
      Token
    >;
  }, [pool, tickLower]);

  const priceUpper = useMemo(() => {
    if (!pool || tickUpper === null) return null;
    return tickToPrice(pool.token0, pool.token1, tickUpper) as Price<
      Token,
      Token
    >;
  }, [pool, tickUpper]);

  const error = useMemo(() => {
    const initDepositTokenAddresses = initDepositTokens?.split(",") || [];
    const listInitAmounts = initAmounts?.split(",") || [];
    if (initDepositTokenAddresses.length !== listInitAmounts.length)
      return ERROR_MESSAGE.INVALID_TOKENS_AND_AMOUNTS;
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
          BigInt(tokensIn[i].balance?.toString() || "0"),
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
    initDepositTokens,
    initAmounts,
    chainId,
    networkChainId,
    tokensIn,
    tickLower,
    tickUpper,
    debounceAmountsIn,
    zapApiError,
  ]);

  useEffect(() => {
    if (position?.tickUpper !== undefined && position.tickLower !== undefined) {
      setTickLower(position.tickLower);
      setTickUpper(position.tickUpper);
    }
  }, [position?.tickUpper, position?.tickLower]);

  useEffect(() => {
    if (!pool) return;
    if (
      initTickLower !== undefined &&
      initTickLower % pool.tickSpacing === 0 &&
      !tickLower
    ) {
      setTickLower(initTickLower);
    }

    if (
      initTickUpper !== undefined &&
      initTickUpper % pool.tickSpacing === 0 &&
      !tickUpper
    ) {
      setTickUpper(initTickUpper);
    }
  }, [pool, initTickUpper, initTickLower, tickLower, tickUpper]);

  // set tokens in
  useEffect(() => {
    if (!pool) return;

    if (tokensInAddress.toLowerCase() === initDepositTokens.toLowerCase()) {
      if (!initDepositTokens)
        onAddTokens(`${pool.token0.address},${pool.token1.address}`);
      return;
    }

    const initDepositTokenAddresses = initDepositTokens?.split(",") || [];

    (async () => {
      if (initDepositTokens) {
        const listInitTokens = await Promise.all(
          initDepositTokenAddresses.map(async (address: string) => {
            const token = await getToken(address);
            return token;
          })
        ).then(
          (tokens) => tokens.filter((item) => !!item) as PancakeTokenAdvanced[]
        );

        console.log("set tokens in");
        setTokensIn(listInitTokens);
      }
    })();
  }, [
    getToken,
    initAmounts,
    initDepositTokens,
    onAddTokens,
    pool,
    tokensInAddress,
  ]);

  // set amounts in
  useEffect(() => {
    setAmountsIn(initAmounts);
  }, [initAmounts]);

  const { fetchPrices } = useTokenPrices({ addresses: [], chainId });
  // get pair market price
  useEffect(() => {
    if (!pool) return;

    fetchPrices([
      pool.token0.address.toLowerCase(),
      pool.token1.address.toLowerCase(),
    ]).then((prices) => {
      const price0 = prices?.[pool.token0.address.toLowerCase()].PriceBuy || 0;
      const price1 = prices?.[pool.token1.address.toLowerCase()].PriceBuy || 0;
      if (price0 && price1) setMarketPrice(price0 / price1);
      else setMarketPrice(null);
    });
  }, [chainId, pool]);

  // get zap route
  useEffect(() => {
    if (
      debounceTickLower !== null &&
      debounceTickUpper !== null &&
      pool &&
      (!error ||
        error === zapApiError ||
        error === ERROR_MESSAGE.INSUFFICIENT_BALANCE ||
        error === ERROR_MESSAGE.WRONG_NETWORK)
    ) {
      let formattedAmountsInWeis = "";
      const listAmountsIn = amountsIn.split(",");

      try {
        formattedAmountsInWeis = tokensIn
          .map((token: Token, index: number) =>
            parseUnits(listAmountsIn[index] || "0", token.decimals).toString()
          )
          .join(",");
      } catch (error) {
        console.log(error);
      }

      if (
        !tokensInAddress ||
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
        dex: "DEX_PANCAKESWAPV3",
        "pool.id": poolAddress,
        "pool.token0": pool.token0.address,
        "pool.token1": pool.token1.address,
        "pool.fee": pool.fee,
        "position.tickUpper": debounceTickUpper,
        "position.tickLower": debounceTickLower,
        tokensIn: tokensInAddress,
        amountsIn: formattedAmountsInWeis,
        slippage,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chainId,
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
    tokensInAddress,
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
