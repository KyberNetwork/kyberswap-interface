import { Trans } from '@lingui/macro'
import { useSearchParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import NFTLogoDefault from 'assets/images/portfolio/nft_logo.png'
import Pagination from 'components/Pagination'
import Row, { RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'
import NoData from 'pages/NotificationCenter/Portfolio/PortfolioDetail/NoData'
import { TokenCellWithWalletAddress } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'
import { NFTBalance } from 'pages/NotificationCenter/Portfolio/type'
import getShortenAddress from 'utils/getShortenAddress'

const CollectionWrapper = styled(Row)`
  background-color: ${({ theme }) => theme.buttonGray};
  border-radius: 16px;
  padding: 16px 20px;
  cursor: pointer;
`
const NftCollection = ({
  data: { collectionDetail, wallet, collectibleName, chainID, totalNFT, collectibleAddress },
  onSelect,
}: {
  data: NFTBalance
  onSelect: () => void
}) => {
  const theme = useTheme()
  return (
    <CollectionWrapper onClick={onSelect}>
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
      <RowFit>
        <Text fontSize={'14px'} color={theme.subText}>
          <Trans>Owned NFTs: {totalNFT}</Trans>
        </Text>
      </RowFit>
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
        data.map(el => <NftCollection data={el} key={el.collectibleAddress} onSelect={() => onSelect(el)} />)
      ) : (
        <NoData />
      )}
      <Pagination onPageChange={onPageChange} currentPage={page} pageSize={pageSize} totalCount={totalItems} />
    </>
  )
}
