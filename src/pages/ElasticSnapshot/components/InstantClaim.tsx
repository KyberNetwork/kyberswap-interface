import { ChainId, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Fragment, useMemo, useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import Modal from 'components/Modal'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import avalanche from '../data/instant/avalanche.json'
import ethereum from '../data/instant/ethereum.json'
import optimism from '../data/instant/optimism.json'
import polygon from '../data/instant/polygon.json'

const Total = styled.div`
  display: flex;
  justify-content: space-between;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 12px;
  padding: 12px 20px;
  align-items: center;
  margin-top: 24px;
`

const TableHeader = styled.div`
  display: grid;
  padding: 8px;
  grid-template-columns: 1fr 1fr 1fr 0.75fr;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
  margin-top: 1rem;
`

const TableBody = styled(TableHeader)<{ backgroundColor?: string }>`
  color: ${({ theme }) => theme.text};
  margin-top: 0;
  align-items: center;
  border-radius: 12px;
`

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 7 })

export default function InstantClaim() {
  const theme = useTheme()
  const [show, setShow] = useState(false)
  const { account } = useActiveWeb3React()
  const ethereumTokens = useAllTokens(true, ChainId.MAINNET)
  const optimismTokens = useAllTokens(true, ChainId.OPTIMISM)
  const polygonTokens = useAllTokens(true, ChainId.MATIC)
  const avalancheTokens = useAllTokens(true, ChainId.AVAXMAINNET)

  const allTokens = [ethereumTokens, optimismTokens, polygonTokens, avalancheTokens]

  const userData = useMemo(() => {
    if (!account) return []
    return [ethereum, optimism, polygon, avalanche].map(data =>
      data.find(info => info.receiver.toLowerCase() === account.toLowerCase()),
    )
  }, [account])

  const totalValue = userData.reduce(
    (acc, cur) => acc + (cur?.tokenInfo?.reduce((total, item) => total + item.value, 0) || 0),
    0,
  )

  const tokenAddresses = userData.map(item => [...new Set(item?.tokenInfo.map(inf => inf.token))])

  const ethereumTokensPrice = useTokenPrices(tokenAddresses[0], ChainId.MAINNET)
  const optimismTokensPrice = useTokenPrices(tokenAddresses[1], ChainId.OPTIMISM)
  const polygonTokensPrice = useTokenPrices(tokenAddresses[2], ChainId.MATIC)
  const avalancheTokensPrice = useTokenPrices(tokenAddresses[3], ChainId.AVAXMAINNET)
  const prices = [ethereumTokensPrice, optimismTokensPrice, polygonTokensPrice, avalancheTokensPrice]

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  if (!userData.filter(Boolean).length) return null

  return (
    <Flex flexDirection="column">
      <Modal
        width="100%"
        maxWidth="600px"
        isOpen={show}
        onDismiss={() => {
          setShow(false)
        }}
      >
        <Flex
          flexDirection="column"
          padding={upToSmall ? '1rem' : '20px'}
          bg={theme.background}
          width="100%"
          lineHeight={1.5}
          sx={{
            position: 'relative',
          }}
        >
          <Text color={theme.text} fontSize="20px" fontWeight="500" textAlign="center">
            <Trans>Claim Asset</Trans>
          </Text>
          <ButtonEmpty
            onClick={() => setShow(false)}
            width="36px"
            height="36px"
            padding="0"
            style={{ position: 'absolute', right: '1rem', top: '1rem' }}
          >
            <X color={theme.text} />
          </ButtonEmpty>

          <Total>
            <Text color={theme.subText} fontSize="14px" fontWeight="500">
              <Trans>Total Amount (USD)</Trans>
            </Text>
            <Text fontSize={20} fontWeight="500">
              {format(totalValue)}
            </Text>
          </Total>

          <TableHeader>
            <Text>Assets</Text>
            <Text textAlign="right">Exploitation Value</Text>
            <Text textAlign="right">Current Value</Text>
          </TableHeader>

          {userData.map((item, index) => {
            if (!item) return null
            const network =
              NETWORKS_INFO[
                index === 0
                  ? ChainId.MAINNET
                  : index === 1
                  ? ChainId.OPTIMISM
                  : index === 2
                  ? ChainId.MATIC
                  : ChainId.AVAXMAINNET
              ]
            const totalValue = item.tokenInfo.reduce((acc, cur) => acc + cur.value, 0)
            const currentValue = item.tokenInfo.reduce((acc, cur) => {
              const tk = allTokens[index][cur.token.toLowerCase()]
              const tkAmount = tk && TokenAmount.fromRawAmount(tk, cur.amount)
              const currentValue = +(tkAmount?.toExact() || '0') * (prices[index][cur.token.toLowerCase()] || 0)
              return acc + currentValue
            }, 0)

            return (
              <Fragment key={index}>
                <TableBody style={{ backgroundColor: theme.buttonGray }}>
                  <Flex sx={{ gap: '6px' }} alignItems="center">
                    <img alt="" src={network.icon} width={18} /> <Text fontSize={16}>{network.name}</Text>
                  </Flex>
                  <Text fontSize={18} textAlign="right" fontWeight="500">
                    {format(totalValue)}
                  </Text>
                  <Text fontSize={18} textAlign="right" fontWeight="500">
                    {format(currentValue)}
                  </Text>
                  <Flex justifyContent="flex-end">
                    <ButtonPrimary style={{ height: '36px' }} width="max-content">
                      <Trans>Claim</Trans>
                    </ButtonPrimary>
                  </Flex>
                </TableBody>

                {item.tokenInfo.map(info => {
                  const tk = allTokens[index][info.token.toLowerCase()]
                  const tkAmount = tk && TokenAmount.fromRawAmount(tk, info.amount)
                  const currentValue = +(tkAmount?.toExact() || '0') * (prices[index][info.token.toLowerCase()] || 0)

                  return (
                    <TableBody key={info.token}>
                      <Flex sx={{ gap: '6px' }} alignItems="center">
                        <CurrencyLogo currency={tk} size="16px" />
                        <Text>
                          {tkAmount?.toSignificant(6)} {tk?.symbol}
                        </Text>
                      </Flex>
                      <Text textAlign="right">{format(info.value)}</Text>
                      <Text textAlign="right">{format(currentValue)}</Text>
                      <div></div>
                    </TableBody>
                  )
                })}
              </Fragment>
            )
          })}
        </Flex>
      </Modal>

      <Text fontSize={20} fontWeight="500">
        <Trans>Available assets for claiming</Trans>
      </Text>

      <Flex
        flexDirection="column"
        padding="12px 20px"
        justifyContent="space-between"
        marginTop="1rem"
        width="max-content"
        sx={{ gap: '16px', borderRadius: '12px' }}
        backgroundColor="rgba(0,0,0,0.64)"
      >
        <Text fontSize="14px" fontWeight="500" color={theme.subText} lineHeight="20px">
          <Trans>Total Amount (USD)</Trans>
        </Text>
        <Flex sx={{ gap: '1rem' }} alignItems="flex-end">
          <Text fontWeight="500" fontSize={20}>
            {format(totalValue)}
          </Text>
          <Text
            sx={{ fontSize: '14px', cursor: 'pointer' }}
            fontWeight="500"
            role="button"
            color={theme.primary}
            mb="2px"
            onClick={() => {
              setShow(true)
            }}
          >
            <Trans>Details</Trans>
          </Text>
        </Flex>
      </Flex>

      <Text marginTop="1rem" fontSize={14} color={theme.subText} lineHeight={1.5}>
        <Trans>Total Amount includes assets that KyberSwap has recovered or rescued under Category 3 & 5</Trans>
      </Text>
      <Text marginTop="8px" fontSize={14} color={theme.subText} lineHeight={1.5}>
        <Trans>
          Your assets are spread across various networks. Kindly choose the relevant network and proceed with the
          claiming process.
        </Trans>
      </Text>
    </Flex>
  )
}
