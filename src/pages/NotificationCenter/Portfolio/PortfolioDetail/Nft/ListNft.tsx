import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Text } from 'rebass'
import { useGetNftCollectionDetailQuery } from 'services/portfolio'
import styled from 'styled-components'

import NFTLogoDefault from 'assets/images/portfolio/nft_logo.png'
import Column from 'components/Column'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import useTheme from 'hooks/useTheme'
import { NFTBalance, NFTDetail } from 'pages/NotificationCenter/Portfolio/type'

const ItemWrapper = styled(Column)`
  border-radius: 20px;
  background-color: ${({ theme }) => theme.buttonGray};
  flex-basis: 300px;
  padding: 16px;
  gap: 12px;
  cursor: pointer;
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
        <Trans>Token Id: {tokenID}</Trans>
      </Text>
    </ItemWrapper>
  )
}
const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`

const pageSize = 20
export default function ListNft({ nftCollection }: { nftCollection: NFTBalance }) {
  const { chainID, wallet, collectibleAddress } = nftCollection
  const [page, setPage] = useState(1)
  const { data, isFetching } = useGetNftCollectionDetailQuery({
    address: wallet,
    search: '',
    chainId: chainID,
    collectionAddress: collectibleAddress,
    page,
    pageSize,
  })

  return (
    <>
      {isFetching && <LocalLoader />}
      <Wrapper style={{ justifyContent: Number(data?.items?.length) > 3 ? 'space-around' : 'flex-start' }}>
        {data?.items.map(el => (
          <NftItem data={el} key={el.collectibleAddress} />
        ))}
      </Wrapper>
      <Pagination totalCount={data?.totalNFT || 0} currentPage={page} onPageChange={setPage} pageSize={pageSize} />
    </>
  )
}
