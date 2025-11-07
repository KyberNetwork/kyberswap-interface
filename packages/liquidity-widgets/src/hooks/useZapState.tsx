import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useTokenBalances, useTokenPrices } from '@kyber/hooks';
import { API_URLS, CHAIN_ID_TO_CHAIN, Token, ZERO_ADDRESS, ZapRouteDetail, univ3Types } from '@kyber/schema';
import { parseUnits } from '@kyber/utils/crypto';
import { getSqrtRatioAtTick, priceToClosestTick } from '@kyber/utils/uniswapv3';

import { ERROR_MESSAGE } from '@/constants';
import useInitialTokensIn from '@/hooks/useInitialTokensIn';
import useSlippageManager from '@/hooks/useSlippageManager';
import useTickPrice from '@/hooks/useTickPrice';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { WidgetMode } from '@/types/index';
import { parseTokensAndAmounts, validateData } from '@/utils';

interface UiState {
  showSetting: boolean;
  highlightDegenMode: boolean;
  degenMode: boolean;
}

const defaultUiState = {
  showSetting: false,
  highlightDegenMode: false,
  degenMode: false,
};

const defaultZapState = {
  tickLower: null,
  tickUpper: null,
  minPrice: null,
  maxPrice: null,
  tokensIn: [],
  amountsIn: '',
  errors: [],
  zapInfo: null,
  loading: false,
  slippage: undefined,
  ttl: 20, // 20min
  tokenBalances: {},
  tokenPrices: {},
  uiState: defaultUiState,
  zapRouteDisabled: false,
  setTokensIn: (_value: Token[]) => {},
  setAmountsIn: (_value: string) => {},
  setTickLower: (_value: number) => {},
  setTickUpper: (_value: number) => {},
  setSlippage: (_val: number) => {},
  setTtl: (_val: number) => {},
  toggleSetting: (_highlightDegenMode?: boolean) => {},
  setUiState: (_val: UiState | ((_prev: UiState) => UiState)) => {},
  getZapRoute: () => {},
};

const ZapContext = createContext<{
  tickLower: number | null;
  tickUpper: number | null;
  tokensIn: Token[];
  amountsIn: string;
  errors: string[];
  zapInfo: ZapRouteDetail | null;
  loading: boolean;
  slippage?: number;
  minPrice: string | null;
  maxPrice: string | null;
  ttl: number;
  tokenBalances: {
    [key: string]: bigint;
  };
  tokenPrices: { [key: string]: number };
  uiState: UiState;
  zapRouteDisabled: boolean;
  setTokensIn: (_value: Token[]) => void;
  setAmountsIn: (_value: string) => void;
  setTickLower: (_value: number) => void;
  setTickUpper: (_value: number) => void;
  setSlippage: (_val: number) => void;
  setTtl: (_val: number) => void;
  toggleSetting: (_highlightDegenMode?: boolean) => void;
  setUiState: (_val: UiState | ((_prev: UiState) => UiState)) => void;
  getZapRoute: () => void;
}>(defaultZapState);

