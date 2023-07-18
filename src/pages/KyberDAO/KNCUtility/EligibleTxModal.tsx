import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import CopyHelper from 'components/Copy'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import { RowBetween } from 'components/Row'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useEligibleTransactions } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import { ExternalLinkIcon, MEDIA_WIDTHS } from 'theme'
import { formattedNum, getEtherscanLink } from 'utils'

import { HeaderCell, Table, TableHeader, TableRow } from './TxTable'

const Wrapper = styled.div`
  width: 100%;
  border-radius: 20px;
  padding: 24px 24px 30px;
  background-color: ${({ theme }) => theme.tableHeader};
  min-width: 550px;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: unset;
  `}
`

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;

  & > img,
  span {
    height: 16px;
    width: 16px;
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

const CloseButton = styled.div`
  svg {
    display: block;
  }
  :hover {
    filter: brightness(0.8);
  }
`

export default function EligibleTxModal({ isOpen, closeModal }: { isOpen: boolean; closeModal: () => void }) {
  const { chainId, networkInfo } = useActiveWeb3React()
  const [currentPage, setCurrentPage] = useState(1)
  const eligibleTxs = useEligibleTransactions(currentPage, 10)
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  return (
    <Modal isOpen={isOpen} onDismiss={closeModal} maxWidth="800px" width="70vw">
      <Wrapper>
        <Flex sx={{ gap: '16px' }} flexDirection="column">
          <Flex sx={{ gap: '26px' }} flexDirection="column">
            <RowBetween>
              <Text fontSize={20} fontWeight={500} lineHeight="24px">
                <Trans>Your transactions</Trans>
              </Text>
              <CloseButton onClick={closeModal}>
                <X style={{ cursor: 'pointer' }} />
              </CloseButton>
            </RowBetween>
            <Table>
              <TableHeader>
                <HeaderCell>
                  <Trans>TXN HASH</Trans>
                </HeaderCell>
                {upToExtraSmall ? null : (
                  <>
                    <HeaderCell>
                      <Trans>LOCAL TIME</Trans>
                    </HeaderCell>
                    <HeaderCell>
                      <Trans>GAS FEE</Trans>
                    </HeaderCell>
                  </>
                )}
                <HeaderCell textAlign="right">
                  <Trans>GAS REFUND REWARDS</Trans>
                </HeaderCell>
              </TableHeader>
              {eligibleTxs?.transactions?.map(tx => {
                const time = new Date(tx.timestamp * 1000)
                return (
                  <TableRow key={tx.tx}>
                    <HeaderCell>
                      <Flex sx={{ gap: '4px' }}>
                        <IconWrapper>
                          <img src={networkInfo.icon} />
                        </IconWrapper>
                        <Text fontSize={14} fontWeight={400} lineHeight="normal" alignSelf="center">
                          {tx.tx.slice(0, 6)}...{tx.tx.slice(-4)}
                        </Text>
                        <CopyHelper toCopy={tx.tx} margin="unset" color={theme.subText} />
                        <ExternalLinkIcon
                          href={getEtherscanLink(chainId, tx.tx, 'transaction')}
                          color={theme.subText}
                        />
                      </Flex>
                    </HeaderCell>
                    {upToExtraSmall ? null : (
                      <>
                        <HeaderCell>
                          <Flex flexDirection="column" sx={{ gap: '4px' }}>
                            <Text>{time.toLocaleDateString()}</Text>
                            <Text fontWeight={400} color={theme.subText}>
                              {time.toLocaleTimeString()}
                            </Text>
                          </Flex>
                        </HeaderCell>
                        <HeaderCell>
                          <Flex flexDirection="column" sx={{ gap: '4px' }}>
                            <Text>
                              {formattedNum(tx.gasFeeInNativeToken)} {NativeCurrencies[chainId].symbol}
                            </Text>
                            <Text fontWeight={400} color={theme.subText}>
                              {formattedNum(tx.gasFeeInUSD, true)}
                            </Text>
                          </Flex>
                        </HeaderCell>
                      </>
                    )}

                    <HeaderCell textAlign="right">
                      <Flex flexDirection="column" sx={{ gap: '4px' }}>
                        <Text>{formattedNum(tx.gasRefundInKNC)} KNC</Text>
                        <Text fontWeight={400} color={theme.subText}>
                          <Trans>Tier {tx.userTier}</Trans> - {Number(tx.gasRefundPerCentage) * 100}%
                        </Text>
                      </Flex>
                    </HeaderCell>
                  </TableRow>
                )
              })}
            </Table>
          </Flex>
          <Pagination
            onPageChange={setCurrentPage}
            totalCount={(eligibleTxs?.pagination.pageSize ?? 0) * (eligibleTxs?.pagination.totalOfPages ?? 0)}
            currentPage={eligibleTxs?.pagination.currentPage ?? 0}
            pageSize={eligibleTxs?.pagination.pageSize ?? 0}
            haveBg={false}
            style={{ padding: '0' }}
          />
        </Flex>
      </Wrapper>
    </Modal>
  )
}
