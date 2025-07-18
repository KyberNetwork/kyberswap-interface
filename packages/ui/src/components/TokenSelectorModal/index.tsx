import TokenModal, { TokenModalProps } from '@/components/TokenSelectorModal/TokenModal';
import { TokenContextProvider } from '@/components/TokenSelectorModal/useTokenState';

export enum TOKEN_SELECT_MODE {
  SELECT = 'SELECT',
  ADD = 'ADD',
}

export const MAX_TOKENS = 5;

const TokenSelectorModal = (props: TokenModalProps) => {
  const { chainId, token0Address, token1Address, account } = props;

  return (
    <TokenContextProvider
      chainId={chainId}
      account={account}
      additionalTokenAddresses={token0Address && token1Address ? `${token0Address},${token1Address}` : undefined}
    >
      <TokenModal {...props} />
    </TokenContextProvider>
  );
};

export default TokenSelectorModal;
