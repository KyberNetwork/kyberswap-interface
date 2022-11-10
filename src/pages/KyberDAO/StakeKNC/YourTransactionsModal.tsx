import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import 'react-device-detect'
import { X } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { AutoColumn } from 'components/Column'
import CopyIcon from 'components/Icons/CopyIcon'
import LaunchIcon from 'components/Icons/LaunchIcon'
import CircleInfoIcon from 'components/LiveChart/CircleInfoIcon'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import Row, { RowBetween } from 'components/Row'
import { KNC_ADDRESS } from 'constants/index'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'
import { useWindowSize } from 'hooks/useWindowSize'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { useAllTransactions } from 'state/transactions/hooks'
import { TransactionDetails } from 'state/transactions/reducer'
import { ExternalLink } from 'theme'
import { getEtherscanLink, getTokenLogoURL } from 'utils'

const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
`
const gridTemplate = `4fr 3.4fr 3.6fr 4fr`
const gridTemplateMobile = '1fr 1fr'
const TableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`
const TableHeader = styled.div`
  display: grid;
  grid-template-columns: ${gridTemplate};
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08);
  border-radius: 8px 8px 0px 0px;
  ${({ theme }) => css`
    background-color: ${theme.background};
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`
const TableHeaderItem = styled.div<{ align?: 'left' | 'right' | 'center' }>`
  padding: 16px;
  text-transform: uppercase;
  font-size: 12px;
  text-align: ${({ align }) => align};
  ${({ theme }) => css`
    color: ${theme.subText};
  `}
`
const TableRow = styled.div`
  height: 55px;
  display: grid;
  grid-template-columns: ${gridTemplate};
  ${({ theme }) => css`
    border-bottom: 1px solid ${theme.border};
  `};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: ${gridTemplateMobile};
    height: 76px;
  `}
`
const TableCell = styled.div<{ justify?: 'flex-end' | 'flex-right' | 'center' }>`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  gap: 4px;
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  justify-content: ${({ justify }) => justify};
  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.subText};
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    justify-content: space-between;
    padding: 12px 0;
    &>*{
      flex:1;
    }
  `}
`
const ButtonIcon = styled.div`
  cursor: pointer;
`
export default function YourTransactionsModal() {
  const theme = useTheme()
  const modalOpen = useModalOpen(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)
  const toggleModal = useToggleModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)
  const windowSize = useWindowSize()
  const allTransactions = useAllTransactions()
  const [page, setPage] = useState(1)
  const filteredTransactions: TransactionDetails[] = useMemo(
    () =>
      Object.keys(allTransactions)
        .filter((key: string) => allTransactions[key].type?.startsWith('KyberDAO'))
        .map((key: string) => {
          const tx = allTransactions[key]
          return { ...tx, hashText: tx.hash.slice(0, 6) + '...' + tx.hash.slice(-4), type: tx.type?.slice(9) }
        }),
    [allTransactions],
  )
  const isMobile = windowSize.width && windowSize.width < 768

  const [, setCopied] = useCopyClipboard()
  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal} maxHeight={750} maxWidth={800}>
      <Wrapper>
        <Flex flexDirection="column" style={{ minHeight: '500px', gap: '20px' }}>
          <RowBetween>
            <Text fontSize={20}>
              <Trans>Your transactions</Trans>
            </Text>
            <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleModal}>
              <X onClick={toggleModal} size={20} color={theme.subText} />
            </Flex>
          </RowBetween>
          <TableWrapper>
            <TableHeader>
              <TableHeaderItem>
                <Trans>Transactions</Trans>
              </TableHeaderItem>
              <TableHeaderItem>
                <Trans>Action</Trans>
              </TableHeaderItem>
              <TableHeaderItem>
                <Trans>Time</Trans>
              </TableHeaderItem>
              <TableHeaderItem align="right">
                <Trans>Amount</Trans>
              </TableHeaderItem>
            </TableHeader>
            {filteredTransactions.length > 0 ? (
              !isMobile ? (
                <>
                  {filteredTransactions.map((tx: any) => {
                    return (
                      <TableRow key={tx.hash}>
                        <TableCell>
                          <img
                            src={`/static/media/mainnet-network.421331b9.svg`}
                            alt="knc-logo"
                            width="16px"
                            height="16px"
                          />
                          <Text>{tx.hashText}</Text>
                          <ButtonIcon onClick={() => setCopied(tx.hash)}>
                            <CopyIcon />
                          </ButtonIcon>
                          <ExternalLink href={getEtherscanLink(1, tx.hash, 'transaction')}>
                            <LaunchIcon />
                          </ExternalLink>
                        </TableCell>
                        <TableCell>
                          <Text>{tx.type}</Text>
                        </TableCell>
                        <TableCell>
                          <AutoColumn>
                            <Text color={theme.text}>{dayjs(tx.confirmedTime).format('MM/DD/YYYY')}</Text>
                            <Text color={theme.subText}>{dayjs(tx.confirmedTime).format('hh:mm:ss')}</Text>
                          </AutoColumn>
                        </TableCell>
                        <TableCell>
                          <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                            <Text color={theme.text}>{tx.arbitrary?.amount ? `${tx.arbitrary.amount} KNC` : ''}</Text>
                          </AutoColumn>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </>
              ) : (
                <>
                  {filteredTransactions.map((tx: any) => {
                    return (
                      <TableRow key={tx.hash}>
                        <TableCell>
                          <Row gap="4px">
                            <img
                              src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                              alt="knc-logo"
                              width="24px"
                              height="24px"
                            />
                            <Text>{tx.type}</Text>
                            <ButtonIcon onClick={() => setCopied(tx.hash)}>
                              <CopyIcon />
                            </ButtonIcon>
                            <ExternalLink href={getEtherscanLink(1, tx.hash, 'transaction')}>
                              <LaunchIcon />
                            </ExternalLink>
                          </Row>
                          <Row gap="4px">
                            <Text color={theme.text}>{dayjs(tx.confirmedTime).format('MM/DD/YYYY')}</Text>
                            <Text color={theme.subText}>{dayjs(tx.confirmedTime).format('hh:mm:ss')}</Text>
                          </Row>
                        </TableCell>
                        <TableCell>
                          <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                            <Text color={theme.text}>{tx.arbitrary?.amount ? `${tx.arbitrary.amount} KNC` : ''}</Text>
                          </AutoColumn>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </>
              )
            ) : (
              <Flex alignItems="center" justifyContent="center" flex={1} flexDirection="column" style={{ gap: '10px' }}>
                <CircleInfoIcon></CircleInfoIcon>
                <Text>
                  <Trans>You have no Transaction History</Trans>
                </Text>
                <Text>
                  <Trans>
                    Go to{' '}
                    <Link to="/kyberdao/stake-knc" onClick={() => toggleModal()}>
                      Stake
                    </Link>
                  </Trans>
                </Text>
              </Flex>
            )}
            <Pagination
              currentPage={page}
              onPageChange={e => setPage(e)}
              pageSize={isMobile ? 5 : 10}
              totalCount={filteredTransactions.length}
              haveBg={false}
            />
          </TableWrapper>
        </Flex>
      </Wrapper>
    </Modal>
  )
}
