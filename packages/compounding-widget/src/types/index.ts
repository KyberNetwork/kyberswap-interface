import { ChainId, Pool, PoolType, ZapRouteDetail } from '@kyber/schema';

import { SupportedLocale } from '@/i18n';

export enum TxStatus {
  INIT = 'init',
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface WidgetProps {
  poolAddress: string;
  positionId: string;
  poolType: PoolType;
  chainId: ChainId;
  rpcUrl?: string;
  connectedAccount: {
    address?: string | undefined;
    chainId: number;
  };
  initDepositTokens?: string;
  initAmounts?: string;
  compoundType?: 'COMPOUND_TYPE_REWARD';
  zapStatus?: Record<string, TxStatus>;
  locale?: SupportedLocale;
  onClose: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?: {
      tokensIn: Array<{ symbol: string; amount: string; logoUrl?: string }>;
      pool: string;
      dexLogo: string;
    },
  ) => Promise<string>;
  onViewPosition?: (txHash: string) => void;
}

export interface ZapState {
  pool: Pool;
  zapInfo: ZapRouteDetail;
  deadline: number;
}
