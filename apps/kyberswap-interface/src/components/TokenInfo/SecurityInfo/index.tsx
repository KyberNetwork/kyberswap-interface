import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { ReactNode, useMemo } from 'react'
import { useGetSecurityTokenInfoQuery } from 'services/coingecko'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as ContractSecurity } from 'assets/svg/security_contract.svg'
import { ReactComponent as TreadingSecurity } from 'assets/svg/security_trading.svg'
import { Collapse } from 'components/Collapse'
import Content, { ContentProps } from 'components/TokenInfo/SecurityInfo/Content'
import { Header } from 'components/TokenInfo/SecurityInfo/Header'
import { getSecurityTokenInfo } from 'components/TokenInfo/utils'
import { cn } from 'utils/cn'

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
        <div key={section.title} className="overflow-hidden rounded-2xl bg-black-20">
          <Collapse
            defaultOpen
            className="duration-300"
            trigger={({ open, buttonProps }) => (
              <button
                {...buttonProps}
                className="flex w-full cursor-pointer items-center justify-between border-0 bg-black-48 p-0 pr-1.5 text-left hover:brightness-125"
              >
                <Header icon={section.icon} title={section.title} warning={section.warning} danger={section.danger} />
                <DropdownSVG
                  className={cn(
                    'size-8 shrink-0 text-subText transition-transform duration-200 motion-reduce:transition-none',
                    open && 'rotate-180',
                  )}
                />
              </button>
            )}
          >
            <Content
              loading={isFetching}
              data={section.data}
              totalRisk={section.danger}
              totalWarning={section.warning}
            />
          </Collapse>
        </div>
      ))}
    </div>
  )
}

export default SecurityInfo
