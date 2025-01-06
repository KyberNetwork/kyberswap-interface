import { useState } from "react";
import TokenImportConfirm from "./TokenImportConfirm";
import TokenSelector from ".";
import { ChainId, Token } from "@/schema";
import Modal from "@/components/Modal";
import TokenInfo from "@/components/TokenInfo";
import useTokenBalances from "@/hooks/useTokenBalances";
import { useTokenList } from "@/hooks/useTokenList";
import { useZapOutContext } from "@/stores/zapout";

const TokenSelectorModal = ({
  onClose,
  chainId,
}: {
  onClose: () => void;
  chainId: ChainId;
}) => {
  const [tokenToShow, setTokenToShow] = useState<Token | null>(null);
  const [tokenToImport, setTokenToImport] = useState<Token | null>(null);

  const { connectedAccount } = useZapOutContext((s) => s);
  const { address: account } = connectedAccount;

  const { allTokens } = useTokenList();
  const { balances: balanceTokens } = useTokenBalances(
    chainId,
    allTokens.map((item) => item.address),
    account
  );

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
          setTokenToImport={setTokenToImport}
          onGoBack={() => setTokenToImport(null)}
          onClose={onClose}
          chainId={chainId}
        />
      ) : (
        <TokenSelector
          setTokenToShow={setTokenToShow}
          setTokenToImport={setTokenToImport}
          onClose={onClose}
          balanceTokens={balanceTokens}
        />
      )}
    </Modal>
  );
};

export default TokenSelectorModal;
