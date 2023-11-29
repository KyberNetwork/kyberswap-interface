import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useSearchParams } from 'react-router-dom'
import { Text } from 'rebass'
import { useGetNftCollectionDetailQuery } from 'services/portfolio'
import styled from 'styled-components'

import NFTLogoDefault from 'assets/images/portfolio/nft_logo.png'
import Column from 'components/Column'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import NoData from 'pages/NotificationCenter/Portfolio/PortfolioDetail/NoData'
import { NFTDetail } from 'pages/NotificationCenter/Portfolio/type'
import { isAddress } from 'utils'

const ItemWrapper = styled(Column)`
  border-radius: 20px;
  background-color: ${({ theme }) => theme.buttonGray};
  padding: 16px;
  gap: 12px;
  cursor: pointer;
  :hover {
    background: linear-gradient(225deg, rgba(21, 190, 176, 0.08) 27.6%, rgba(44, 158, 196, 0.08) 91.67%),
      linear-gradient(135deg, rgba(49, 203, 158, 0.08) 35.41%, rgba(143, 146, 255, 0.08) 100%), #0f0f0f;
  }
`
const NftItem = ({
  data: { tokenID, collectibleName, externalData, collectibleAddress, chainID },
}: {
  data: NFTDetail
}) => {
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const onClick = () => {
    searchParams.set('nftId', tokenID)
    searchParams.set('token', collectibleAddress)
    searchParams.set('chainId', chainID + '')
    setSearchParams(searchParams)
  }
  return (
    <ItemWrapper onClick={onClick}>
      <img style={{ height: 200, borderRadius: 20, objectFit: 'cover' }} src={externalData?.image || NFTLogoDefault} />
      <Text fontSize={'20px'} color={theme.text} fontWeight={'500'}>
        <Trans>
          {collectibleName} #{tokenID}
        </Trans>
      </Text>
      <Text color={theme.subText} fontSize={'14px'}>
        <Trans>Token ID: {tokenID}</Trans>
      </Text>
    </ItemWrapper>
  )
}
const Wrapper = styled.div`
  justify-content: space-around;
  padding: 20px 20px 20px 20px;
  gap: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, min(100vw, 300px));
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 20px 10px 0px 10px;
    gap: 20px 10px;
    grid-template-columns: repeat(auto-fill, min(100vw, 250px));
  `}
`

const pageSize = isMobile ? 5 : 20
export default function ListNft({ search }: { search: string }) {
  const {
    colId = '',
    chainId,
    wallet = '',
  } = useParsedQueryString<{ nftId: string; colId: string; chainId: string; wallet: string }>()
  const [page, setPage] = useState(1)
  const { data, isFetching } = useGetNftCollectionDetailQuery(
    {
      address: wallet,
      search,
      chainId: +(chainId || ChainId.MAINNET) as ChainId,
      collectionAddress: colId,
      page,
      pageSize,
    },
    { skip: !isAddress(ChainId.MAINNET, colId) || !chainId || !isAddress(ChainId.MAINNET, wallet) },
  )

  return (
    <>
      {isFetching ? (
        <LocalLoader />
      ) : (
        <Wrapper>
          {data?.items?.length ? data?.items.map(el => <NftItem data={el} key={el.collectibleAddress} />) : <NoData />}
        </Wrapper>
      )}
      <Pagination
        totalCount={data?.totalNFT || 0}
        currentPage={page}
        onPageChange={setPage}
        pageSize={pageSize}
        style={{ background: 'transparent' }}
      />
    </>
  )
}
