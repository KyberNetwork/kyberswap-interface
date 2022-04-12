import React from 'react'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import styled from 'styled-components'
import { Flex, Image, Text } from 'rebass'
import Gold from 'assets/svg/gold_icon.svg'
import Silver from 'assets/svg/silver_icon.svg'
import Bronze from 'assets/svg/bronze_icon.svg'
import { rgba } from 'polished'
import { Info } from 'react-feather'
import { ButtonEmpty } from 'components/Button'
import useTheme from 'hooks/useTheme'
import { MoneyBag } from 'components/Icons'
import { formattedNum } from 'utils'
import { Link } from 'react-router-dom'
import { TRUESIGHT_NETWORK_TO_CHAINID } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { ChainId } from '@dynamic-amm/sdk'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'

const TopTrendingSoonTokenItem = ({
  tokenData,
  top,
  setSelectedToken,
}: {
  tokenData: TrueSightTokenData
  top: number
  setSelectedToken: React.Dispatch<React.SetStateAction<TrueSightTokenData | undefined>>
}) => {
  const theme = useTheme()

  const { chainId = ChainId.MAINNET } = useActiveWeb3React()
  const currentNetworkIndex = Object.values(TRUESIGHT_NETWORK_TO_CHAINID).indexOf(chainId)
  const currentNetwork = Object.keys(TRUESIGHT_NETWORK_TO_CHAINID)[currentNetworkIndex]
  const toggleTrendingSoonTokenDetailModal = useToggleModal(ApplicationModal.TRENDING_SOON_TOKEN_DETAIL)

  return (
    <Container>
      <Flex style={{ gap: '4px' }} alignItems="flex-start">
        {top <= 2 && (
          <Image
            src={top === 0 ? Gold : top === 1 ? Silver : Bronze}
            style={{ minWidth: '12px', width: '12px', marginTop: '2px' }}
          />
        )}
        <Flex flexDirection="column" style={{ gap: '10px' }}>
          <Flex style={{ gap: '4px' }} alignItems="center">
            <Image
              src={tokenData.logo_url}
              minWidth="16px"
              width="16px"
              minHeight="16px"
              height="16px"
              style={{ borderRadius: '50%' }}
            />
            <Text fontSize="14px" mr="5px" color={theme.subText}>
              {tokenData.symbol}
            </Text>
            <ButtonEmpty
              padding="0"
              onClick={() => {
                setSelectedToken(tokenData)
                toggleTrendingSoonTokenDetailModal()
              }}
              style={{
                background: rgba(theme.buttonGray, 0.2),
                minWidth: '20px',
                minHeight: '20px',
                width: '20px',
                height: '20px',
              }}
            >
              <Info size="10px" color={theme.subText} />
            </ButtonEmpty>
            <ButtonEmpty
              padding="0"
              as={Link}
              to={`/swap?inputCurrency=ETH&outputCurrency=${tokenData.platforms.get(currentNetwork)}`}
              style={{
                background: rgba(theme.primary, 0.2),
                minWidth: '20px',
                minHeight: '20px',
                width: '20px',
                height: '20px',
              }}
            >
              <MoneyBag color={theme.primary} size={12} />
            </ButtonEmpty>
          </Flex>
          <Flex alignItems="center" justifyContent="space-between">
            <Text fontSize="10px">{formattedNum(tokenData.price.toString(), true)}</Text>
            <Text fontSize="10px" color={tokenData.price_change_percentage_24h >= 0 ? theme.apr : theme.red}>
              {formattedNum(tokenData.price_change_percentage_24h.toString(), false)}%
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Container>
  )
}

const Container = styled.div`
  padding: 8px 12px;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 4px;
`

export default TopTrendingSoonTokenItem
