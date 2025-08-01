import { ChainId, NATIVE_TOKEN_ADDRESS, Token } from '@kyber/schema';
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
  if (!account) return ERROR_MESSAGE.CONNECT_WALLET;
  if (chainId !== networkChainId) return ERROR_MESSAGE.WRONG_NETWORK;
  if (!tokensIn.length) return ERROR_MESSAGE.SELECT_TOKEN_IN;
  if (isUniV3) {
    if (tickLower === null) return ERROR_MESSAGE.ENTER_MIN_PRICE;
    if (tickUpper === null) return ERROR_MESSAGE.ENTER_MAX_PRICE;
    if (tickLower >= tickUpper) return ERROR_MESSAGE.INVALID_PRICE_RANGE;
  }

  const listAmountsIn = amountsIn.split(',');
  const isAmountEntered = tokensIn.some((_, index) => isValidNumber(listAmountsIn[index]));
  if (!isAmountEntered) return ERROR_MESSAGE.ENTER_AMOUNT;

  const { tokensIn: listValidTokensIn, amountsIn: listValidAmountsIn } = parseTokensAndAmounts(tokensIn, amountsIn);

  try {
    for (let i = 0; i < listValidTokensIn.length; i++) {
      const tokenAddress =
        listValidTokensIn[i].address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NATIVE_TOKEN_ADDRESS.toLowerCase()
          : listValidTokensIn[i].address.toLowerCase();
      const balance = formatUnits(balances[tokenAddress]?.toString() || '0', listValidTokensIn[i].decimals);

      if (countDecimals(listValidAmountsIn[i]) > listValidTokensIn[i].decimals)
        return ERROR_MESSAGE.INVALID_INPUT_AMOUNT;
      if (parseFloat(listValidAmountsIn[i]) > parseFloat(balance)) return ERROR_MESSAGE.INSUFFICIENT_BALANCE;
    }
  } catch (e) {
    return ERROR_MESSAGE.INVALID_INPUT_AMOUNT;
  }

  if (zapApiError) return zapApiError;

  return '';
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
