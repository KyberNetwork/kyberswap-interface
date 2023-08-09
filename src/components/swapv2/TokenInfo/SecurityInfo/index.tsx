import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo } from 'react'
import { useGetSecurityTokenInfoQuery } from 'services/coingecko'
import { CSSProperties } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as ContractSecurity } from 'assets/svg/security_contract.svg'
import { ReactComponent as TreadingSecurity } from 'assets/svg/security_trading.svg'
import { CollapseItem } from 'components/Collapse'
import { getSecurityTokenInfo } from 'components/swapv2/TokenInfo/utils'
import useTheme from 'hooks/useTheme'

import { Container } from '../index'
import Content from './Content'
import Header from './Header'

export default function SecurityInfo({ token }: { token: Token | undefined }) {
  const theme = useTheme()
  const style: CSSProperties = { background: rgba(theme.buttonBlack, 0.5), borderRadius: '16px', padding: '0' }
  const headerStyle: CSSProperties = { background: rgba(theme.buttonBlack, 0.2) }
  const arrowStyle: CSSProperties = { marginRight: '6px', color: theme.subText }
  const { data, isLoading } = useGetSecurityTokenInfoQuery(
    { chainId: token?.chainId as ChainId, address: token?.address ?? '' },
    { skip: !token?.address },
  )

  const { contractData, tradingData, totalWarningContract, totalWarningTrading, totalRiskContract, totalRiskTrading } =
    useMemo(() => getSecurityTokenInfo(data), [data])

  return (
    <Container>
      <CollapseItem
        expandedOnMount
        arrowStyle={arrowStyle}
        headerStyle={headerStyle}
        style={style}
        headerBorderRadius="16px"
        header={
          <Header
            icon={<TreadingSecurity />}
            title={t`Trading Security`}
            warning={totalWarningTrading}
            danger={totalRiskTrading}
          />
        }
        arrowComponent={<DropdownSVG />}
      >
        <Content
          loading={isLoading}
          data={tradingData}
          totalRisk={totalRiskTrading}
          totalWarning={totalWarningTrading}
        />
      </CollapseItem>

      <CollapseItem
        arrowStyle={arrowStyle}
        headerStyle={headerStyle}
        style={style}
        headerBorderRadius="16px"
        header={
          <Header
            icon={<ContractSecurity />}
            title={t`Contract Security`}
            warning={totalWarningContract}
            danger={totalRiskContract}
          />
        }
        arrowComponent={<DropdownSVG />}
      >
        <Content
          loading={isLoading}
          data={contractData}
          totalRisk={totalRiskContract}
          totalWarning={totalWarningContract}
        />
      </CollapseItem>
    </Container>
  )
}
