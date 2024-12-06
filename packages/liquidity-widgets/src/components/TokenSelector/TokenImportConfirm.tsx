import { useEffect, useState } from "react";
import { CircleCheckBig, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/components/TokenInfo/utils";
import { getEtherscanLink } from "@/utils";
import { useTokenList } from "@/hooks/useTokenList";
import { TOKEN_SELECT_MODE } from ".";
import IconBack from "@/assets/svg/arrow-left.svg";
import IconAlertTriangle from "@/assets/svg/alert-triangle.svg";
import IconCopy from "@/assets/svg/copy.svg";
import IconExternalLink from "@/assets/svg/external-link.svg";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import { useZapState } from "@/hooks/useZapInState";
import { MAX_ZAP_IN_TOKENS } from "@/constants";
import { Token } from "@/schema";
import { useWidgetContext } from "@/stores/widget";

const COPY_TIMEOUT = 2000;
let hideCopied: NodeJS.Timeout;

const TokenImportConfirm = ({
  token,
  mode,
  selectedTokenAddress,
  selectedTokens,
  setTokenToImport,
  onGoBack,
  onClose,
}: {
  token: Token;
  mode: TOKEN_SELECT_MODE;
  selectedTokenAddress?: string;
  selectedTokens?: Token[];
  setTokenToImport: (token: Token | null) => void;
  onGoBack: () => void;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const chainId = useWidgetContext((s) => s.chainId);

  const { tokensIn, setTokensIn, amountsIn, setAmountsIn } = useZapState();
  const { addToken } = useTokenList();

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(token.address);
      setCopied(true);
    }
  };

  const handleOpenExternalLink = () => {
    const externalLink = getEtherscanLink(chainId, token.address, "address");
    if (externalLink && window) window.open(externalLink, "_blank");
  };

  const handleAddToken = () => {
    addToken(token);
    if (mode === TOKEN_SELECT_MODE.SELECT) {
      const index = tokensIn.findIndex(
        (tokenIn: Token) => tokenIn.address === selectedTokenAddress
      );
      if (index > -1) {
        const clonedTokensIn = [...tokensIn];
        clonedTokensIn[index] = token;
        setTokensIn(clonedTokensIn);

        const listAmountsIn = amountsIn.split(",");
        listAmountsIn[index] = "";
        setAmountsIn(listAmountsIn.join(","));

        onClose();
      }
    } else if ((selectedTokens || []).length < MAX_ZAP_IN_TOKENS) {
      const clonedTokensIn = [...tokensIn];
      clonedTokensIn.push(token);
      setTokensIn(clonedTokensIn);
      setAmountsIn(`${amountsIn},`);
    }
    setTokenToImport(null);
  };

  useEffect(() => {
    if (copied) {
      hideCopied = setTimeout(() => setCopied(false), COPY_TIMEOUT);
    }

    return () => {
      clearTimeout(hideCopied);
    };
  }, [copied]);

  return (
    <div className="w-full text-white">
      <div className="flex items-center justify-between p-4 pb-2 border-b border-[#40444f]">
        <IconBack
          className="w-6 h-6 cursor-pointer hover:text-subText"
          onClick={onGoBack}
        />
        <span className="text-xl">Import Token</span>
        <X className="cursor-pointer hover:text-subText" onClick={onClose} />
      </div>
      <div className="p-4 flex flex-col gap-4">
        <div className="bg-warning-200 p-[15px] flex rounded-md text-warning items-start gap-2">
          <IconAlertTriangle className="h-[18px]" />
          <p className="text-sm">
            This token isn’t frequently swapped. Please do your own research
            before trading.
          </p>
        </div>
        <div className="bg-[#0f0f0f] rounded-md p-8 flex gap-[10px] items-start">
          <img
            className="w-[44px] h-[44px]"
            src={token.logo}
            alt="token logo"
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              currentTarget.src = defaultTokenLogo;
            }}
          />
          <div className="flex flex-col gap-1">
            <p className="text-lg">{token.symbol}</p>
            <p className="text-subText text-sm">{token.name}</p>
            <p className="text-xs flex items-center gap-[5px]">
              <span>Address: {shortenAddress(chainId, token.address, 7)}</span>
              {!copied ? (
                <IconCopy
                  className="w-[14px] h-[14px] text-subText hover:text-text cursor-pointer"
                  onClick={handleCopy}
                />
              ) : (
                <CircleCheckBig className="w-[14px] h-[14px] text-accent" />
              )}
              <IconExternalLink
                className="w-4 text-subText hover:text-text cursor-pointer"
                onClick={handleOpenExternalLink}
              />
            </p>
          </div>
        </div>
        <Button onClick={handleAddToken}>I understand</Button>
      </div>
    </div>
  );
};

export default TokenImportConfirm;
