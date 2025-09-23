import { useEffect, useState } from 'react';

import { useDebounce } from '@kyber/hooks';
import { ChainId, Pool, Token } from '@kyber/schema';
import { fetchTokens } from '@kyber/utils';
import { getTokenBalances } from '@kyber/utils/crypto';
import { formatWei } from '@kyber/utils/number';

export default function useInitialTokensIn({
  pool,
  chainId,
  initDepositTokens,
  initAmounts,
  account,
  nativeToken,
}: {
  pool: Pool | 'loading';
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
      if (!pool || pool === 'loading' || tokensIn.length) return;

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

        const token0Address = pool.token0.address.toLowerCase();
        const token1Address = pool.token1.address.toLowerCase();
        const pairBalance = await getTokenBalances({
          tokenAddresses: [token0Address, token1Address],
          chainId,
          account,
        });

        const token0Balance = formatWei(pairBalance[token0Address]?.toString() || '0', pool.token0.decimals);
        const token1Balance = formatWei(pairBalance[token1Address]?.toString() || '0', pool.token1.decimals);
        if (parseFloat(token0Balance) > 0) tokensToSet.push(pool.token0);
        if (parseFloat(token1Balance) > 0) tokensToSet.push(pool.token1);
        if (!tokensToSet.length) tokensToSet.push(nativeToken);

        setTokensIn(tokensToSet as Token[]);
      }
    };

    setDefaultTokensIn();
  }, [account, chainId, initAmounts, initDepositTokens, nativeToken, pool, tokensIn.length]);

  return { tokensIn, amountsIn, setTokensIn, setAmountsIn, debounceAmountsIn };
}
