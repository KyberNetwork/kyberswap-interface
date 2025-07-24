import { DEXES_INFO, PoolType } from '@kyber/schema';

export const getNftManagerContractAddress = (poolType: PoolType, chainId: number) => {
  const contract = DEXES_INFO[poolType].nftManagerContract;
  const contractAddress = typeof contract === 'string' ? contract : contract[chainId];

  return contractAddress;
};
