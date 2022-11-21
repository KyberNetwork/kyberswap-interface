import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
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
import { NetworkLogo } from 'components/Logo'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import Row, { RowBetween } from 'components/Row'
import { KNC_ADDRESS } from 'constants/index'
import { useStakingInfo, useVotingInfo } from 'hooks/kyberdao'
import { StakerAction } from 'hooks/kyberdao/types'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'
import { useWindowSize } from 'hooks/useWindowSize'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { getEtherscanLink, getTokenLogoURL } from 'utils'

const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
`
const gridTemplate = `5fr 3fr 3fr 3fr`
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
  console.log(ChainId)
  const theme = useTheme()
  const { proposals } = useVotingInfo()
  const modalOpen = useModalOpen(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)
  const toggleModal = useToggleModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)
  const windowSize = useWindowSize()
  const [page, setPage] = useState(1)
  const { stakerActions } = useStakingInfo()
  const formattedActions: (StakerAction & { hashText: string; description: string })[] = useMemo(
    () =>
      stakerActions?.map((action: StakerAction) => {
        return {
          ...action,
          hashText: action.tx_hash.slice(0, 6) + '...' + action.tx_hash.slice(-4),
          type: action.type === 'VoteEmitted' ? 'Vote' : action.type === 'ClaimReward' ? 'Claim' : action.type,
          description: (() => {
            if (action.type === 'VoteEmitted') {
              const proposal = proposals?.find(p => p.proposal_id.toString() === action.meta.proposal_id)
              if (!proposal) return ''
              if (action.meta.proposal_type === 'BinaryProposal')
                return t`Voted on ${proposal?.options[action.meta?.options?.[0] || 0]} of ${proposal.title}`
              if (action.meta.proposal_type === 'GenericProposal')
                return t`Voted on ${action.meta?.options
                  ?.map((o: number) => proposal?.options[o] || '')
                  .join(',')} of ${proposal.title}`
            }
            return action.meta.amount
              ? `${action.meta.amount} KNC`
              : action.meta.d_addr
              ? action.meta.d_addr.slice(0, 6) + '...' + action.meta.d_addr.slice(-4)
              : ''
          })(),
        }
      }) || [],
    [stakerActions, proposals],
  )
  const isMobile = windowSize.width && windowSize.width < 768

  const [, setCopied] = useCopyClipboard()
  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal} maxHeight={750} maxWidth={800} width="70vw">
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
            {formattedActions.length > 0 ? (
              !isMobile ? (
                <>
                  {formattedActions.map((action: StakerAction & { hashText: string; description: string }) => {
                    return (
                      <TableRow key={action.tx_hash}>
                        <TableCell>
                          <NetworkLogo style={{ width: 16, height: 16 }} chainId={ChainId.MAINNET} />
                          <Text>{action.hashText}</Text>
                          <ButtonIcon onClick={() => setCopied(action.tx_hash)}>
                            <CopyIcon />
                          </ButtonIcon>
                          <ExternalLink href={getEtherscanLink(1, action.tx_hash, 'transaction')}>
                            <LaunchIcon />
                          </ExternalLink>
                        </TableCell>
                        <TableCell>
                          <Text>{action.type}</Text>
                        </TableCell>
                        <TableCell>
                          <AutoColumn>
                            <Text color={theme.text}>{dayjs(action.timestamp).format('MM/DD/YYYY')}</Text>
                            <Text color={theme.subText}>{dayjs(action.timestamp).format('hh:mm:ss')}</Text>
                          </AutoColumn>
                        </TableCell>
                        <TableCell>
                          <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                            <Text color={theme.text}>{action.description}</Text>
                          </AutoColumn>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </>
              ) : (
                <>
                  {formattedActions.map((action: StakerAction & { hashText: string; description: string }) => {
                    return (
                      <TableRow key={action.tx_hash}>
                        <TableCell>
                          <Row gap="4px">
                            <img
                              src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                              alt="knc-logo"
                              width="24px"
                              height="24px"
                            />
                            <Text>{action.type}</Text>
                            <ButtonIcon onClick={() => setCopied(action.tx_hash)}>
                              <CopyIcon />
                            </ButtonIcon>
                            <ExternalLink href={getEtherscanLink(1, action.tx_hash, 'transaction')}>
                              <LaunchIcon />
                            </ExternalLink>
                          </Row>
                          <Row gap="4px">
                            <Text color={theme.text}>{dayjs(action.timestamp).format('MM/DD/YYYY')}</Text>
                            <Text color={theme.subText}>{dayjs(action.timestamp).format('hh:mm:ss')}</Text>
                          </Row>
                        </TableCell>
                        <TableCell>
                          <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                            <Text color={theme.text}>{action.description}</Text>
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
              totalCount={formattedActions.length}
              haveBg={false}
            />
          </TableWrapper>
        </Flex>
      </Wrapper>
    </Modal>
  )
}
