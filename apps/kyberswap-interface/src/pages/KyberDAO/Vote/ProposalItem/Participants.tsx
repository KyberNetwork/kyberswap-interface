import { Trans } from '@lingui/macro'
import { useMemo, useState } from 'react'
import kyberDAOApi from 'services/kyberDAO'

import Gold from 'assets/svg/gold_icon.svg'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { HStack, Stack } from 'components/Stack'
import { ProposalType, VoteDetail } from 'hooks/kyberdao/types'
import { KyberDAOCardDivider } from 'pages/KyberDAO/common'
import { HARDCODED_OPTION_TITLE } from 'pages/KyberDAO/constants'
import { cn } from 'utils/cn'
import { getFullDisplayBalance } from 'utils/formatBalance'

const WON_OPTION_BG =
  'linear-gradient(180deg, rgba(41, 41, 41, 0) 0%, rgba(41, 41, 41, 0.12) 54.69%, rgba(41, 41, 41, 0.7) 100%), linear-gradient(90deg, rgba(228, 181, 86, 0.25) 0%, rgba(241, 192, 94, 0.127155) 69.27%, rgba(255, 204, 102, 0) 100%)'

const OptionWrapper = ({
  isWonOption,
  hasHoverStyle,
  children,
  className,
  onClick,
  style,
}: {
  isWonOption?: boolean
  hasHoverStyle?: boolean
  children: React.ReactNode
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}) => (
  <div
    onClick={onClick}
    style={isWonOption ? { background: WON_OPTION_BG, ...style } : style}
    className={cn(
      'overflow-hidden rounded-2xl border border-border bg-buttonBlack transition-all duration-100',
      hasHoverStyle && 'cursor-pointer hover:shadow-[0_2px_5px_2px_var(--ks-buttonBlack)] hover:brightness-125',
      className,
    )}
  >
    {children}
  </div>
)

const TableHeaderWrapper = ({ children }: { children: React.ReactNode }) => (
  <RowBetween className="text-xs text-subText [&>*:last-child]:text-right [&>*:nth-child(2)]:text-center [&>*]:flex-1">
    {children}
  </RowBetween>
)

const InfoRow = ({ children }: { children: React.ReactNode }) => (
  <RowBetween className="py-1.5 text-xs [&>*:last-child]:text-right [&>*:nth-child(2)]:text-center [&>*]:flex-1">
    {children}
  </RowBetween>
)

const VotersListModal = ({
  isOpen,
  onDismiss,
  participants,
  isWonOption,
  sumPower,
  option,
}: {
  isOpen: boolean
  onDismiss: () => void
  participants: VoteDetail[]
  isWonOption: boolean
  sumPower: number | undefined
  option: string
}) => {
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <OptionWrapper isWonOption={isWonOption} className="w-full">
        <RowBetween className="gap-4 p-4">
          <HStack className="min-w-0 items-center gap-2">
            {isWonOption && <img alt="gold-medal" src={Gold} />}
            <span className="overflow-hidden text-ellipsis">{option}</span>
          </HStack>

          <span className="shrink-0">{sumPower ? Math.round(sumPower).toLocaleString() : '--'}</span>
        </RowBetween>
        <KyberDAOCardDivider />
        <div className="px-4 py-3">
          <TableHeaderWrapper>
            <span>
              <Trans>Wallet</Trans>
            </span>
            <span>
              <Trans>Amount</Trans>
            </span>
          </TableHeaderWrapper>
        </div>
        <KyberDAOCardDivider />
        <div
          className="select-none overflow-auto px-4 py-3"
          style={{ height: 'fit-content', maxHeight: '70vh', minHeight: '200px' }}
        >
          {participants.map(vote => {
            return (
              <InfoRow key={vote.staker}>
                <span>{vote.staker_name || vote.staker}</span>
                <span className="text-subText">{vote.power}</span>
              </InfoRow>
            )
          })}
        </div>
      </OptionWrapper>
    </Modal>
  )
}

export default function Participants({ proposalId }: { proposalId?: number }) {
  const [modalIndex, setModalIndex] = useState<number | null>(null)

  const { data: proposalInfo } = kyberDAOApi.useGetProposalByIdQuery({ id: proposalId }, { skip: !proposalId })

  const participants = useMemo(() => {
    if (!proposalInfo?.vote_stats?.votes) return
    return proposalInfo.vote_stats.votes
      .slice()
      .sort((a, b) => (BigInt(a.power) > BigInt(b.power) ? -1 : 1))
      .map(v => {
        return {
          ...v,
          staker: v.staker.slice(0, 9) + '...' + v.staker.slice(-4),
          power: Math.floor(parseFloat(getFullDisplayBalance(v.power, 18))).toLocaleString(),
        }
      })
  }, [proposalInfo])
  const options = proposalInfo?.options.map(
    (option, index) => (proposalId ? HARDCODED_OPTION_TITLE[proposalId] : {})?.[index] || option,
  )

  const isLongText = useMemo(() => {
    if (!options) return false
    return options.some(o => o.length > 30)
  }, [options])

  return (
    <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {options && participants
        ? options.map((optionTitle, index) => {
            const sumPower = proposalInfo?.vote_stats.options.find(option => option.option === index)?.vote_count
            const isWonOption =
              proposalInfo?.proposal_type === ProposalType.BinaryProposal &&
              proposalInfo?.vote_stats?.options.reduce((max, o) => (o.vote_count > max.vote_count ? o : max)).option ===
                index
            const filteredParticipants = participants.filter(p => p.option === index)
            const hardCodedTitle = proposalId ? HARDCODED_OPTION_TITLE[proposalId]?.[index] : undefined
            return (
              <OptionWrapper
                key={optionTitle}
                isWonOption={isWonOption}
                onClick={() => setModalIndex(index)}
                hasHoverStyle
              >
                <RowBetween className="gap-4 p-4">
                  <HStack className="min-w-0 items-center gap-2">
                    {isWonOption && <img alt="gold-medal" src={Gold} />}
                    <span className={cn('overflow-hidden text-ellipsis', isLongText ? 'text-sm' : 'text-base')}>
                      {hardCodedTitle || optionTitle}
                    </span>
                  </HStack>

                  <span className={cn('shrink-0', isLongText ? 'text-sm' : 'text-base')}>
                    {sumPower ? Math.round(sumPower).toLocaleString() : '--'}
                  </span>
                </RowBetween>
                <KyberDAOCardDivider />
                <div className="px-4 py-3">
                  <TableHeaderWrapper>
                    <span>
                      <Trans>Wallet</Trans>
                    </span>
                    <span>
                      <Trans>Amount</Trans>
                    </span>
                  </TableHeaderWrapper>
                </div>
                <KyberDAOCardDivider />

                <Stack className="h-40 select-none overflow-auto px-4 py-3 max-sm:h-32">
                  {filteredParticipants.slice(0, 5).map(vote => {
                    return (
                      <InfoRow key={vote.staker}>
                        <span>{vote.staker_name || vote.staker}</span>
                        <span className="text-subText">{vote.power}</span>
                      </InfoRow>
                    )
                  })}
                  {filteredParticipants.length > 5 && (
                    <Row className="justify-center pt-2">
                      <span className="text-xs text-primary">View more</span>
                    </Row>
                  )}
                </Stack>
                <VotersListModal
                  participants={filteredParticipants}
                  isOpen={index === modalIndex}
                  onDismiss={() => setModalIndex(null)}
                  isWonOption={isWonOption}
                  sumPower={sumPower}
                  option={optionTitle}
                />
              </OptionWrapper>
            )
          })
        : null}
    </div>
  )
}