export const ZapContextProvider = ({ children }: { children: ReactNode }) => {
  const {
    mode,
    chainId,
    source,
    aggregatorOptions,
    initDepositTokens,
    initAmounts,
    feeConfig,
    poolType,
    poolAddress,
    connectedAccount,
    nativeToken,
    wrappedNativeToken,
    positionId,
    initialTick,
  } = useWidgetStore([
    'mode',
    'chainId',
    'source',
    'aggregatorOptions',
    'initDepositTokens',
    'initAmounts',
    'feeConfig',
    'poolType',
    'poolAddress',
    'connectedAccount',
    'nativeToken',
    'wrappedNativeToken',
    'positionId',
    'initialTick',
  ]);
  const { position } = usePositionStore(['position']);
  const { pool, poolPrice, revertPrice, toggleRevertPrice } = usePoolStore([
    'pool',
    'poolPrice',
    'revertPrice',
    'toggleRevertPrice',
  ]);

  const excludedSources = aggregatorOptions?.excludedSources?.join(',');
  const includedSources = aggregatorOptions?.includedSources?.join(',');
  const account = connectedAccount?.address;
  const networkChainId = connectedAccount?.chainId;
  const { feePcm, feeAddress } = feeConfig || {};

  const [uiState, setUiState] = useState(defaultUiState);
  const [ttl, setTtl] = useState(20);
  const [zapInfo, setZapInfo] = useState<ZapRouteDetail | null>(null);
  const [zapApiError, setZapApiError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [defaultRevertChecked, setDefaultRevertChecked] = useState(false);

  const isCreateMode = mode === WidgetMode.CREATE;
  const initializing = !pool;
  const isUniV3 = !initializing && univ3Types.includes(poolType as any);
  const { token0, token1 } = initializing ? { token0: undefined, token1: undefined } : pool;

  const { tokensIn, amountsIn, setTokensIn, setAmountsIn, debounceAmountsIn } = useInitialTokensIn({
    pool,
    chainId,
    initDepositTokens,
    initAmounts,
    account,
    nativeToken,
    isCreateMode,
  });

  const { balances } = useTokenBalances(
    chainId,
    tokensIn.map(item => item.address),
    account,
  );

  const { tickLower, tickUpper, setTickLower, setTickUpper, debounceTickLower, debounceTickUpper, minPrice, maxPrice } =
    useTickPrice({
      token0,
      token1,
      revertPrice,
      position,
      initialTick,
    });
  const { slippage, setSlippage } = useSlippageManager({ pool, tokensIn, chainId });
  const { prices: tokenPrices } = useTokenPrices({
    addresses: tokensIn.map(token => token.address.toLowerCase()),
    chainId,
  });

  const errors = useMemo(
    () =>
      validateData({
        account,
        chainId,
        networkChainId,
        tokensIn,
        isUniV3,
        tickLower: tickLower || 0,
        tickUpper: tickUpper || 0,
        amountsIn: debounceAmountsIn,
        balances,
        zapApiError,
      }),
    [
      account,
      chainId,
      networkChainId,
      tokensIn,
      debounceAmountsIn,
      tickLower,
      tickUpper,
      zapApiError,
      balances,
      isUniV3,
    ],
  );

  const zapRouteDisabled = useMemo(
    () =>
      Boolean(
        !slippage ||
          (isUniV3 && !debounceTickLower && !debounceTickUpper) ||
          initializing ||
          (errors.length > 0 &&
            (errors.includes(ERROR_MESSAGE.SELECT_TOKEN_IN) ||
              errors.includes(ERROR_MESSAGE.ENTER_MIN_PRICE) ||
              errors.includes(ERROR_MESSAGE.ENTER_MAX_PRICE) ||
              errors.includes(ERROR_MESSAGE.INVALID_PRICE_RANGE) ||
              errors.includes(ERROR_MESSAGE.ENTER_AMOUNT) ||
              errors.includes(ERROR_MESSAGE.INVALID_INPUT_AMOUNT))),
      ),
    [debounceTickLower, debounceTickUpper, errors, initializing, isUniV3, slippage],
  );

  const toggleSetting = useCallback((highlight?: boolean) => {
    setUiState(prev => ({ ...prev, showSetting: !prev.showSetting }));
    if (highlight) {
      setUiState(prev => ({ ...prev, highlightDegenMode: true }));
      setTimeout(() => {
        setUiState(prev => ({ ...prev, highlightDegenMode: false }));
      }, 4000);
    }
  }, []);

  // check pair to revert
  useEffect(() => {
    if (initializing || defaultRevertChecked) return;
    setDefaultRevertChecked(true);
    const isToken0Native = pool.token0.address.toLowerCase() === wrappedNativeToken?.address.toLowerCase();
    const isToken0Stable = pool.token0.isStable;
    const isToken1Stable = pool.token1.isStable;
    if ((isToken0Stable || (isToken0Native && !isToken1Stable)) && !revertPrice) toggleRevertPrice();
  }, [defaultRevertChecked, initializing, pool, revertPrice, toggleRevertPrice, wrappedNativeToken?.address]);

  const getZapRoute = useCallback(() => {
    if (zapRouteDisabled || !slippage || initializing) return;

    let formattedAmountsInWeis = '';

    const {
      tokensIn: listValidTokensIn,
      amountsIn: listValidAmountsIn,
      tokenAddresses: validTokenInAddresses,
    } = parseTokensAndAmounts(tokensIn, amountsIn);

    try {
      formattedAmountsInWeis = listValidTokensIn
        .map((token: Token, index: number) => parseUnits(listValidAmountsIn[index] || '0', token.decimals).toString())
        .join(',');
    } catch (error) {
      console.log(error);
    }

    if (
      !validTokenInAddresses ||
      !formattedAmountsInWeis ||
      formattedAmountsInWeis === '0' ||
      formattedAmountsInWeis === '00'
    ) {
      setZapInfo(null);
      return;
    }

    setLoading(true);
    let params: Record<string, string | number | boolean>;

    if (isCreateMode) {
      const tickFromPrice = priceToClosestTick(
        poolPrice!.toString(),
        pool.token0.decimals,
        pool.token1.decimals,
        revertPrice,
      );
      const sqrtPriceX96 = getSqrtRatioAtTick(tickFromPrice || 0).toString();

      params = {
        dex: poolType,
        'pool.tokens': `${pool.token0.address},${pool.token1.address}`,
        'pool.uniswap_v4_config.fee': pool.fee * 10_000,
        'pool.uniswap_v4_config.sqrt_p': sqrtPriceX96,
        'zap_in.position.tick_upper': debounceTickUpper ?? 0,
        'zap_in.position.tick_lower': debounceTickLower ?? 0,
        'zap_in.tokens_in': validTokenInAddresses,
        'zap_in.amounts_in': formattedAmountsInWeis,
        'zap_in.slippage': slippage,
      };
    } else {
      params = {
        dex: poolType,
        'pool.id': poolAddress,
        'pool.token0': pool.token0.address,
        'pool.token1': pool.token1.address,
        'pool.fee': pool.fee * 10_000,
        ...(isUniV3 && debounceTickUpper !== null && debounceTickLower !== null && !positionId
          ? {
              'position.tickUpper': debounceTickUpper,
              'position.tickLower': debounceTickLower,
            }
          : { 'position.id': account || ZERO_ADDRESS }),
        tokensIn: validTokenInAddresses,
        amountsIn: formattedAmountsInWeis,
        slippage,
        ...(positionId ? { 'position.id': positionId } : {}),
        ...(feeAddress ? { feeAddress, feePcm } : {}),
        ...(includedSources ? { 'aggregatorOptions.includedSources': includedSources } : {}),
        ...(excludedSources ? { 'aggregatorOptions.excludedSources': excludedSources } : {}),
      };
    }

    let tmp = '';
    Object.keys(params).forEach(key => {
      tmp = `${tmp}&${key}=${params[key]}`;
    });

    fetch(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/${mode}/route?${tmp.slice(1)}`, {
      headers: {
        'X-Client-Id': source,
      },
    })
      .then(res => res.json())
      .then(res => {
        if (res.data) {
          setZapApiError('');
          setZapInfo(res.data);
        } else {
          setZapInfo(null);
          setZapApiError(res.message || 'Something went wrong');
        }
      })
      .catch(e => {
        const errorMessage = e instanceof Error ? e.message : 'Something went wrong';
        setZapApiError(errorMessage);
        console.error('Zap API error:', e);
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debounceTickLower,
    debounceTickUpper,
    feeAddress,
    feePcm,
    slippage,
    includedSources,
    excludedSources,
    source,
    tokensIn,
    debounceAmountsIn,
    mode,
    poolPrice,
    revertPrice,
  ]);

  useEffect(() => {
    getZapRoute();
  }, [getZapRoute]);

  return (
    <ZapContext.Provider
      value={{
        tickLower,
        tickUpper,
        tokensIn,
        setTokensIn,
        amountsIn,
        setAmountsIn,
        setTickLower,
        setTickUpper,
        errors,
        zapInfo,
        loading,
        minPrice,
        maxPrice,
        slippage,
        setSlippage,
        ttl,
        setTtl,
        toggleSetting,
        uiState,
        setUiState,
        tokenBalances: balances,
        tokenPrices,
        getZapRoute,
        zapRouteDisabled,
      }}
    >
      {children}
    </ZapContext.Provider>
  );
};

export const useZapState = () => {
  const context = useContext(ZapContext);
  if (context === undefined) {
    throw new Error('useZapState must be used within a ZapContextProvider');
  }
  return context;
};
