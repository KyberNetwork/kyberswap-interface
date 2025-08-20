export enum ShareType {
  POOL_INFO = 'pool',
  POSITION_INFO = 'position',
  REWARD_INFO = 'reward',
}

export enum ShareOption {
  TOTAL_APR = 'Total APR',
  LM_APR = 'Liquidity Mining APR',
  EG_APR = 'EG Sharing APR',
  TOTAL_EARNINGS = 'Total Earnings',
  TOTAL_REWARD = 'Total Rewards',
  LM_REWARD = 'Liquidity Mining rewards',
  EG_REWARD = 'EG Sharing rewards',
}

export interface ShareModalProps {
  type: ShareType;
  isFarming?: boolean;
  defaultOptions?: ShareOption[];
  pool: {
    feeTier?: number;
    address?: string;
    chainId?: number;
    chainLogo?: string;
    dexLogo: string;
    dexName: string;
    exchange?: string;
    token0?: {
      symbol: string;
      logo: string;
    };
    token1?: {
      symbol: string;
      logo: string;
    };
    apr?: {
      fees: number;
      eg: number;
      lm: number;
    };
  };
  position?: {
    apr: {
      fees: number;
      eg: number;
      lm: number;
    };
    createdTime: number;
    totalEarnings: number;
  };
  reward?: {
    total: number;
    lm: number;
    eg: number;
  };
  onClose: () => void;
}
