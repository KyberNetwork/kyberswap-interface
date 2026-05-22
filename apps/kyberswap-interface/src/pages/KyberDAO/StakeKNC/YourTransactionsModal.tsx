import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, useMemo, useState } from 'react'
import { X } from 'react-feather'
import { Link } from 'react-router-dom'

import { AutoColumn } from 'components/Column'
import CopyHelper from 'components/Copy'
import CopyIcon from 'components/Icons/CopyIcon'
import LaunchIcon from 'components/Icons/LaunchIcon'
import CircleInfoIcon from 'components/LiveChart/CircleInfoIcon'
import { NetworkLogo } from 'components/Logo'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import Row, { RowBetween, RowFit } from 'components/Row'
import { KNC_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useStakingInfo, useVotingInfo } from 'hooks/kyberdao'
import { ActionType, StakerAction } from 'hooks/kyberdao/types'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'
import { useWindowSize } from 'hooks/useWindowSize'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { getEtherscanLink, getTokenLogoURL } from 'utils'

const gridCols = 'grid-cols-[5fr_3fr_3fr_3fr]'
const gridColsMobile = 'max-sm:grid-cols-[1fr_1fr]'
const tableCellClass =
  'flex items-center gap-1 px-4 py-2.5 text-sm text-text [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-subText max-sm:flex-col max-sm:justify-between max-sm:px-0 max-sm:py-3 max-sm:[&>*]:flex-1'

const formatAmount = (amount: number) => (amount > 0 && amount < 0.001 ? '<0.001' : amount?.toLocaleString())

export default function YourTransactionsModal() {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const { proposals, calculateVotingPower } = useVotingInfo()
  const modalOpen = useModalOpen(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)
  const toggleModal = useToggleModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)
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
                    <RowFit fontSize={12} color={theme.subText}>
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
    [stakerActions, proposals, calculateVotingPower, theme.subText, page, pageSize],
  )
  const [, setCopied] = useCopyClipboard()
  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal} maxHeight={750} maxWidth={800} width="70vw">
      <div className="w-full p-5">
        <div className="flex min-h-[500px] flex-col gap-5">
          <RowBetween>
            <span className="text-xl">
              <Trans>Your transactions</Trans>
            </span>
            <div className="flex cursor-pointer" role="button" onClick={toggleModal}>
              <X onClick={toggleModal} size={20} color={theme.subText} />
            </div>
          </RowBetween>
          <div className="flex flex-1 flex-col">
            <div
              className={`grid ${gridCols} rounded-t-lg bg-background shadow-[0px_4px_16px_rgba(0,0,0,0.08)] max-sm:hidden`}
            >
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
            </div>
            {formattedActions.length > 0 ? (
              !isMobile ? (
                <>
                  {formattedActions.map((action: StakerAction & { hashText: string; description: ReactNode }) => {
                    return (
                      <div
                        className={`grid ${gridCols} ${gridColsMobile} h-[55px] border-b border-border max-sm:h-[76px]`}
                        key={action.tx_hash}
                      >
                        <div className={tableCellClass}>
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
                        </div>
                        <div className={tableCellClass}>
                          <span>{action.type}</span>
                        </div>
                        <div className={tableCellClass}>
                          <AutoColumn>
                            <span className="text-text">{dayjs(action.timestamp * 1000).format('DD/MM/YYYY')}</span>
                            <span className="text-subText">{dayjs(action.timestamp * 1000).format('hh:mm:ss A')}</span>
                          </AutoColumn>
                        </div>
                        <div className={tableCellClass}>
                          <AutoColumn justify="flex-end" style={{ width: '100%', color: theme.text }} gap="4px">
                            {action.description}
                          </AutoColumn>
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <>
                  {formattedActions.map((action: StakerAction & { hashText: string; description: ReactNode }) => {
                    return (
                      <div
                        className={`grid ${gridCols} ${gridColsMobile} h-[55px] border-b border-border max-sm:h-[76px]`}
                        key={action.tx_hash}
                      >
                        <div className={tableCellClass}>
                          <Row gap="4px">
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
                          <Row gap="4px">
                            <span className="text-text">{dayjs(action.timestamp).format('MM/DD/YYYY')}</span>
                            <span className="text-subText">{dayjs(action.timestamp).format('hh:mm:ss')}</span>
                          </Row>
                        </div>
                        <div className={tableCellClass}>
                          <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                            {action.description}
                          </AutoColumn>
                        </div>
                      </div>
                    )
                  })}
                </>
              )
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2.5">
                <CircleInfoIcon></CircleInfoIcon>
                <span>
                  <Trans>You have no Transaction History.</Trans>
                </span>
                <span>
                  <Trans>
                    Go to{' '}
                    <Link to="/kyberdao/stake-knc" onClick={() => toggleModal()}>
                      Stake
                    </Link>
                  </Trans>
                </span>
              </div>
            )}
            <Pagination
              currentPage={page}
              onPageChange={e => setPage(e)}
              pageSize={pageSize}
              totalCount={stakerActions?.length || 0}
              haveBg={false}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
