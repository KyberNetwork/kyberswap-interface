import { ChainId, NETWORKS_INFO } from '@kyber/schema';

import { estimateGas, formatUnits, getCurrentGasPrice } from '.';
import { friendlyError } from '../error';
import { fetchTokenPrice } from '../services';

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
      error: friendlyError(message),
    };
  }
};
