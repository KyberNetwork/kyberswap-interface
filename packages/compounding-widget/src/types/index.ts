import { ChainId, Pool, PoolType, ZapRouteDetail } from '@kyber/schema';

export interface WidgetProps {
  poolAddress: string;
  positionId: string;
  poolType: PoolType;
  chainId: ChainId;
  connectedAccount: {
    address?: string | undefined;
    chainId: number;
  };
  initDepositTokens?: string;
  initAmounts?: string;
  onClose: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;
  onViewPosition?: (txHash: string) => void;
}

export interface ZapState {
  pool: Pool;
  zapInfo: ZapRouteDetail;
  deadline: number;
}
