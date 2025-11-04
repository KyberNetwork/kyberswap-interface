import { ChainId, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, Pool, Token, univ3PoolNormalize } from '@kyber/schema';
import { translateFriendlyErrorMessage } from '@kyber/ui';
import { fetchTokenPrice, friendlyError } from '@kyber/utils';
import { estimateGas, getCurrentGasPrice } from '@kyber/utils/crypto';
import { formatUnits } from '@kyber/utils/number';

import { ERROR_MESSAGE } from '@/constants';

export const countDecimals = (value: string | number) => {
  if (Math.floor(+value) === +value) return 0;
  return value.toString().split('.')[1].length || 0;
};

export const checkDeviated = (price: number | null, newPrice: number | undefined | null) =>
  !!price && !!newPrice && Math.abs(price / newPrice - 1) > 0.02;

const isValidNumber = (value: string) => {
  return value && value !== '0' && parseFloat(value);
};

export const validateData = ({
  account,
  chainId,
  networkChainId,
  tokensIn,
  amountsIn,
  isUniV3,
  tickLower,
  tickUpper,
  balances,
  zapApiError,
}: {
  account?: string;
  chainId: ChainId;
  networkChainId: ChainId;
  tokensIn: Token[];
  amountsIn: string;
  isUniV3: boolean;
  tickLower: number;
  tickUpper: number;
  balances: {
    [key: string]: bigint;
  };
  zapApiError: string;
}) => {
  const errors = [];
  if (!account) errors.push(ERROR_MESSAGE.CONNECT_WALLET);
  if (chainId !== networkChainId) errors.push(ERROR_MESSAGE.WRONG_NETWORK);
  if (!tokensIn.length) errors.push(ERROR_MESSAGE.SELECT_TOKEN_IN);
  if (isUniV3) {
    if (tickLower === null) errors.push(ERROR_MESSAGE.ENTER_MIN_PRICE);
    if (tickUpper === null) errors.push(ERROR_MESSAGE.ENTER_MAX_PRICE);
    if (tickLower >= tickUpper) errors.push(ERROR_MESSAGE.INVALID_PRICE_RANGE);
  }

  const listAmountsIn = amountsIn.split(',');
  const isAmountEntered = tokensIn.some((_, index) => isValidNumber(listAmountsIn[index]));
  if (!isAmountEntered) errors.push(ERROR_MESSAGE.ENTER_AMOUNT);

  const { tokensIn: listValidTokensIn, amountsIn: listValidAmountsIn } = parseTokensAndAmounts(tokensIn, amountsIn);

  try {
    for (let i = 0; i < listValidTokensIn.length; i++) {
      const tokenAddress =
        listValidTokensIn[i].address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NATIVE_TOKEN_ADDRESS.toLowerCase()
          : listValidTokensIn[i].address.toLowerCase();
      const balance = formatUnits(balances[tokenAddress]?.toString() || '0', listValidTokensIn[i].decimals);

      if (countDecimals(listValidAmountsIn[i]) > listValidTokensIn[i].decimals) {
        errors.push(ERROR_MESSAGE.INVALID_INPUT_AMOUNT);
        break;
      }
      if (parseFloat(listValidAmountsIn[i]) > parseFloat(balance)) {
        errors.push(ERROR_MESSAGE.INSUFFICIENT_BALANCE);
        break;
      }
    }
  } catch (e) {
    errors.push(ERROR_MESSAGE.INVALID_INPUT_AMOUNT);
  }

  if (zapApiError) errors.push(zapApiError);

  return errors;
};

export const parseTokensAndAmounts = (tokensIn: Token[], amountsIn: string) => {
  const listAmountsIn = amountsIn.split(',');
  const listValidTokensIn: Token[] = [];
  const listValidAmountsIn: string[] = [];

  tokensIn.forEach((token, index) => {
    if (isValidNumber(listAmountsIn[index])) {
      listValidTokensIn.push(token);
      listValidAmountsIn.push(listAmountsIn[index]);
    }
  });

  return {
    tokensIn: listValidTokensIn,
    amountsIn: listValidAmountsIn,
    tokenAddresses: (listValidTokensIn || []).map(token => token.address).join(','),
  };
};

export const getPriceRangeToShow = ({
  pool,
  revertPrice,
  tickLower,
  tickUpper,
  minPrice,
  maxPrice,
}: {
  pool: Pool | null;
  revertPrice: boolean;
  tickLower: number | null;
  tickUpper: number | null;
  minPrice: string | null;
  maxPrice: string | null;
}) => {
  if (!pool) return;

  const { success: isUniV3, data: uniV3Pool } = univ3PoolNormalize.safeParse(pool);

  if (!isUniV3)
    return {
      minPrice: '0',
      maxPrice: '∞',
    };

  const isMinTick = uniV3Pool.minTick === tickLower;
  const isMaxTick = uniV3Pool.maxTick === tickUpper;

  let minPriceToShow = minPrice;
  let maxPriceToShow = maxPrice;

  if (isMinTick) {
    if (!revertPrice) minPriceToShow = '0';
    else maxPriceToShow = '∞';
  }

  if (isMaxTick) {
    if (!revertPrice) maxPriceToShow = '∞';
    else minPriceToShow = '0';
  }

  return {
    minPrice: minPriceToShow,
    maxPrice: maxPriceToShow,
  };
};

export const estimateGasForTx = async ({
  rpcUrl,
  txData,
  chainId,
}: {
  rpcUrl: string;
  txData: {
    from: string;
    to: string;
    value: string;
    data: string;
  };
  chainId: ChainId;
}) => {
  try {
    const wethAddress = NETWORKS_INFO[chainId].wrappedToken.address.toLowerCase();
    const [gasEstimation, nativeTokenPrice, gasPrice] = await Promise.all([
      estimateGas(rpcUrl, txData),
      fetchTokenPrice({ addresses: [wethAddress], chainId })
        .then((prices: { [x: string]: { PriceBuy: number } }) => {
          return prices[wethAddress]?.PriceBuy || 0;
        })
        .catch(() => 0),
      getCurrentGasPrice(rpcUrl),
    ]);

    const gasUsd = +formatUnits(gasPrice.toString(), 18) * +gasEstimation.toString() * nativeTokenPrice;

    return {
      gasUsd,
      error: undefined,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.log('Estimate gas failed', message);

    return {
      gasUsd: undefined,
      error: translateFriendlyErrorMessage(friendlyError(message)),
    };
  }
};
