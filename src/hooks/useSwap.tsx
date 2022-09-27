import { parseUnits } from "@ethersproject/units";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import { NATIVE_TOKEN_ADDRESS, ZERO_ADDRESS } from "../constants";
import useTokenBalances from "./useTokenBalances";
import { useTokens } from "./useTokens";
import { useActiveWeb3 } from "./useWeb3Provider";

const getPath = (chainId: number) => {
  switch (chainId) {
    case 1:
      return "ethereum";
    case 137:
      return "polygon";
    default:
      return "ethereum";
  }
};
const useSwap = () => {
  const { provider, chainId } = useActiveWeb3();
  const [tokenIn, setTokenIn] = useState(NATIVE_TOKEN_ADDRESS);
  const [tokenOut, setTokenOut] = useState("");
  const tokens = useTokens();

  const { balances } = useTokenBalances(tokens.map((item) => item.address));

  const [inputAmout, setInputAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [trade, setTrade] = useState<any>(null);
  const [error, setError] = useState("");
  const [slippage, setSlippage] = useState(50);

  const controllerRef = useRef<AbortController | null>();

  const getRate = useCallback(async () => {
    const listAccounts = await provider?.listAccounts();
    const account = listAccounts?.[0];

    const date = new Date();
    date.setMinutes(date.getMinutes() + 20);

    const tokenInDecimal =
      tokenIn === NATIVE_TOKEN_ADDRESS
        ? 18
        : tokens.find((token) => token.address === tokenIn)?.decimals;

    if (!tokenInDecimal || !tokenIn || !tokenOut || !inputAmout) {
      setError("Invalid input");
      setTrade(null);
      return;
    }

    const amountIn = parseUnits(inputAmout, tokenInDecimal);

    if (!amountIn) {
      setError("Invalid input amount");
      setTrade(null);
      return;
    }

    const tokenInBalance = balances[tokenIn] || BigNumber.from(0);

    if (tokenInBalance.lt(amountIn)) {
      setError("Insufficient balance");
    }

    if (!provider) {
      setError("Please connect wallet");
    }

    const params: { [key: string]: string | number } = {
      tokenIn,
      tokenOut,
      saveGas: 0,
      gasInclude: 0,
      slippageTolerance: slippage,
      deadline: Math.floor(date.getTime() / 1000),
      to: account || ZERO_ADDRESS,
      clientData: JSON.stringify({ source: "Widget" }),
      amountIn: amountIn.toString(),
    };

    const search = Object.keys(params).reduce(
      (searchString, key) => `${searchString}&${key}=${params[key]}`,
      ""
    );

    setLoading(true);

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    const res = await fetch(
      `https://aggregator-api.kyberswap.com/${getPath(
        chainId
      )}/route/encode?${search.slice(1)}`,
      {
        headers: {
          "accept-version": "Latest",
        },
        signal: controllerRef.current?.signal,
      }
    ).then((r) => r.json());

    setTrade(res);
    if (res?.outputAmount) {
      if (provider && !tokenInBalance.lt(amountIn)) setError("");
    } else {
      setTrade(null);
      setError("Insufficient liquidity");
    }

    controllerRef.current = null;
    setLoading(false);
  }, [tokenIn, tokenOut, provider, inputAmout, balances, slippage]);

  useEffect(() => {
    getRate();
    const interval = setInterval(() => {
      getRate();
    }, 10_000);
    return () => {
      interval && clearInterval(interval);
    };
  }, [getRate]);

  return {
    tokenIn,
    tokenOut,
    setTokenOut,
    setTokenIn,
    inputAmout,
    trade,
    setInputAmount,
    loading,
    error,
    slippage,
    setSlippage,
  };
};

export default useSwap;
