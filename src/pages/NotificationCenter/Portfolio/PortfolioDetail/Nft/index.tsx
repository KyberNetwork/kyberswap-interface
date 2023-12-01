import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useGetNftCollectionsQuery } from 'services/portfolio'
import styled from 'styled-components'

import { ReactComponent as NftIcon } from 'assets/svg/nft_icon.svg'
import Column from 'components/Column'
import LocalLoader from 'components/LocalLoader'
import { RowFit } from 'components/Row'
import { EMPTY_ARRAY } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import Breadcrumb from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft/Breadcrumb'
import ListCollection from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft/ListCollection'
import ListNft from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft/ListNft'
import NftDetail from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft/NftDetail'
import useGetNftBreadcrumbData from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft/useGetNftBreadcrumbData'
import { PortfolioSection, SearchPortFolio } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/styled'

const Container = styled(Column)`
  min-height: 300px;
  padding: 0px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0;
  `}
`
const pageSize = isMobile ? 10 : 20
export default function Nft({ walletAddresses, chainIds }: { walletAddresses: string[]; chainIds: ChainId[] }) {
  const [search, setSearch] = useState('')
  const searchDebounce = useDebounce(search, 500)
  const [page, setPage] = useState(1)
  const { nftId = '', colId } = useParsedQueryString<{ nftId: string; colId: string; chainId: string }>()

  const { data, isFetching } = useGetNftCollectionsQuery(
    {
      addresses: walletAddresses,
      chainIds,
      page,
      pageSize,
      search: searchDebounce,
    },
    { skip: !walletAddresses?.length || !!nftId || !!colId },
  )

  const theme = useTheme()
  const formatData = useMemo(() => {
    return data?.data || EMPTY_ARRAY
  }, [data])

  const itemsBreadcrumb = useGetNftBreadcrumbData({})

  return (
    <Column gap="24px">
      {nftId ? (
        <NftDetail />
      ) : (
        <>
          <Breadcrumb items={itemsBreadcrumb} />
          <PortfolioSection
            style={{ minHeight: '300px' }}
            contentStyle={{ padding: 0 }}
            title={
              <RowFit gap="4px" color={theme.subText} alignItems={'center'}>
                <NftIcon style={{ width: 18, height: 18 }} />
                <Trans>NFT Collections</Trans>
              </RowFit>
            }
            actions={
              <SearchPortFolio
                onChange={setSearch}
                value={search}
                placeholder={colId ? t`Search by name or token ID` : t`Search collection`}
              />
            }
          >
            <Container>
              {isFetching ? (
                <LocalLoader style={{ height: 300 }} />
              ) : colId ? (
                <ListNft search={searchDebounce} />
              ) : (
                <ListCollection
                  data={formatData}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  totalItems={data?.totalData || 0}
                />
              )}
            </Container>
          </PortfolioSection>
        </>
      )}
    </Column>
  )
}
