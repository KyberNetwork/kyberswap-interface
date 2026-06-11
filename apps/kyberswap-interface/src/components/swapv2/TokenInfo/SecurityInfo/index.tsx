import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { ReactNode, useMemo } from 'react'
import { useGetSecurityTokenInfoQuery } from 'services/coingecko'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as ContractSecurity } from 'assets/svg/security_contract.svg'
import { ReactComponent as TreadingSecurity } from 'assets/svg/security_trading.svg'
import { CollapseItem, CollapseItemProps } from 'components/Collapse'
import { Container } from 'components/swapv2/TokenInfo'
import Content, { ContentProps } from 'components/swapv2/TokenInfo/SecurityInfo/Content'
import Header from 'components/swapv2/TokenInfo/SecurityInfo/Header'
import { getSecurityTokenInfo } from 'components/swapv2/TokenInfo/utils'

const collapseItemProps: Partial<CollapseItemProps> = {
  animation: true,
  arrowClassName: 'text-subText',
  arrowComponent: <DropdownSVG />,
  expandedOnMount: true,
  headerClassName: 'pr-1.5 hover:brightness-125',
  headerStyle: { background: 'var(--ks-black-48)' },
  maxHeight: '400px',
  style: {
    background: 'var(--ks-black-20)',
    borderRadius: '16px',
    padding: '0',
  },
}

export default function SecurityInfo({ token }: { token: Token | undefined }) {
  const { data, isLoading, error } = useGetSecurityTokenInfoQuery(
    { chainId: token?.chainId as ChainId, address: token?.address ?? '' },
    { skip: !token?.address },
  )

  const { contractData, tradingData, totalWarningContract, totalWarningTrading, totalRiskContract, totalRiskTrading } =
    useMemo(() => getSecurityTokenInfo(error ? undefined : data), [data, error])

  const sections: {
    icon: ReactNode
    title: string
    warning: number
    danger: number
    data: ContentProps['data']
  }[] = [
    {
      icon: <TreadingSecurity />,
      title: t`Trading Security`,
      warning: totalWarningTrading,
      danger: totalRiskTrading,
      data: tradingData,
    },
    {
      icon: <ContractSecurity />,
      title: t`Contract Security`,
      warning: totalWarningContract,
      danger: totalRiskContract,
      data: contractData,
    },
  ]

  return (
    <Container className="gap-4 py-4">
      {sections.map(section => (
        <CollapseItem
          key={section.title}
          {...collapseItemProps}
          header={
            <Header icon={section.icon} title={section.title} warning={section.warning} danger={section.danger} />
          }
        >
          <Content loading={isLoading} data={section.data} totalRisk={section.danger} totalWarning={section.warning} />
        </CollapseItem>
      ))}
    </Container>
  )
}
