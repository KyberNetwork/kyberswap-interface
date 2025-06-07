import { useState } from 'react';

import { Token } from '@kyber/schema';

import Modal from '@/components/Modal';
import TokenInfo from '@/components/TokenInfo';
import TokenSelector, { TOKEN_SELECT_MODE } from '@/components/TokenSelector';
import TokenImportConfirm from '@/components/TokenSelector/TokenImportConfirm';
import { useZapState } from '@/hooks/useZapInState';

const TokenSelectorModal = ({
  selectedTokenAddress,
  mode,
  onClose,
}: {
  selectedTokenAddress?: string;
  mode: TOKEN_SELECT_MODE;
  onClose: () => void;
}) => {
  const { tokensIn } = useZapState();

  const [tokenToShow, setTokenToShow] = useState<Token | null>(null);
  const [tokenToImport, setTokenToImport] = useState<Token | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([...tokensIn]);

  return (
    <Modal
      isOpen
      onClick={onClose}
      modalContentClass={`bg-layer2 p-0 !max-h-[80vh] ${
        tokenToShow || tokenToImport ? '' : 'pb-6'
      } ${tokenToImport ? 'max-w-[420px]' : 'max-w-[435px]'}`}
    >
      {tokenToShow ? (
        <TokenInfo token={tokenToShow} onGoBack={() => setTokenToShow(null)} />
      ) : tokenToImport ? (
        <TokenImportConfirm
          token={tokenToImport}
          mode={mode}
          selectedTokenAddress={selectedTokenAddress}
          selectedTokens={selectedTokens}
          setTokenToImport={setTokenToImport}
          onGoBack={() => setTokenToImport(null)}
          onClose={onClose}
        />
      ) : (
        <TokenSelector
          selectedTokenAddress={selectedTokenAddress}
          mode={mode}
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

export default TokenSelectorModal;
