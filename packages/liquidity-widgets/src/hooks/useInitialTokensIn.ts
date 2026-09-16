import { useEffect, useState } from 'react';

import { useDebounce } from '@kyber/hooks';
import { ChainId, Pool, Token } from '@kyber/schema';
import { fetchTokens, toZapInputToken } from '@kyber/utils';
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
          setTokensIn(tokens.map(token => toZapInputToken(chainId, token)));
          setAmountsIn(parseListAmountsIn.join(','));
          return;
        }
      }

      // without wallet connect
      if (!account) {
        setTokensIn([toZapInputToken(chainId, nativeToken)]);
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
        // Balances are read in each token's own units; what goes in is the token's input form, with the
        // amount cut to that form's decimals so it always parses.
        if (parseFloat(token0Balance) > 0) {
          const token0Input = toZapInputToken(chainId, pool.token0);
          tokensToSet.push(token0Input);
          const amount =
            +token0Balance >= 1 ? 1 : token0Address === nativeToken.address ? +token0Balance * 0.95 : +token0Balance;
          amountsToSet.push(formatAmountWithDecimals(amount, token0Input.decimals));
        }
        if (parseFloat(token1Balance) > 0) {
          const token1Input = toZapInputToken(chainId, pool.token1);
          tokensToSet.push(token1Input);
          const amount =
            +token1Balance >= 1 ? 1 : token1Address === nativeToken.address ? +token1Balance * 0.95 : +token1Balance;
          amountsToSet.push(formatAmountWithDecimals(amount, token1Input.decimals));
        }
        if (!tokensToSet.length) {
          const nativeInput = toZapInputToken(chainId, nativeToken);
          tokensToSet.push(nativeInput);
          const amount = +nativeTokenBalance >= 1 ? 1 : +nativeTokenBalance > 0 ? +nativeTokenBalance * 0.95 : 1;
          amountsToSet.push(formatAmountWithDecimals(amount, nativeInput.decimals));
        }

        setTokensIn(tokensToSet as Token[]);
        setAmountsIn(amountsToSet.join(','));
      }
    };

    setDefaultTokensIn();
  }, [account, chainId, initAmounts, initDepositTokens, nativeToken, pool, tokensIn.length]);

  return { tokensIn, amountsIn, setTokensIn, setAmountsIn, debounceAmountsIn };
}
