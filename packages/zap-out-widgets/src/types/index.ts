import { ChainId, PoolType, Theme } from '@kyber/schema';

export enum ZapStatus {
  INIT = 'init',
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface ZapOutProps {
  theme?: Theme;
  chainId: ChainId;
  rpcUrl?: string;
  poolAddress: string;
  poolType: PoolType;
  positionId: string;
  connectedAccount: {
    address?: string | undefined;
    chainId: number;
  };
  source: string;
  referral?: string;
  zapStatus?: ZapStatus;
  onClose: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?: {
      pool: string;
      dexLogo: string;
      tokensOut: Array<{ symbol: string; amount: string; logoUrl?: string }>;
    },
  ) => Promise<string>;
}
