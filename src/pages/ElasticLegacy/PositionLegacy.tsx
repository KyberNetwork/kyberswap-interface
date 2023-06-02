import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { Position as SubgraphPosition, usePositionFees, useRemoveLiquidityLegacy } from 'hooks/useElasticLegacy'
import useTheme from 'hooks/useTheme'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { formatDollarAmount } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'

const Wrapper = styled.div`
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 24px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.subText};
  line-height: 1.5;
  font-size: 14px;
  overflow-x: scroll;
`

const OverFlow = styled.div`
  min-width: 860px;
  overflow-x: scroll;
`

const TableHeader = styled.div`
  display: grid;
  font-size: 12px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  grid-template-columns: 0.75fr 2fr 1fr 1.5fr 1fr;
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
`

export default function PositionLegacy({ positions }: { positions: SubgraphPosition[] }) {
  const addresses = [...new Set(positions.map(item => [item.token0.id, item.token1.id]).flat())]

  const tokenPrices = useTokenPrices(addresses)

  const feeRewards = usePositionFees(positions)

  return (
    <Wrapper>
      <OverFlow>
        <TableHeader>
          <Text>NFT ID</Text>
          <Text>POOLS</Text>
          <Text>MY LIQUIDITY</Text>
          <Text>MY FEES EARNED</Text>
          <Text textAlign="right">ACTION</Text>
        </TableHeader>

        {positions.map(item => {
          return <Row key={item.id} position={item} feeRewards={feeRewards} tokenPrices={tokenPrices} />
        })}
      </OverFlow>
    </Wrapper>
  )
}

const Row = ({
  position: item,
  tokenPrices,
  feeRewards,
}: {
  position: SubgraphPosition
  tokenPrices: Record<string, number>
  feeRewards: Record<string, [string, string]>
}) => {
  const {
    removeLiquidity,
    handleDismiss,
    removeLiquidityError,
    attemptingTxn,
    txnHash,
    showPendingModal,
    token0,
    token1,
    position,
    feeValue0,
    feeValue1,
    usd,
  } = useRemoveLiquidityLegacy(item, tokenPrices, feeRewards)

  const theme = useTheme()
  const { account } = useActiveWeb3React()

  return (
    <TableRow key={item.id}>
      <Text color={theme.subText}>{item.id}</Text>

      <Flex alignItems="center">
        <DoubleCurrencyLogo currency0={unwrappedToken(token0)} currency1={unwrappedToken(token1)} />
        <Text color={theme.primary}>
          {unwrappedToken(token0).symbol} - {unwrappedToken(token1).symbol}
        </Text>
        <FeeTag>Fee {((Number(item.pool?.feeTier) || 0) * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
      </Flex>

      <Flex alignItems="center" justifyContent="flex-start" width="fit-content">
        <MouseoverTooltip
          width="fit-content"
          placement="bottom"
          text={
            <Flex flexDirection="column" fontSize="12px">
              <Flex sx={{ gap: '4px' }} alignItems="center">
                <CurrencyLogo currency={unwrappedToken(position.amount0.currency)} size="16px" />
                <Text fontWeight="500">{position.amount0.toSignificant(6)}</Text>
                <Text fontWeight="500">{unwrappedToken(position.amount0.currency).symbol}</Text>
              </Flex>

              <Flex sx={{ gap: '4px' }} alignItems="center" marginTop="6px">
                <CurrencyLogo currency={unwrappedToken(position.amount1.currency)} size="16px" />
                <Text fontWeight="500">{position.amount1.toSignificant(6)}</Text>
                <Text fontWeight="500">{unwrappedToken(position.amount1.currency).symbol}</Text>
              </Flex>
            </Flex>
          }
        >
          {formatDollarAmount(usd)}
          <DropdownSvg />
        </MouseoverTooltip>
      </Flex>

      <Flex flexDirection="column" sx={{ gap: '6px' }} fontSize="12px">
        <Flex sx={{ gap: '4px' }} alignItems="center">
          <CurrencyLogo currency={unwrappedToken(token0)} size="16px" />
          <Text fontWeight="500">{feeValue0.toSignificant(6)}</Text>
          <Text fontWeight="500">{unwrappedToken(token0).symbol}</Text>
        </Flex>

        <Flex sx={{ gap: '4px' }} alignItems="center">
          <CurrencyLogo currency={unwrappedToken(token1)} size="16px" />
          <Text fontWeight="500">{feeValue1.toSignificant(6)}</Text>
          <Text fontWeight="500">{unwrappedToken(token1).symbol}</Text>
        </Flex>
      </Flex>

      <Flex justifyContent="flex-end">
        {item.owner !== account?.toLowerCase() ? (
          <MouseoverTooltip
            placement="top"
            text="You need to withdraw your deposited liquidity position from the Farm first"
          >
            <ButtonPrimary padding="6px 12px" style={{ background: theme.buttonGray, color: theme.border }}>
              <Text fontSize="12px">Remove Liquidity</Text>
            </ButtonPrimary>
          </MouseoverTooltip>
        ) : (
          <ButtonOutlined padding="6px 12px" width="fit-content" onClick={() => removeLiquidity(true)}>
            <Text fontSize="12px">Remove Liquidity</Text>
          </ButtonOutlined>
        )}
      </Flex>

      <TransactionConfirmationModal
        isOpen={!!showPendingModal}
        onDismiss={handleDismiss}
        hash={txnHash}
        attemptingTxn={attemptingTxn}
        pendingText={`Removing liquidity`}
        content={() => (
          <Flex flexDirection={'column'} width="100%">
            {removeLiquidityError ? (
              <TransactionErrorContent
                onDismiss={handleDismiss}
                message={removeLiquidityError}
                confirmText={removeLiquidityError?.includes('burn amount exceeds balance') ? 'Remove without Fees' : ''}
                confirmAction={() => {
                  if (removeLiquidityError?.includes('burn amount exceeds balance')) {
                    removeLiquidity(false)
                  }
                }}
              />
            ) : null}
          </Flex>
        )}
      />
    </TableRow>
  )
}
