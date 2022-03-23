import { NonfungiblePositionManager, Position } from '@vutien/dmm-v3-sdk'
import { TransactionResponse } from '@ethersproject/providers'
import React, { useCallback, useState } from 'react'
import { Flex, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import { AutoColumn } from 'components/Column'
import { Currency, CurrencyAmount } from '@vutien/sdk-core'
import Card, { OutlineCard } from 'components/Card'
import Divider, { DividerDash } from 'components/Divider'
import Row, { AutoRow, RowBetween, RowFixed } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { Trans, t } from '@lingui/macro'
import { unwrappedToken } from 'utils/wrappedCurrency'
import InfoHelper from 'components/InfoHelper'
import { formatTickPrice } from 'utils/formatTickPrice'
import { Bound } from 'state/mint/proamm/actions'
import styled from 'styled-components'
import { BigNumber } from '@ethersproject/bignumber'
import { useProAmmPositionFees } from 'hooks/useProAmmPositionFees'
import { ButtonCollect } from 'components/Button'
import { useActiveWeb3React } from 'hooks'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { calculateGasMargin } from 'utils'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import QuestionHelper from 'components/QuestionHelper'

export default function ProAmmFee({
  tokenId,
  position,
  layout = 0
}: {
  tokenId: BigNumber
  position: Position
  layout?: number
}) {
  const { chainId, account, library } = useActiveWeb3React()
  const theme = useTheme()
  const [feeValue0, feeValue1] = useProAmmPositionFees(tokenId, position, true)
  const token0Shown = unwrappedToken(position.pool.token0)
  const token1Shown = unwrappedToken(position.pool.token1)
  const [collecting, setCollecting] = useState<boolean>(false)
  const [collectMigrationHash, setCollectMigrationHash] = useState<string | null>(null)
  const isCollectPending = useIsTransactionPending(collectMigrationHash ?? undefined)
  const addTransactionWithType = useTransactionAdder()
  const positionManager = useProAmmNFTPositionManagerContract()
  const deadline = useTransactionDeadline() // custom from users settings

  const collect = useCallback(() => {
    if (
      !chainId ||
      !feeValue0 ||
      !feeValue1 ||
      !positionManager ||
      !account ||
      !tokenId ||
      !library ||
      !deadline ||
      !layout
    )
      return
    setCollecting(true)
    const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
      tokenId: tokenId.toString(),
      expectedCurrencyOwed0: feeValue0,
      expectedCurrencyOwed1: feeValue1,
      recipient: account,
      deadline: deadline.toString(),
      havingFee: true
    })
    const txn = {
      to: positionManager.address,
      data: calldata,
      value
    }

    library
      .getSigner()
      .estimateGas(txn)
      .then(estimate => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate)
        }
        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            setCollectMigrationHash(response.hash)
            setCollecting(false)

            addTransactionWithType(response, {
              type: 'Collect fee',
              summary: feeValue0.currency.symbol + ' and ' + feeValue1.currency.symbol
            })
          })
      })
      .catch(error => {
        setCollecting(false)
        console.error(error)
      })
  }, [
    chainId,
    feeValue0,
    feeValue1,
    positionManager,
    account,
    tokenId,
    addTransactionWithType,
    library,
    deadline,
    layout
  ])
  const render =
    layout == 0 ? (
      <OutlineCard marginTop="1rem" padding="1rem">
        <AutoColumn gap="md">
          <Text fontSize="16px" fontWeight="500">
            Your Fee Earnings
          </Text>
          <Text fontSize="12px">
            When you remove liquidity (even partially), you will receive 100% of your fee earnings
          </Text>
          <Divider />
          <RowBetween>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>{token0Shown.symbol} Fees Earned:</Trans>
            </Text>
            <RowFixed>
              <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token0Shown} />
              <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />} {token0Shown.symbol}
              </Text>
            </RowFixed>
          </RowBetween>
          <RowBetween>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>{token1Shown.symbol} Fees Earned:</Trans>
            </Text>
            <RowFixed>
              <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token1Shown} />
              <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />} {token1Shown.symbol}
              </Text>
            </RowFixed>
          </RowBetween>
        </AutoColumn>
      </OutlineCard>
    ) : (
      <>
        <OutlineCard marginTop="1rem" padding="1rem">
          <AutoColumn gap="md">
            <RowBetween>
              <Flex>
                <Text fontSize={12} fontWeight={500} color={theme.subText}>
                  <Trans>{token0Shown.symbol} Fees Earned</Trans>
                </Text>
                <QuestionHelper text={t`Your fees are being automatically compounded so you earn more`} />
              </Flex>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token0Shown} />
                <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                  {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />}
                </Text>
              </RowFixed>
            </RowBetween>
            <RowBetween>
              <Flex>
                <Text fontSize={12} fontWeight={500} color={theme.subText}>
                  <Trans>{token1Shown.symbol} Fees Earned</Trans>
                </Text>
                <QuestionHelper text={t`Your fees are being automatically compounded so you earn more`} />
              </Flex>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token1Shown} />
                <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                  {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />}
                </Text>
              </RowFixed>
            </RowBetween>
            {(feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) || !!collectMigrationHash) && (
              <ButtonCollect onClick={collect} style={{ padding: '10px', fontSize: '14px' }}>
                <Flex>
                  <Trans>Collect Fees</Trans>
                  <QuestionHelper
                    text={t`By collecting, you will receive 100% of your fee earnings`}
                    color={theme.primary}
                  />
                </Flex>
              </ButtonCollect>
            )}
          </AutoColumn>
        </OutlineCard>
      </>
    )
  return render
}
