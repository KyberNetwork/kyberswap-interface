import { useState } from "react";
import { Token } from "@/entities/Pool";
import { useZapState } from "@/hooks/useZapInState";
import TokenImportConfirm from "./TokenImportConfirm";
import TokenInfo from "../TokenInfo";
import TokenSelector, { TOKEN_SELECT_MODE } from ".";
import Modal from "../Modal";

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
        tokenToShow || tokenToImport ? "" : "pb-6"
      } ${tokenToImport ? "max-w-[420px]" : "max-w-[435px]"}`}
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
