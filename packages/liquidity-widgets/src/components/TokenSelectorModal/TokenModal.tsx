import { useCallback, useState } from 'react';

import { ChainId, Token } from '@kyber/schema';

import { PositionToMigrate } from '@/Widget';
import Modal from '@/components/Modal';
import TokenImportConfirm from '@/components/TokenSelectorModal/TokenImportConfirm';
import TokenInfo from '@/components/TokenSelectorModal/TokenInfo';
import TokenSelector, { TOKEN_SELECT_MODE } from '@/components/TokenSelectorModal/TokenSelector';
import { useTokenState } from '@/components/TokenSelectorModal/useTokenState';
import { MAX_ZAP_IN_TOKENS } from '@/constants';

export interface TokenModalProps {
  tokensIn: Token[];
  amountsIn: string;
  account?: string;
  chainId: ChainId;
  mode: TOKEN_SELECT_MODE;
  selectedTokenAddress?: string;
  positionId?: string;
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  setTokensIn: (tokens: Token[]) => void;
  setAmountsIn: (amounts: string) => void;
  onConnectWallet: () => void;
  onOpenZapMigration?: (position: PositionToMigrate) => void;
  onClose: () => void;
}

const TokenModal = ({
  tokensIn,
  amountsIn,
  account,
  chainId,
  mode,
  selectedTokenAddress,
  positionId,
  poolAddress,
  token0Address,
  token1Address,
  setTokensIn,
  setAmountsIn,
  onConnectWallet,
  onOpenZapMigration,
  onClose,
}: TokenModalProps) => {
  const { importToken } = useTokenState();

  const [tokenToShow, setTokenToShow] = useState<Token | null>(null);
  const [tokenToImport, setTokenToImport] = useState<Token | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([...tokensIn]);

  const handleConfirmImportToken = useCallback(() => {
    if (!tokenToImport) return;
    importToken(tokenToImport);
    if (mode === TOKEN_SELECT_MODE.SELECT) {
      const index = tokensIn.findIndex((tokenIn: Token) => tokenIn.address === selectedTokenAddress);
      if (index > -1) {
        const clonedTokensIn = [...tokensIn];
        clonedTokensIn[index] = tokenToImport;
        setTokensIn(clonedTokensIn);

        const listAmountsIn = amountsIn.split(',');
        listAmountsIn[index] = '';
        setAmountsIn(listAmountsIn.join(','));

        onClose();
      }
    } else if ((selectedTokens || []).length < MAX_ZAP_IN_TOKENS) {
      const clonedTokensIn = [...tokensIn];
      clonedTokensIn.push(tokenToImport);
      setTokensIn(clonedTokensIn);
      setAmountsIn(`${amountsIn},`);
    }
    setTokenToImport(null);
  }, [
    amountsIn,
    importToken,
    mode,
    onClose,
    selectedTokenAddress,
    selectedTokens,
    setAmountsIn,
    setTokensIn,
    tokenToImport,
    tokensIn,
  ]);

  return (
    <Modal
      isOpen
      onClick={onClose}
      modalContentClass={`bg-layer2 p-0 !max-h-[80vh] ${
        tokenToShow || tokenToImport ? '' : 'pb-6'
      } ${tokenToImport ? 'max-w-[420px]' : 'max-w-[435px]'}`}
    >
      {tokenToShow ? (
        <TokenInfo token={tokenToShow} chainId={chainId} onGoBack={() => setTokenToShow(null)} />
      ) : tokenToImport ? (
        <TokenImportConfirm
          chainId={chainId}
          token={tokenToImport}
          handleConfirmImportToken={handleConfirmImportToken}
          onGoBack={() => setTokenToImport(null)}
          onClose={onClose}
        />
      ) : (
        <TokenSelector
          tokensIn={tokensIn}
          amountsIn={amountsIn}
          setTokensIn={setTokensIn}
          setAmountsIn={setAmountsIn}
          account={account}
          selectedTokenAddress={selectedTokenAddress}
          mode={mode}
          chainId={chainId}
          positionId={positionId}
          token0Address={token0Address}
          token1Address={token1Address}
          poolAddress={poolAddress}
          onConnectWallet={onConnectWallet}
          onOpenZapMigration={onOpenZapMigration}
          selectedTokens={selectedTokens}
          setSelectedTokens={setSelectedTokens}
          setTokenToShow={setTokenToShow}
          setTokenToImport={setTokenToImport}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};

export default TokenModal;
