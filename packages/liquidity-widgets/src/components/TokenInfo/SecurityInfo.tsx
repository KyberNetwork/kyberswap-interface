import { useMemo } from 'react';

import { ChainId, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, Theme, Token } from '@kyber/schema';
import { MouseoverTooltip } from '@kyber/ui';

import LogoGoPlus from '@/assets/svg/goplus.svg';
import IconSecurityContract from '@/assets/svg/security-contract.svg';
import IconSecurityTrading from '@/assets/svg/security-trading.svg';
import IconSecurity from '@/assets/svg/security.svg';
import CollapseInfoItem from '@/components/TokenInfo/CollapseInfoItem';
import useSecurityTokenInfo from '@/components/TokenInfo/useSecurityTokenInfo';

const SecurityInfo = ({ token, theme, chainId }: { token: Token; theme: Theme; chainId: ChainId }) => {
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

  const { securityInfo, loading } = useSecurityTokenInfo(tokenAddress);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 text-text" style={{ background: `${theme.icons}33` }}>
        <div className="flex items-center gap-2">
          {' '}
          <IconSecurity className="h-6 w-6" />
          <MouseoverTooltip
            text="Token security info provided by Goplus. Please conduct your own research before trading"
            width="250px"
          >
            <span className="border-dashed border-b border-text">Security Info</span>
          </MouseoverTooltip>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-subText text-[10px]">Powered by</span> <LogoGoPlus className="h-4 w-14" />
        </div>
      </div>
      <div className="flex flex-col gap-[14px] p-[14px]">
        <CollapseInfoItem
          icon={<IconSecurityTrading />}
          title={`Trading Security`}
          warning={securityInfo.totalWarningTrading}
          danger={securityInfo.totalRiskTrading}
          loading={loading}
          data={securityInfo.tradingData}
          totalRisk={securityInfo.totalRiskTrading}
          totalWarning={securityInfo.totalWarningTrading}
        />
        <CollapseInfoItem
          icon={<IconSecurityContract />}
          title={`Contract Security`}
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
