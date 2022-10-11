import { Trans, t } from '@lingui/macro'
import { memo } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import { NetworkLogo } from 'components/Logo'
import { ModalCenter } from 'components/Modal'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { OutputBridgeInfo, useBridgeState } from 'state/bridge/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { tryParseAmount } from 'state/swap/hooks'
import { shortenAddress } from 'utils'

const Container = styled.div`
  padding: 25px 30px;
  width: 100%;
`
const Row = styled.div`
  line-height: 20px;
  display: flex;
  justify-content: space-between;
  width: 100%;
`

const Value = styled.div`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
  display: flex;
  gap: 5px;
  align-items: center;
`
const Label = styled.div`
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
`
const formatValue = (amount: string, token: WrappedTokenInfo | undefined) =>
  !amount || !token ? '' : tryParseAmount(amount, token)?.toSignificant()

export default memo(function Disclaimer({
  isOpen,
  onSwap,
  onDismiss,
  outputInfo,
}: {
  isOpen: boolean
  onSwap: () => void
  onDismiss: () => void
  outputInfo: OutputBridgeInfo
}) {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const [{ tokenIn, tokenOut, chainIdOut, currencyIn, currencyOut }] = useBridgeState()
  const styleLogo = { width: 20, height: 20 }
  const data = [
    {
      label: t`I want to transfer`,
      content: (
        <Value>
          <CurrencyLogo currency={currencyIn} style={styleLogo} />
          <Text>
            {formatValue(outputInfo.inputAmount, currencyIn)} {tokenIn?.symbol}
          </Text>
        </Value>
      ),
    },
    {
      label: t`from`,
      content: (
        <Value>
          <NetworkLogo chainId={chainId} style={styleLogo} />
          <Text>{chainId && NETWORKS_INFO?.[chainId]?.name}</Text>
        </Value>
      ),
    },
    {
      label: t`to`,
      content: (
        <Value>
          <NetworkLogo chainId={chainIdOut} style={styleLogo} />
          <Text>{chainIdOut && NETWORKS_INFO[chainIdOut].name}</Text>
        </Value>
      ),
    },
    {
      label: t`and receive at least`,
      content: (
        <Value>
          <CurrencyLogo currency={currencyOut} style={styleLogo} />
          <Text>
            {formatValue(outputInfo?.outputAmount?.toString(), currencyOut)} {tokenOut?.symbol}
          </Text>
        </Value>
      ),
    },
    {
      label: t`at this address`,
      content: account && (
        <Value>
          <Text>{shortenAddress(account, 5)}</Text>
          <CopyHelper toCopy={account} style={{ color: theme.subText }} />
        </Value>
      ),
    },
  ]
  // todo use it
  //   <TransactionConfirmationModal
  //   hash={txHash ? txHash : ''}
  //   isOpen={showConfirm}
  //   onDismiss={handleConfirmDismiss}
  //   attemptingTxn={attemptingTxn}
  //   content={confirmationContent}
  //   pendingText=""
  // />
  return (
    <ModalCenter isOpen={isOpen} onDismiss={onDismiss} width={'480px'} maxWidth="calc(100vw - 20px)">
      <Container>
        <Flex flexDirection={'column'} style={{ gap: 25 }}>
          <Flex justifyContent={'space-between'}>
            <Flex color={theme.text} alignItems="center" style={{ gap: 8 }}>
              <Text fontSize={20}>{t`Review your transfer`}</Text>
            </Flex>
            <X onClick={onDismiss} style={{ cursor: 'pointer' }} color={theme.subText} />
          </Flex>

          <Flex style={{ gap: 20 }} flexDirection="column">
            {data.map(item => (
              <Row key={item.label}>
                <Label>{item.label}</Label>
                {item.content}
              </Row>
            ))}
          </Flex>

          <Flex
            flexDirection={'column'}
            style={{
              borderRadius: 16,
              padding: '14px 18px',
              border: `1px solid ${theme.border}`,
              gap: 8,
              fontSize: 13,
            }}
          >
            <Row>
              <Label>
                <Trans>Estimated Processing Time</Trans>
              </Label>
              <Value>{outputInfo.time}</Value>
            </Row>
            <Row>
              <Label>
                <Trans>Bridge Fee</Trans>
              </Label>
              <Value>~ {outputInfo.fee || '--'}</Value>
            </Row>
          </Flex>

          <ButtonPrimary onClick={onSwap}>
            <Trans>Transfer</Trans>
          </ButtonPrimary>
        </Flex>
      </Container>
    </ModalCenter>
  )
})
