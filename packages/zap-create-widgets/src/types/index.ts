import { ApprovalAdditionalInfo } from '@kyber/hooks';
import { ChainId, POOL_CATEGORY, PoolType, Theme, Token, TxStatus, ZapRouteDetail } from '@kyber/schema';

import { SupportedLocale } from '@/i18n';

export { TxStatus };

export interface CreatePoolConfig {
  token0: Token;
  token1: Token;
  poolCategory: POOL_CATEGORY;
  fee: number;
}

export interface WidgetProps {
  theme?: Theme;
  chainId: ChainId;
  rpcUrl?: string;
  poolType: PoolType;
  dexId?: string;
  createPoolConfig: CreatePoolConfig;
  source: string;
  connectedAccount: { address?: string | undefined; chainId: number };
  txStatus?: Record<string, TxStatus>;
  txHashMapping?: Record<string, string>;
  locale?: SupportedLocale;
  onClose?: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSuccess?: ({ txHash, position }: OnSuccessProps) => void;
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?:
      | {
          type: 'zap';
          tokensIn: Array<{ symbol: string; amount: string; logoUrl?: string }>;
          pool: string;
          dexLogo: string;
        }
      | ApprovalAdditionalInfo,
  ) => Promise<string>;
  onViewPosition?: (txHash: string) => void;
}

export interface OnSuccessProps {
  txHash: string;
  position: {
    chainId: number;
    poolType: PoolType;
    dexLogo: string;
    token0: {
      address: string;
      symbol: string;
      logo: string;
      amount: number;
    };
    token1: {
      address: string;
      symbol: string;
      logo: string;
      amount: number;
    };
    value: number;
    createdAt: number;
  };
}

export enum PriceType {
  MinPrice = 'MinPrice',
  MaxPrice = 'MaxPrice',
}

export interface ZapSnapshotState {
  zapInfo: ZapRouteDetail;
  deadline: number;
  gasUsd: number;
}
