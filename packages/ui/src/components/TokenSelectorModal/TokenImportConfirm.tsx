import { useLingui } from '@lingui/react';

import { useCopy } from '@kyber/hooks';
import { ChainId, Token } from '@kyber/schema';
import { getEtherscanLink } from '@kyber/utils';
import { shortenAddress } from '@kyber/utils/crypto';

import IconAlertTriangle from '@/components/TokenSelectorModal/assets/alert-triangle.svg?react';
import IconBack from '@/components/TokenSelectorModal/assets/arrow-left.svg?react';
import IconExternalLink from '@/components/TokenSelectorModal/assets/external-link.svg?react';
import X from '@/components/TokenSelectorModal/assets/x.svg?react';
import TokenLogo from '@/components/token-logo';
import { Button } from '@/components/ui/button';

const TokenImportConfirm = ({
  chainId,
  token,
  handleConfirmImportToken,
  onGoBack,
  onClose,
}: {
  chainId: ChainId;
  token: Token;
  handleConfirmImportToken: () => void;
  onGoBack: () => void;
  onClose: () => void;
}) => {
  const { i18n } = useLingui();
  const Copy = useCopy({ text: token.address });

  const handleOpenExternalLink = () => {
    const externalLink = getEtherscanLink(chainId, token.address, 'address');
    if (externalLink && window) window.open(externalLink, '_blank');
  };

  return (
    <div className="w-full text-white">
      <div className="flex items-center justify-between p-4 pb-2 border-b border-[#40444f]">
        <IconBack className="w-6 h-6 cursor-pointer hover:text-subText" onClick={onGoBack} />
        <span className="text-xl">{i18n._('Import Token')}</span>
        <X className="cursor-pointer hover:text-subText" onClick={onClose} />
      </div>
      <div className="p-4 flex flex-col gap-4">
        <div className="bg-warning-200 p-[15px] flex rounded-md text-warning items-start gap-2">
          <IconAlertTriangle className="h-[18px]" />
          <p className="text-sm">
            {i18n._("This token isn't frequently swapped. Please do your own research before trading.")}
          </p>
        </div>
        <div className="bg-[#0f0f0f] rounded-md p-8 flex gap-[10px] items-start">
          <TokenLogo src={token.logo} size={44} />
          <div className="flex flex-col gap-1">
            <p className="text-lg">{token.symbol}</p>
            <p className="text-subText text-sm">{token.name}</p>
            <p className="text-xs flex items-center gap-[5px]">
              <span>{i18n._('Address: {address}', { address: shortenAddress(token.address, 7) })}</span>
              {Copy}
              <IconExternalLink
                className="w-4 text-subText hover:text-text cursor-pointer"
                onClick={handleOpenExternalLink}
              />
            </p>
          </div>
        </div>
        <Button className="ks-primary-btn" onClick={handleConfirmImportToken}>
          {i18n._('I understand')}
        </Button>
      </div>
    </div>
  );
};

export default TokenImportConfirm;
