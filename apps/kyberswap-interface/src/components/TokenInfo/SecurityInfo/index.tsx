import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { ReactNode, useMemo } from 'react'
import { useGetSecurityTokenInfoQuery } from 'services/coingecko'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as ContractSecurity } from 'assets/svg/security_contract.svg'
import { ReactComponent as TreadingSecurity } from 'assets/svg/security_trading.svg'
import { CollapseItem, CollapseItemProps } from 'components/Collapse'
import Content, { ContentProps } from 'components/TokenInfo/SecurityInfo/Content'
import { Header } from 'components/TokenInfo/SecurityInfo/Header'
import { getSecurityTokenInfo } from 'components/TokenInfo/utils'

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

/** Queries security metadata by token chain/address. Use currentData so a new token never shows the previous result. */
const SecurityInfo = ({ token }: { token: Token | undefined }) => {
  const {
    currentData: data,
    isFetching,
    error,
  } = useGetSecurityTokenInfoQuery(
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
    <div className="flex flex-col gap-3 p-4">
      {sections.map(section => (
        <CollapseItem
          key={section.title}
          {...collapseItemProps}
          header={
            <Header icon={section.icon} title={section.title} warning={section.warning} danger={section.danger} />
          }
        >
          <Content loading={isFetching} data={section.data} totalRisk={section.danger} totalWarning={section.warning} />
        </CollapseItem>
      ))}
    </div>
  )
}

export default SecurityInfo
