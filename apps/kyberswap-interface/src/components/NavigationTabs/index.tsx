import { Trans, t } from '@lingui/macro'
import { ArrowLeft, ChevronLeft, Trash } from 'react-feather'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'

import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import { ButtonEmpty } from 'components/Button'
import Copy from 'components/Copy'
import QuestionHelper from 'components/QuestionHelper'
import { RowBetween } from 'components/Row'
import { ShareButtonWithModal } from 'components/ShareModal'
import TransactionSettings from 'components/TransactionSettings'
import Tutorial, { TutorialType } from 'components/Tutorial'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { shortenAddress } from 'utils'
import { cn } from 'utils/cn'

export const StyledMenuButton = ({
  active,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) => (
  <button
    {...rest}
    className={cn(
      'relative m-0 flex size-9 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-subText hover:bg-buttonBlack hover:outline-none',
      active && 'bg-buttonBlack outline-none',
      className,
    )}
  >
    {children}
  </button>
)

export function FindPoolTabs() {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const goBack = () => {
    if (location.key === 'default') navigate('/')
    else navigate(-1)
  }

  return (
    <div className="flex flex-row flex-nowrap items-center justify-evenly rounded-[3rem]">
      <RowBetween style={{ padding: '1rem' }}>
        <ButtonEmpty width="fit-content" padding="0" onClick={goBack}>
          <ArrowLeft color={theme.text} />
        </ButtonEmpty>
        <div className="text-xl font-medium">
          <Trans>Import Pool</Trans>
        </div>
        <QuestionHelper text={t`Use this tool to find pairs that don't automatically appear in the interface`} />
      </RowBetween>
    </div>
  )
}

export enum LiquidityAction {
  CREATE,
  ADD,
  INCREASE,
  REMOVE,
}

export function AddRemoveTabs({
  isElastic,
  action,
  alignTitle = 'center',
  showTooltip = true,
  hideShare = false,
  onShared,
  onCleared,
  onBack,
  tooltip,
  tutorialType,
  owner,
  showOwner,
}: {
  isElastic?: boolean
  action: LiquidityAction
  alignTitle?: 'center' | 'left'
  showTooltip?: boolean
  hideShare?: boolean
  onShared?: () => void
  onCleared?: () => void
  onBack?: () => void
  tooltip?: string
  owner?: string
  showOwner?: boolean
  tutorialType?: TutorialType
}) {
  const { chainId } = useActiveWeb3React()
  const navigate = useNavigate()
  const location = useLocation()
  const below768 = useMedia('(max-width: 768px)')
  const goBack = () => {
    if (location.key === 'default') navigate('/')
    else navigate(-1)
  }

  const theme = useTheme()
  const arrow = (
    <ButtonEmpty
      width="fit-content"
      padding="0"
      onClick={!!onBack ? onBack : goBack}
      className="!mr-2 !h-7 !w-7 !justify-center hover:!cursor-pointer hover:!bg-buttonBlack hover:!outline-none focus:!outline-none"
    >
      {alignTitle === 'left' ? <ChevronLeft color={theme.subText} /> : <ArrowLeft color={theme.text} />}
    </ButtonEmpty>
  )
  const title = (
    <div className="flex">
      <div className="text-xl font-medium">
        {action === LiquidityAction.CREATE
          ? t`Create a new pool`
          : action === LiquidityAction.ADD
          ? t`Add Liquidity`
          : action === LiquidityAction.INCREASE
          ? t`Increase Liquidity`
          : t`Remove Liquidity`}
      </div>
      {showTooltip && (
        <QuestionHelper
          size={16}
          text={
            tooltip ||
            (action === LiquidityAction.CREATE
              ? t`Create a new liquidity pool and earn fees on trades for this token pair.`
              : action === LiquidityAction.ADD
              ? t`Add liquidity for a token pair and earn fees on the trades that are in your selected price range.`
              : action === LiquidityAction.INCREASE
              ? ''
              : action === LiquidityAction.REMOVE
              ? t`Removing pool tokens converts your position back into underlying tokens at the current rate, proportional to your share of the pool. Accrued fees are included in the amounts you receive.`
              : '')
          }
        />
      )}
    </div>
  )
  return (
    <div className="flex flex-row flex-nowrap items-center justify-evenly rounded-[3rem]">
      <RowBetween className="pb-1 pt-4 sm:py-4">
        {below768 || alignTitle === 'left' ? (
          <div className="flex items-center">
            {arrow}
            {title}
          </div>
        ) : (
          <>
            {arrow}
            {title}
          </>
        )}
        <div className="flex gap-0">
          {showOwner && owner && (
            <span className="mr-2 flex items-center text-xs font-medium text-subText">
              <Trans>The owner of this liquidity position is {shortenAddress(chainId, owner)}</Trans>
              <Copy toCopy={owner}></Copy>
            </span>
          )}

          {tutorialType && (
            <Tutorial
              type={tutorialType}
              customIcon={
                <StyledMenuButton>
                  <TutorialIcon />
                </StyledMenuButton>
              }
            />
          )}
          {onCleared && (
            <StyledMenuButton active={false} onClick={onCleared}>
              <Trash size={18} />
            </StyledMenuButton>
          )}
          <TransactionSettings isElastic={isElastic} hoverBg={theme.buttonBlack} />
          {!hideShare && <ShareButtonWithModal onShared={onShared} title={t`Share with your friends!`} />}
        </div>
      </RowBetween>
    </div>
  )
}
