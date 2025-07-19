import { ChainId, Token } from '@kyber/schema';

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
  zapApiError,
}: {
  account?: string;
  chainId: ChainId;
  networkChainId: ChainId;
  zapApiError: string;
}) => {
  if (!account) return ERROR_MESSAGE.CONNECT_WALLET;
  if (chainId !== networkChainId) return ERROR_MESSAGE.WRONG_NETWORK;

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
