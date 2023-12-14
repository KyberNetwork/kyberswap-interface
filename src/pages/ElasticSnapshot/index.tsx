import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Info } from 'react-feather'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { PoolsPageWrapper } from 'pages/Pools/styleds'
import { useWalletModalToggle } from 'state/application/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import data from './data.json'

const Wrapper = styled.div`
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.subText};
  line-height: 1.5;
  font-size: 14px;
  overflow: hidden;
  text-align: center;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    border: none;
    border-radius: 0;
  `}
`

const TableHeader = styled.div`
  display: grid;
  font-size: 12px;
  grid-template-columns: 1fr 0.75fr 1fr 1fr;
  font-weight: 500;
  padding: 1rem;
  background: ${({ theme }) => theme.tableHeader};
  color: ${({ theme }) => theme.subText};
  align-items: center;
`
const TableRow = styled(TableHeader)`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 14px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    background: ${({ theme }) => theme.buttonBlack};
    justify-content: space-between;
  `}
`

export default function ElasticSnapshot() {
  const { account } = useActiveWeb3React()
  const theme = useTheme()

  const userInfo = data.find(item => item.user_address.toLowerCase() === account?.toLowerCase())

  const toggleWalletModal = useWalletModalToggle()

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 7 })
  return (
    <PoolsPageWrapper>
      <Flex justifyContent="space-between" sx={{ gap: '1rem' }} flexDirection={upToMedium ? 'column' : 'row'}>
        <Flex flexDirection="column" sx={{ gap: '12px' }} flex={3}>
          <Text as="h2" fontSize={24} fontWeight="500">
            <Trans>Snapshot</Trans>
          </Text>
          <Text fontSize={14} color={theme.subText}>
            <Trans>
              You can find the list of your liquidity positions in KyberSwap Elastic pools that were affected by the
              exploit below.
            </Trans>
          </Text>
          <ExternalLink href="/">
            <Text fontSize="14px">
              <Trans>Official announcement is here ↗</Trans>
            </Text>
          </ExternalLink>
        </Flex>

        <Flex flex={2} flexDirection="column" sx={{ gap: '12px', maxWidth: '470px' }}>
          <Flex justifyContent="space-between" flexDirection={upToExtraSmall ? 'column' : 'row'}>
            <Flex flexDirection="column" sx={{ gap: '24px' }} padding="12px" flex={1}>
              <Text fontSize="10px" fontWeight="500" color={theme.subText}>
                <Trans>
                  Your Total
                  <br />
                  Amount (USD)
                </Trans>
              </Text>
              <Text fontWeight="500" fontSize={14}>
                {userInfo ? format(userInfo.total_usd) : '--'}
              </Text>
            </Flex>

            <Flex justifyContent="space-between" flex={2}>
              <Flex flexDirection="column" sx={{ gap: '24px' }} padding="12px" flex={1}>
                <Text fontSize="10px" fontWeight="500" color={theme.subText}>
                  <Trans>
                    Your Total Liquidity
                    <br />
                    Amount (USD)
                  </Trans>
                </Text>
                <Text fontWeight="500" fontSize={14}>
                  {userInfo ? format(userInfo.total_liquidity_usd) : '--'}
                </Text>
              </Flex>

              <Flex flexDirection="column" sx={{ gap: '24px' }} padding="12px" flex={1}>
                <Text fontSize="10px" fontWeight="500" color={theme.subText}>
                  <Trans>
                    Your Total Fees
                    <br />
                    Amount (USD)
                  </Trans>
                </Text>
                <Text fontWeight="500" fontSize={14}>
                  {userInfo ? format(userInfo.total_fee_usd) : '--'}
                </Text>
              </Flex>
            </Flex>
          </Flex>
          <Text color={theme.subText} fontStyle="italic" fontSize="10px" textAlign="right">
            <Trans>Your Total Amount (USD) = Your Total Liquidity Amount (USD) + Your Total Fees Amount (USD)</Trans>
          </Text>
        </Flex>
      </Flex>
      <Flex flexDirection="column" marginTop="1.5rem" marginX={upToSmall ? '-1rem' : 0}>
        <Wrapper>
          {account ? (
            userInfo ? (
              <>
                <Text textAlign="left" fontSize="14px" padding="16px 24px">
                  <Trans>Wallet address</Trans>:{' '}
                  <Text as="span" fontWeight="500" color={theme.text}>
                    {account}
                  </Text>
                </Text>

                {!upToSmall && (
                  <TableHeader>
                    <Text textAlign="left">POOLS</Text>
                    <Text textAlign="right">NFT ID</Text>

                    <Text
                      textAlign="right"
                      sx={{ borderBottom: `1px dotted ${theme.border}` }}
                      width="fit-content"
                      marginLeft="auto"
                    >
                      <MouseoverTooltip
                        text={t`This is the USD value of your liquidity position immediately before the exploit.`}
                      >
                        <Trans>POSITION LIQUIDITY (USD)</Trans>
                      </MouseoverTooltip>
                    </Text>
                    <Text
                      textAlign="right"
                      sx={{ borderBottom: `1px dotted ${theme.border}` }}
                      width="fit-content"
                      marginLeft="auto"
                    >
                      <MouseoverTooltip
                        text={t`This is the USD value of the fees earned by your liquidity position immediately before the exploit.`}
                      >
                        <Trans>POSITION FEE (USD)</Trans>
                      </MouseoverTooltip>
                    </Text>
                  </TableHeader>
                )}

                {userInfo.positions.map(item => (
                  <TableRow key={item.position_id}>
                    <Flex>
                      <Logo
                        address0={item.info.token0}
                        address1={item.info.token1}
                        chainId={chainToChainId[item.info.chain]}
                      />
                      {item.info.pair}
                    </Flex>
                    <Text textAlign="right">#{item.position_id}</Text>

                    {upToSmall && (
                      <>
                        <MouseoverTooltip
                          text={t`This is the USD value of your liquidity position immediately before the exploit.`}
                        >
                          <Text
                            color={theme.subText}
                            fontSize="12px"
                            fontWeight="500"
                            sx={{ borderBottom: `1px dotted ${theme.border}` }}
                          >
                            POSITION LIQUIDITY (USD)
                          </Text>
                        </MouseoverTooltip>

                        <Text
                          color={theme.subText}
                          fontSize="12px"
                          fontWeight="500"
                          width="fit-content"
                          justifySelf="flex-end"
                          sx={{ borderBottom: `1px dotted ${theme.border}` }}
                        >
                          <MouseoverTooltip
                            text={t`This is the USD value of the fees earned by your liquidity position immediately before the exploit.`}
                          >
                            POSITION FEES (USD)
                          </MouseoverTooltip>
                        </Text>
                      </>
                    )}
                    <Text textAlign={upToSmall ? 'left' : 'right'}>{format(item.position_usd)}</Text>
                    <Text textAlign="right">{format(item.fee_usd)}</Text>
                  </TableRow>
                ))}
              </>
            ) : (
              <Flex padding="36px 16px" justifyContent="center" alignItems="center" flexDirection="column">
                <Info size={64} />
                <Text fontSize={14} marginTop="24px">
                  <Trans>Your wallet {account} is not affected</Trans>
                </Text>
              </Flex>
            )
          ) : (
            <Flex padding="48px 16px" justifyContent="center" alignItems="center" flexDirection="column">
              <Text fontSize="14px" marginBottom="24px">
                <Trans>Connect your wallet to view this data</Trans>
              </Text>

              <ButtonPrimary onClick={toggleWalletModal} width="94px">
                <Trans>Connect</Trans>
              </ButtonPrimary>
            </Flex>
          )}
        </Wrapper>
      </Flex>
    </PoolsPageWrapper>
  )
}

const chainToChainId: { [key: string]: ChainId } = {
  ethereum: 1,
  optimism: 10,
  arbitrum: 42161,
  avalanche: 43114,
  base: 8453,
  cronos: 25,
  polygon: 137,
}
const Logo = ({ chainId, address0, address1 }: { chainId: ChainId; address0: string; address1: string }) => {
  const allTokens = useAllTokens(true, chainId)

  return (
    <Box sx={{ position: 'relative' }}>
      <DoubleCurrencyLogo
        size={20}
        currency0={allTokens[address0.toLowerCase()]}
        currency1={allTokens[address1.toLowerCase()]}
      />

      <img
        src={NETWORKS_INFO[chainId].icon}
        style={{ position: 'absolute', bottom: 0, right: '4px', zIndex: 1 }}
        width="12px"
        height="12px"
        alt=""
      />
    </Box>
  )
}
