import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { HTMLAttributes, ReactNode, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import CopyHelper from 'components/Copy'
import CopyIcon from 'components/Icons/CopyIcon'
import LaunchIcon from 'components/Icons/LaunchIcon'
import CircleInfoIcon from 'components/LiveChart/CircleInfoIcon'
import { NetworkLogo } from 'components/Logo'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import Row, { RowBetween, RowFit } from 'components/Row'
import { Stack } from 'components/Stack'
import { KNC_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useStakingInfo, useVotingInfo } from 'hooks/kyberdao'
import { ActionType, StakerAction } from 'hooks/kyberdao/types'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useWindowSize } from 'hooks/useWindowSize'
import { ApplicationModal } from 'state/application/actions'
import { useCloseModal, useModalOpen } from 'state/application/hooks'
import { CloseIcon, ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'
import { getTokenLogoURL } from 'utils/tokenLogo'

const TransactionGrid = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid grid-cols-[5fr_3fr_3fr_3fr] max-sm:grid-cols-[1fr_1fr]', className)} {...props}>
    {children}
  </div>
)

const TransactionCell = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center gap-2 px-4 py-3 text-sm text-text max-sm:flex-col max-sm:justify-between max-sm:px-0 max-sm:[&>*]:flex-1 [&_svg]:size-4 [&_svg]:text-subText',
      className,
    )}
    {...props}
  >
    {children}
  </div>
)

const formatAmount = (amount: number) => (amount > 0 && amount < 0.001 ? '<0.001' : amount?.toLocaleString())

