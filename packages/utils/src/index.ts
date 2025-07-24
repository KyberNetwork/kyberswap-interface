import { ChainId, NETWORKS_INFO } from '@kyber/schema';

export const enumToArrayOfValues = (enumObject: { [x: string]: unknown }, valueType?: string) =>
  Object.keys(enumObject)
    .map(key => enumObject[key])
    .filter(value => !valueType || typeof value === valueType);

export const getEtherscanLink = (
  chainId: ChainId,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block',
): string => {
  const prefix = NETWORKS_INFO[chainId].scanLink;

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`;
    }
    case 'token': {
      if (chainId === ChainId.ZkSync) return `${prefix}/address/${data}`;
      return `${prefix}/token/${data}`;
    }
    case 'block': {
      return `${prefix}/block/${data}`;
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`;
    }
  }
};

export * from './liquidity';
export * from './liquidity/pool';
export * from './liquidity/position';
export * from './liquidity/price-impact';
export * from './liquidity/zap';
export * from './services';
export * from './error';
