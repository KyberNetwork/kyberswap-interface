import { t } from '@lingui/macro'
import dayjs from 'dayjs'

import { ReactComponent as Close } from 'assets/images/x.svg'
import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { TERM_FILES_PATH } from 'constants/index'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'

export const Wrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('m-0 flex w-full flex-col flex-nowrap p-0', className)} {...rest}>
    {children}
  </div>
)

export const UpperSection = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative p-6', className)} {...rest}>
    {children}
  </div>
)

export const CloseIcon = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('h-6 cursor-pointer self-end text-text hover:opacity-60', className)} {...rest}>
    {children}
  </div>
)

export const TermAndCondition = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex cursor-pointer items-center rounded-2xl bg-buttonBlack-40 p-2 text-xs font-medium leading-4 accent-primary hover:bg-buttonBlack-60',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export default function TermAndPolicy({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onClose}
      minHeight={false}
      maxHeight={90}
      maxWidth={430}
      bypassScrollLock
      bypassFocusLock
      zindex={99999}
    >
      <Wrapper>
        <UpperSection>
          <RowBetween marginBottom="26px" gap="20px">
            <span>{t`Connect your Wallet`}</span>
            <CloseIcon onClick={onClose}>
              <Close />
            </CloseIcon>
          </RowBetween>
          <TermAndCondition onClick={() => setIsAcceptedTerm(!isAcceptedTerm)}>
            <input
              type="checkbox"
              checked={isAcceptedTerm}
              onChange={() => {
                // controlled — toggled via parent onClick
              }}
              data-testid="accept-term"
              style={{ marginRight: '12px', height: '14px', width: '14px', minWidth: '14px', cursor: 'pointer' }}
            />
            <span className="text-subText">
              <span>{t`Accept`}</span>{' '}
              <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS} onClick={e => e.stopPropagation()}>
                <span>{t`KyberSwap's Terms of Use`}</span>
              </ExternalLink>{' '}
              <span>{t`and`}</span>{' '}
              <ExternalLink href={TERM_FILES_PATH.PRIVACY_POLICY} onClick={e => e.stopPropagation()}>
                <span>{t`Privacy Policy`}</span>
              </ExternalLink>
              {'. '}
              <span className="text-[10px]">
                {t`Last updated:`} {dayjs(TERM_FILES_PATH.VERSION).format('DD MMM YYYY')}
              </span>
            </span>
          </TermAndCondition>
          <div className="mt-6 flex justify-center">
            <ButtonPrimary width={'120px'} disabled={!isAcceptedTerm} onClick={onConfirm}>
              {t`Continue`}
            </ButtonPrimary>
          </div>
        </UpperSection>
      </Wrapper>
    </Modal>
  )
}
