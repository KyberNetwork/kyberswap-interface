import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGetNftCollectionsQuery, useGetNftDetailQuery } from 'services/portfolio'

import { ReactComponent as NftIcon } from 'assets/svg/nft_icon.svg'
import Column from 'components/Column'
import LocalLoader from 'components/LocalLoader'
import { RowFit } from 'components/Row'
import SearchInput from 'components/SearchInput'
import { EMPTY_ARRAY } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import Breadcrumb, { BreadcrumbItem } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft/Breadcrumb'
import ListCollection from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft/ListCollection'
import ListNft from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft/ListNft'
import NftDetail from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft/NftDetail'
import { NFTBalance } from 'pages/NotificationCenter/Portfolio/type'
import { Section } from 'pages/TrueSightV2/components'

// todo all tab search multi address: tab tokens
const pageSize = 10
export default function Nft({ walletAddresses, chainIds }: { walletAddresses: string[]; chainIds: ChainId[] }) {
  const [search, setSearch] = useState('')
  const searchDebounce = useDebounce(search, 500)
  const [currentCollection, setCurrentNftCollection] = useState<NFTBalance>()
  const [, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const { token = '', chainId, nftId = '' } = useParsedQueryString<{ nftId: string; token: string; chainId: string }>()

  const { data, isFetching } = useGetNftCollectionsQuery(
    {
      addresses: walletAddresses,
      chainIds,
      page,
      pageSize,
      search: searchDebounce,
    },
    { skip: !walletAddresses?.length },
  )

  // todo consider split new page
  const skipDetail = !nftId || !token || !chainId
  const {
    data: dataDetail,
    isFetching: isFetchingDetail,
    refetch,
  } = useGetNftDetailQuery(
    {
      address: token,
      chainId: +(chainId || ChainId.MAINNET) as ChainId,
      tokenID: nftId,
    },
    { skip: !nftId || !token || !chainId },
  )
  const nftDetail = skipDetail ? undefined : dataDetail

  const theme = useTheme()
  const formatData = useMemo(() => {
    return data?.data || EMPTY_ARRAY
  }, [data])

  const itemsBreadcrumb = useMemo(() => {
    if (!currentCollection) return []
    return [
      {
        path: 'index',
        title: t`NFTs`,
        onClick: () => {
          setSearchParams(new URLSearchParams())
          setCurrentNftCollection(undefined)
        },
      },
      {
        title: currentCollection.collectibleName,
        onClick: () => {
          setSearchParams(new URLSearchParams())
        },
      },
      nftDetail ? { title: nftDetail?.item?.externalData?.name || t`Unknown` } : null,
    ].filter(Boolean) as BreadcrumbItem[]
  }, [currentCollection, nftDetail, setSearchParams])

  return (
    <Column gap="24px">
      <Breadcrumb items={itemsBreadcrumb} />
      {nftDetail ? (
        <NftDetail data={nftDetail} isFetching={isFetchingDetail} refetch={refetch} />
      ) : (
        <Section
          style={{ minHeight: '300px' }}
          title={
            <RowFit gap="4px" color={theme.subText} alignItems={'center'}>
              <NftIcon style={{ width: 18, height: 18 }} />
              <Trans>NFT Collections</Trans>
            </RowFit>
          }
          actions={
            <SearchInput
              onChange={setSearch}
              value={search}
              placeholder={t`Search by token symbol or token address`}
              style={{
                width: 330,
                height: 32,
                backgroundColor: theme.buttonBlack,
                border: `1px solid ${theme.buttonGray}`,
              }}
            />
          }
        >
          <Column gap="16px" style={{ padding: '0px 8px', flex: 1 }}>
            {isFetching ? (
              <LocalLoader />
            ) : currentCollection ? (
              <ListNft nftCollection={currentCollection} />
            ) : (
              <ListCollection
                data={formatData}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onSelect={setCurrentNftCollection}
                totalItems={data?.totalData || 0}
              />
            )}
          </Column>
        </Section>
      )}
    </Column>
  )
}
