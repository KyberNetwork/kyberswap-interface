import { useEffect, useState } from 'react';

import { useDebounce } from '@kyber/hooks';
import { ChainId, Pool, Token } from '@kyber/schema';
import { fetchTokens } from '@kyber/utils';
import { getTokenBalances } from '@kyber/utils/crypto';
import { formatUnits } from '@kyber/utils/number';

import { formatAmountWithDecimals } from '@/utils';

export default function useInitialTokensIn({
  pool,
  chainId,
  initDepositTokens,
  initAmounts,
  account,
  nativeToken,
}: {
  pool: Pool | null;
  chainId: ChainId;
  initDepositTokens?: string;
  initAmounts?: string;
  account?: string;
  nativeToken: Token;
}) {
  const [tokensIn, setTokensIn] = useState<Token[]>([]);
  const [amountsIn, setAmountsIn] = useState<string>('');

  const debounceAmountsIn = useDebounce(amountsIn, 300);

  useEffect(() => {
    const setDefaultTokensIn = async () => {
      if (!pool || tokensIn.length) return;

      // with params
      if (initDepositTokens) {
        const tokens = await fetchTokens(initDepositTokens?.split(',') || [], chainId);

        const listInitAmounts = initAmounts?.split(',') || [];
        const parseListAmountsIn: string[] = [];

        if (tokens.length) {
          tokens.forEach((_, index: number) => {
            parseListAmountsIn.push(listInitAmounts[index] || '');
          });
          setTokensIn(tokens as Token[]);
          setAmountsIn(parseListAmountsIn.join(','));
          return;
        }
      }

      // without wallet connect
      if (!account) {
        setTokensIn([nativeToken] as Token[]);
      }

      // with balance
      if (!initDepositTokens && account) {
        const tokensToSet = [];
        const amountsToSet = [];

        const token0Address = pool.token0.address.toLowerCase();
        const token1Address = pool.token1.address.toLowerCase();
        const pairBalance = await getTokenBalances({
          tokenAddresses: [token0Address, token1Address, nativeToken.address],
          chainId,
          account,
        });

        const token0Balance = formatUnits(BigInt(pairBalance[token0Address]).toString(), pool.token0.decimals);
        const token1Balance = formatUnits(BigInt(pairBalance[token1Address]).toString(), pool.token1.decimals);
        const nativeTokenBalance = formatUnits(
          BigInt(pairBalance[nativeToken.address]).toString(),
          nativeToken.decimals,
        );
        if (parseFloat(token0Balance) > 0) {
          tokensToSet.push(pool.token0);
          const amount =
            +token0Balance >= 1 ? 1 : token0Address === nativeToken.address ? +token0Balance * 0.95 : +token0Balance;
          amountsToSet.push(formatAmountWithDecimals(amount, pool.token0.decimals));
        }
        if (parseFloat(token1Balance) > 0) {
          tokensToSet.push(pool.token1);
          const amount =
            +token1Balance >= 1 ? 1 : token1Address === nativeToken.address ? +token1Balance * 0.95 : +token1Balance;
          amountsToSet.push(formatAmountWithDecimals(amount, pool.token1.decimals));
        }
        if (!tokensToSet.length) {
          tokensToSet.push(nativeToken);
          const amount = +nativeTokenBalance >= 1 ? 1 : +nativeTokenBalance > 0 ? +nativeTokenBalance * 0.95 : 1;
          amountsToSet.push(formatAmountWithDecimals(amount, nativeToken.decimals));
        }

        setTokensIn(tokensToSet as Token[]);
        setAmountsIn(amountsToSet.join(','));
      }
    };

    setDefaultTokensIn();
  }, [account, chainId, initAmounts, initDepositTokens, nativeToken, pool, tokensIn.length]);

  return { tokensIn, amountsIn, setTokensIn, setAmountsIn, debounceAmountsIn };
}
