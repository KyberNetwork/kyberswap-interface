import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Send } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { Text } from 'rebass'
import { useGetNftDetailQuery } from 'services/portfolio'
import styled from 'styled-components'

import NFTLogoDefault from 'assets/images/portfolio/nft_logo.png'
import { ReactComponent as RefreshIcon } from 'assets/svg/refresh.svg'
import { ButtonAction, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Row, { RowBetween, RowFit } from 'components/Row'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import Breadcrumb from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft/Breadcrumb'
import useGetNftBreadcrumbData from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft/useGetNftBreadcrumbData'
import { NFTAttributes, NFTTokenDetail } from 'pages/NotificationCenter/Portfolio/type'
import { ExternalLinkIcon } from 'theme'
import { getEtherscanLink, isAddress } from 'utils'

const Card = styled.div`
  border-radius: 20px;
  background-color: ${({ theme }) => theme.buttonGray};
  padding: 16px;
`

const NFTImage = styled.img`
  border-radius: 20px;
  width: 100%;
  object-fit: cover;
`

const AttributeItem = styled.div`
  border-radius: 12px;
  background-color: ${({ theme }) => theme.buttonGray};
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.label`
  font-size: 14px;
  line-height: 20px;
  text-transform: capitalize;
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
`

const Value = styled.label`
  font-size: 16px;
  text-transform: capitalize;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`

const AttributeLabel = styled(Label)`
  width: 130px;
`

const Attribute = ({ data }: { data: NFTAttributes }) => {
  return (
    <AttributeItem>
      <Label>{data.trait_type}</Label>
      <Value>{data.value}</Value>
    </AttributeItem>
  )
}

const Divider = styled.div`
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
  border-top: 1px solid ${({ theme }) => theme.border};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-left: 16px;
    padding-right: 16px;
  `}
`
const nftDefault: NFTTokenDetail = {
  collectibleName: '',
  collectibleAddress: '',
  chainID: 1,
  wallet: '',
  collectibleLogo: '',
  collectibleSymbol: '',
  nftType: '',
  totalNFT: 0,
  collectionDetail: {} as any,
  item: { externalData: { name: '', description: '', image: '', animation: '', attributes: null } } as any,
}
export default function NftDetail() {
  const { colId = '', chainId, nftId = '' } = useParsedQueryString<{ nftId: string; colId: string; chainId: string }>()

  const skipDetail = !nftId || !isAddress(ChainId.MAINNET, colId) || !chainId
  const { data, isFetching, refetch } = useGetNftDetailQuery(
    {
      address: colId,
      chainId: +(chainId || ChainId.MAINNET) as ChainId,
      tokenID: nftId,
    },
    { skip: skipDetail },
  )
  const itemsBreadcrumb = useGetNftBreadcrumbData({ nftDetail: data })

  const theme = useTheme()
  const {
    collectibleAddress,
    item: { externalData, tokenID, chainID, lastSalePrice, paymentToken, currentPrice },
  } = data || nftDefault

  const name = externalData?.name || t`Unknown`

  return (
    <>
      <Breadcrumb items={itemsBreadcrumb} />
      <Column gap="24px">
        <RowBetween gap="24px" align={'flex-start'}>
          <Column width={'360px'} gap="16px" justifyContent={'flex-start'}>
            <Card>
              {isFetching ? (
                <Skeleton
                  height="328px"
                  baseColor={theme.background}
                  highlightColor={theme.buttonGray}
                  borderRadius="1rem"
                />
              ) : (
                <NFTImage src={externalData.image || NFTLogoDefault} />
              )}
            </Card>
            {externalData.description && (
              <Card style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}>
                <Value>
                  <Trans>Description</Trans>
                </Value>
                <Label>{externalData.description}</Label>
              </Card>
            )}
          </Column>
          <Column flex={1} gap="24px">
            <RowBetween>
              <Text fontSize={'20px'} fontWeight={'500'} color={theme.text}>
                {name}
              </Text>

              <RowFit color={theme.subText} gap="10px">
                <ButtonAction onClick={isFetching ? undefined : refetch} style={{ padding: '4px' }}>
                  <RefreshIcon style={{ width: '18px', height: '18px' }} />
                </ButtonAction>

                <ButtonAction onClick={isFetching ? undefined : refetch} style={{ padding: '4px' }}>
                  <ExternalLinkIcon
                    size={18}
                    href={`${getEtherscanLink(chainID, collectibleAddress, 'token')}?a=${tokenID}`}
                    color={theme.subText}
                  />
                </ButtonAction>
              </RowFit>
            </RowBetween>

            <Divider />

            <Column gap="12px">
              <Row>
                <AttributeLabel>
                  <Trans>Token ID</Trans>
                </AttributeLabel>
                <Value>{tokenID}</Value>
              </Row>

              <Row>
                <AttributeLabel>
                  <Trans>Chain</Trans>
                </AttributeLabel>
                <Value>{NETWORKS_INFO[chainID].name}</Value>
              </Row>

              <Row>
                <AttributeLabel>
                  <Trans>Last Sales Price</Trans>
                </AttributeLabel>
                <Value>{lastSalePrice ? `${lastSalePrice} ${paymentToken}` : '--'}</Value>
              </Row>

              <Row>
                <AttributeLabel>
                  <Trans>Current Price</Trans>
                </AttributeLabel>
                <Value>{currentPrice ? `${currentPrice} ${paymentToken}` : '--'}</Value>
              </Row>

              <ButtonPrimary height={'36px'} width={'150px'}>
                <Send size={17} />
                &nbsp;Transfer
              </ButtonPrimary>
            </Column>
            {externalData?.attributes && (
              <>
                <Divider />
                <Value>
                  <Trans>Attributes</Trans>
                </Value>
                <Row flexWrap={'wrap'} gap="16px">
                  {externalData?.attributes?.map(el => (
                    <Attribute key={el.trait_type} data={el} />
                  ))}
                </Row>
              </>
            )}
          </Column>
        </RowBetween>
      </Column>
    </>
  )
}
