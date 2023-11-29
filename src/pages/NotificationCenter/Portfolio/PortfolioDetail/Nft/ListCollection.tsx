import { Trans } from '@lingui/macro'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import NFTLogoDefault from 'assets/images/portfolio/nft_logo.png'
import Column from 'components/Column'
import Pagination from 'components/Pagination'
import Row, { RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'
import NoData from 'pages/NotificationCenter/Portfolio/PortfolioDetail/NoData'
import { TokenCellWithWalletAddress } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'
import { NFTBalance } from 'pages/NotificationCenter/Portfolio/type'
import { MEDIA_WIDTHS } from 'theme'
import getShortenAddress from 'utils/getShortenAddress'

const CollectionWrapper = styled(Row)<{ hasMorePage: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 20px;
  cursor: pointer;
  ${({ hasMorePage }) =>
    !hasMorePage &&
    css`
      :last-of-type {
        border-bottom: none;
      }
    `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 14px;
  `};
`
const NftCollection = ({
  data: { collectionDetail, wallet, collectibleName, chainID, totalNFT, collectibleAddress },
  onSelect,
  hasMorePage,
}: {
  data: NFTBalance
  onSelect: () => void
  hasMorePage: boolean
}) => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const theme = useTheme()

  const totalNft = (
    <Text fontSize={'14px'} fontWeight={'500'} color={theme.text}>
      <Trans>Owned NFTs: {totalNFT}</Trans>
    </Text>
  )
  return (
    <CollectionWrapper onClick={onSelect} hasMorePage={hasMorePage}>
      <Column gap="8px" flex={1}>
        <TokenCellWithWalletAddress
          style={{ width: 'fit-content', flex: 1 }}
          item={{
            chainId: chainID,
            logoUrl: collectionDetail?.thumbnail || NFTLogoDefault,
            walletAddress: wallet,
            symbol: collectibleName || getShortenAddress(collectibleAddress),
          }}
          walletColor={theme.primary}
        />
        {upToSmall && <Row style={{ paddingLeft: '50px' }}>{totalNft}</Row>}
      </Column>
      {!upToSmall && <RowFit>{totalNft}</RowFit>}
    </CollectionWrapper>
  )
}

export default function ListCollection({
  data,
  page,
  pageSize,
  onPageChange,
  totalItems,
}: {
  data: NFTBalance[]
  pageSize: number
  page: number
  totalItems: number
  onPageChange: (v: number) => void
}) {
  const [params, setParams] = useSearchParams()
  const onSelect = (val: NFTBalance) => {
    params.set('colId', val.collectibleAddress)
    params.set('chainId', val.chainID + '')
    params.set('wallet', val.wallet)
    params.set('colName', val.collectibleName)
    setParams(params)
  }
  return (
    <>
      {data.length ? (
        data.map(el => (
          <NftCollection
            data={el}
            key={el.collectibleAddress}
            onSelect={() => onSelect(el)}
            hasMorePage={totalItems > pageSize}
          />
        ))
      ) : (
        <NoData />
      )}
      <Pagination
        onPageChange={onPageChange}
        currentPage={page}
        pageSize={pageSize}
        totalCount={totalItems}
        style={{ background: 'transparent' }}
      />
    </>
  )
}