const YourTransactionsModalContent = ({ onDismiss }: { onDismiss: () => void }) => {
  const { chainId } = useActiveWeb3React()
  const { proposals, calculateVotingPower } = useVotingInfo()
  const windowSize = useWindowSize()
  const isMobile = windowSize.width && windowSize.width < 768
  const [page, setPage] = useState(1)
  const pageSize = isMobile ? 5 : 10
  const { stakerActions } = useStakingInfo()
  const formattedActions: (StakerAction & { hashText: string; description: ReactNode })[] = useMemo(
    () =>
      stakerActions?.slice((page - 1) * pageSize, page * pageSize)?.map((action: StakerAction) => {
        return {
          ...action,
          hashText: action.tx_hash.slice(0, 6) + '...' + action.tx_hash.slice(-4),
          type: {
            [ActionType.VoteEmitted]: 'Vote',
            [ActionType.ClaimReward]: 'Claim',
            [ActionType.Deposit]: 'Stake',
            [ActionType.Withdraw]: 'Unstake',
            [ActionType.Delegate]: 'Delegate',
          }[action.type] as string,
          description: (() => {
            switch (action.type) {
              case ActionType.VoteEmitted: {
                const proposal = proposals?.find(p => {
                  return p.proposal_id === action.meta.proposal_id
                })
                if (!proposal) return <></>
                const amount = action.meta?.amount ?? 0
                return (
                  <>
                    {formatAmount(amount) + ' KNC'}
                    <span className="text-xs text-subText">
                      + {((+(action.meta?.amount || 0) / proposal.vote_stats?.total_vote_count) * 100).toPrecision(3)}%
                      Power
                    </span>
                  </>
                )
              }
              case ActionType.Deposit: {
                const amount = action.meta?.amount ?? 0
                return (
                  <>
                    {formatAmount(amount) + ' KNC'}
                    <span className="text-xs text-subText">
                      + {calculateVotingPower(action.meta?.amount?.toString() || '0')}% Power
                    </span>
                  </>
                )
              }
              case ActionType.Withdraw: {
                const amount = action.meta?.amount ?? 0
                return (
                  <>
                    {formatAmount(amount) + ' KNC'}
                    <span className="text-xs text-subText">
                      - {calculateVotingPower(action.meta?.amount?.toString() || '0')}% Power
                    </span>
                  </>
                )
              }
              case ActionType.Delegate:
                return (
                  <>
                    --
                    <RowFit className="text-xs text-subText">
                      to {`${action?.meta?.d_addr?.slice(0, 6)}...${action?.meta?.d_addr?.slice(-4)}`}
                      <CopyHelper
                        toCopy={action?.meta?.d_addr || ''}
                        style={{ display: 'inline-block', width: '12px', height: '16px' }}
                      />
                    </RowFit>
                  </>
                )
            }
            return action.meta.amount
              ? `${action.meta.amount} KNC`
              : action.meta.d_addr
              ? action.meta.d_addr.slice(0, 6) + '...' + action.meta.d_addr.slice(-4)
              : ''
          })(),
        }
      }) || [],
    [stakerActions, proposals, calculateVotingPower, page, pageSize],
  )
  const [, setCopied] = useCopyClipboard()
  return (
    <Modal isOpen onDismiss={onDismiss} maxHeight={750} maxWidth={800} width="70vw">
      <div className="w-full p-5">
        <Stack className="min-h-[500px] gap-4">
          <RowBetween>
            <span className="text-xl">
              <Trans>Your transactions</Trans>
            </span>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <div className="flex flex-1 flex-col">
            <TransactionGrid className="rounded-t-lg bg-background shadow-[0px_4px_16px_rgba(0,0,0,0.08)] max-sm:hidden">
              <div className="p-4 text-xs uppercase text-subText">
                <Trans>TXN HASH</Trans>
              </div>
              <div className="p-4 text-xs uppercase text-subText">
                <Trans>Action</Trans>
              </div>
              <div className="p-4 text-xs uppercase text-subText">
                <Trans>Local Time</Trans>
              </div>
              <div className="p-4 text-right text-xs uppercase text-subText">
                <Trans>Amount</Trans>
              </div>
            </TransactionGrid>
            {formattedActions.length > 0 ? (
              !isMobile ? (
                <>
                  {formattedActions.map((action: StakerAction & { hashText: string; description: ReactNode }) => {
                    return (
                      <TransactionGrid className="h-[55px] border-b border-border max-sm:h-[76px]" key={action.tx_hash}>
                        <TransactionCell>
                          <NetworkLogo style={{ width: 16, height: 16 }} chainId={ChainId.MAINNET} />
                          <span>{action.hashText}</span>
                          <div className="cursor-pointer" onClick={() => setCopied(action.tx_hash)}>
                            <CopyIcon />
                          </div>
                          <ExternalLink
                            href={getEtherscanLink(
                              chainId === ChainId.GÖRLI ? ChainId.GÖRLI : ChainId.MAINNET,
                              action.tx_hash,
                              'transaction',
                            )}
                          >
                            <LaunchIcon />
                          </ExternalLink>
                        </TransactionCell>
                        <TransactionCell>
                          <span>{action.type}</span>
                        </TransactionCell>
                        <TransactionCell>
                          <Stack>
                            <span className="text-text">{dayjs(action.timestamp * 1000).format('DD/MM/YYYY')}</span>
                            <span className="text-subText">{dayjs(action.timestamp * 1000).format('hh:mm:ss A')}</span>
                          </Stack>
                        </TransactionCell>
                        <TransactionCell>
                          <Stack className="w-full justify-end gap-2 text-text">{action.description}</Stack>
                        </TransactionCell>
                      </TransactionGrid>
                    )
                  })}
                </>
              ) : (
                <>
                  {formattedActions.map((action: StakerAction & { hashText: string; description: ReactNode }) => {
                    return (
                      <TransactionGrid className="h-[55px] border-b border-border max-sm:h-[76px]" key={action.tx_hash}>
                        <TransactionCell>
                          <Row className="gap-2">
                            <img
                              src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                              alt="knc-logo"
                              width="24px"
                              height="24px"
                            />
                            <span>{action.type}</span>
                            <div className="cursor-pointer" onClick={() => setCopied(action.tx_hash)}>
                              <CopyIcon />
                            </div>
                            <ExternalLink href={getEtherscanLink(1, action.tx_hash, 'transaction')}>
                              <LaunchIcon />
                            </ExternalLink>
                          </Row>
                          <Row className="gap-2">
                            <span className="text-text">{dayjs(action.timestamp).format('MM/DD/YYYY')}</span>
                            <span className="text-subText">{dayjs(action.timestamp).format('hh:mm:ss')}</span>
                          </Row>
                        </TransactionCell>
                        <TransactionCell>
                          <Stack className="w-full justify-end">{action.description}</Stack>
                        </TransactionCell>
                      </TransactionGrid>
                    )
                  })}
                </>
              )
            ) : (
              <Stack className="flex-1 items-center justify-center gap-2">
                <CircleInfoIcon></CircleInfoIcon>
                <span>
                  <Trans>You have no Transaction History</Trans>
                </span>
                <span>
                  <Trans>
                    Go to{' '}
                    <Link to="/kyberdao/stake-knc" onClick={onDismiss}>
                      Stake
                    </Link>
                  </Trans>
                </span>
              </Stack>
            )}
            <Pagination
              currentPage={page}
              onPageChange={e => setPage(e)}
              pageSize={pageSize}
              totalCount={stakerActions?.length || 0}
              haveBg={false}
            />
          </div>
        </Stack>
      </div>
    </Modal>
  )
}

export default function YourTransactionsModal() {
  const modalOpen = useModalOpen(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)
  const closeModal = useCloseModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)

  return modalOpen ? <YourTransactionsModalContent onDismiss={closeModal} /> : null
}
