import { ApprovalAdditionalInfo } from '@kyber/hooks';
import { ChainId, PoolType, Theme, TxStatus } from '@kyber/schema';

import { SupportedLocale } from '@/i18n';

export { TxStatus };

export interface OnSuccessProps {
  txHash: string;
  positionId: string;
  pool: {
    address: string;
    fee: number;
  };
  token0: {
    address: string;
    symbol: string;
    logo: string;
  };
  token1: {
    address: string;
    symbol: string;
    logo: string;
  };
  mode: 'zapOut' | 'withdrawOnly';
  tokensOut: Array<{ symbol: string; amount: string; logoUrl?: string }>;
}

export interface ZapOutProps {
  theme?: Theme;
  chainId: ChainId;
  rpcUrl?: string;
  poolAddress: string;
  poolType: PoolType;
  dexId?: string;
  positionId: string;
  connectedAccount: {
    address?: string | undefined;
    chainId: number;
  };
  source: string;
  referral?: string;
  txStatus?: Record<string, TxStatus>;
  txHashMapping?: Record<string, string>;
  locale?: SupportedLocale;
  mode?: 'zapOut' | 'withdrawOnly';
  onClose: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?:
      | {
          type: 'zap';
          pool: string;
          dexLogo: string;
          tokensOut: Array<{ symbol: string; amount: string; logoUrl?: string }>;
        }
      | ApprovalAdditionalInfo,
  ) => Promise<string>;
  onExplorePools?: () => void;
  onSuccess?: (props: OnSuccessProps) => void;
  signTypedData?: (account: string, typedDataJson: string) => Promise<string>;
}
