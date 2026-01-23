import { useMemo } from 'react';

import { useLingui } from '@lingui/react';

import { ChainId, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, Token } from '@kyber/schema';

import CollapseInfoItem from '@/components/TokenSelectorModal/TokenInfo/CollapseInfoItem';
import useSecurityTokenInfo from '@/components/TokenSelectorModal/TokenInfo/useSecurityTokenInfo';
import LogoGoPlus from '@/components/TokenSelectorModal/assets/goplus.svg?react';
import IconSecurityContract from '@/components/TokenSelectorModal/assets/security-contract.svg?react';
import IconSecurityTrading from '@/components/TokenSelectorModal/assets/security-trading.svg?react';
import IconSecurity from '@/components/TokenSelectorModal/assets/security.svg?react';
import { MouseoverTooltip } from '@/components/Tooltip';

const SecurityInfo = ({ token, chainId }: { token: Token; chainId: ChainId }) => {
  const { i18n } = useLingui();
  const tokenAddress = useMemo(
    () =>
      (token?.address
        ? token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NETWORKS_INFO[chainId].wrappedToken.address
          : token.address
        : ''
      ).toLowerCase(),
    [token, chainId],
  );

  const { securityInfo, loading } = useSecurityTokenInfo({ tokenAddress, chainId, i18n });

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 text-text bg-icon-200">
        <div className="flex items-center gap-2">
          <IconSecurity className="h-6 w-6" />
          <MouseoverTooltip
            text={i18n._('Token security info provided by Goplus. Please conduct your own research before trading')}
            width="250px"
          >
            <span className="border-dashed border-b border-text">{i18n._('Security Info')}</span>
          </MouseoverTooltip>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-subText text-[10px]">{i18n._('Powered by')}</span> <LogoGoPlus className="h-4 w-14" />
        </div>
      </div>
      <div className="flex flex-col gap-[14px] p-[14px]">
        <CollapseInfoItem
          icon={<IconSecurityTrading />}
          title={i18n._('Trading Security')}
          warning={securityInfo.totalWarningTrading}
          danger={securityInfo.totalRiskTrading}
          loading={loading}
          data={securityInfo.tradingData}
          totalRisk={securityInfo.totalRiskTrading}
          totalWarning={securityInfo.totalWarningTrading}
        />
        <CollapseInfoItem
          icon={<IconSecurityContract />}
          title={i18n._('Contract Security')}
          warning={securityInfo.totalWarningContract}
          danger={securityInfo.totalRiskContract}
          loading={loading}
          data={securityInfo.contractData}
          totalRisk={securityInfo.totalRiskContract}
          totalWarning={securityInfo.totalWarningContract}
        />
      </div>
    </>
  );
};

export default SecurityInfo;
