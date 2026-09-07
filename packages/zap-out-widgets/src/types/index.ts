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
  /**
   * Use KyberSwap's wallet-inventory service as the token selector's balance source on the chains it
   * indexes; a balanceOf multicall serves the rest. Off by default.
   */
  enableWalletInventory?: boolean;
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
  onOpenPoolDetail?: (pool: { chainId: number; poolAddress: string; dexId?: string }) => void;
}
