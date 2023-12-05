import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useState } from 'react'

import useDebounce from 'hooks/useDebounce'
import { PortfolioSection, SearchPortFolio } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/styled'

export default function Liquidity({ walletAddresses, chainIds }: { chainIds: ChainId[]; walletAddresses: string[] }) {
  const [search, setSearch] = useState('')
  const searchDebounce = useDebounce(search, 500)

  //   const {data} = useGetLiquidityPortfolioQuery() // todo

  return (
    <PortfolioSection
      title={t`KyberSwap Classic`}
      actions={
        <SearchPortFolio onChange={setSearch} value={search} placeholder={t`Search by token symbol or token address`} />
      }
    >
      {
        // use components/Table or create new table
      }
      <div>Test {searchDebounce}</div>
    </PortfolioSection>
  )
}
