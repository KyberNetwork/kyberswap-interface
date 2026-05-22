import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

import { ReactComponent as Close } from 'assets/images/x.svg'
import { NotificationType } from 'components/Announcement/type'
import {
  CloseIcon,
  ContentWrapper,
  OptionGrid,
  TermAndCondition,
  UpperSection,
} from 'components/Header/web3/WalletModal'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { DerivationPaths } from 'components/Web3Provider/BitcoinProvider/providers/ledger'
import { TERM_FILES_PATH } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useNotify } from 'state/application/hooks'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'

const Option = ({
  disabled,
  selected,
  children,
  onClick,
}: {
  disabled?: boolean
  selected?: boolean
  children: React.ReactNode
  onClick?: () => void
}) => (
  <div
    role="button"
    onClick={disabled ? undefined : onClick}
    className={cn(
      'flex h-9 w-full items-center justify-between gap-2 rounded-full bg-tableHeader px-2.5 py-2',
      disabled || selected ? 'cursor-not-allowed' : 'cursor-pointer',
      !disabled && 'hover:bg-[#171717] hover:!text-text hover:no-underline',
      selected && 'bg-[#171717]',
      disabled && 'text-border grayscale',
    )}
  >
    {children}
  </div>
)

export const BitcoinConnectModal = ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => {
  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()
  const theme = useTheme()

  const [showLedgerType, setShowLedgerType] = useState(false)
  const notify = useNotify()

  const { walletInfo, availableWallets, connectingWallet, setConnectingWallet } = useBitcoinWallet()

  useEffect(() => {
    if (walletInfo.isConnected) {
      setConnectingWallet(null)
      onDismiss()
    }
  }, [walletInfo.isConnected, onDismiss, setConnectingWallet])

  if (walletInfo.isConnected) return null

  const ledgerWallet = availableWallets.find(wallet => wallet.name === 'Ledger')

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={() => {
        setConnectingWallet(null)
        onDismiss()
      }}
      minHeight={false}
      maxHeight={90}
      maxWidth={600}
      bypassScrollLock={true}
      bypassFocusLock={true}
      zindex={99999}
    >
      <div className="m-0 flex w-full flex-col flex-nowrap p-0">
        <UpperSection>
          <RowBetween marginBottom="26px" gap="20px">
            <span className="text-xl font-medium">
              {showLedgerType ? t`Select Derivation Path` : t`Connect your Bitcoin Wallet`}
            </span>
            <CloseIcon
              onClick={() => {
                if (showLedgerType) {
                  setShowLedgerType(false)
                  return
                }
                setConnectingWallet(null)
                onDismiss()
              }}
            >
              <Close />
            </CloseIcon>
          </RowBetween>

          {!showLedgerType && (
            <TermAndCondition
              onClick={() => {
                setIsAcceptedTerm(!isAcceptedTerm)
              }}
            >
              <input
                type="checkbox"
                checked={isAcceptedTerm}
                onChange={() => {}}
                data-testid="accept-term"
                style={{ marginRight: '12px', height: '14px', width: '14px', minWidth: '14px', cursor: 'pointer' }}
              />
              <span className="text-subText">
                <Trans>
                  Accept{' '}
                  <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS} onClick={e => e.stopPropagation()}>
                    KyberSwap&lsquo;s Terms of Use
                  </ExternalLink>{' '}
                  and{' '}
                  <ExternalLink href={TERM_FILES_PATH.PRIVACY_POLICY} onClick={e => e.stopPropagation()}>
                    Privacy Policy
                  </ExternalLink>
                  {'. '}
                  <span className="text-[10px]">
                    Last updated: {dayjs(TERM_FILES_PATH.VERSION).format('DD MMM YYYY')}
                  </span>
                </Trans>
              </span>
            </TermAndCondition>
          )}

          <ContentWrapper>
            {showLedgerType ? (
              <>
                {Object.keys(DerivationPaths).map(item => {
                  return (
                    <div
                      key={item}
                      role="button"
                      className="flex cursor-pointer items-center gap-1 py-3"
                      onClick={() => {
                        ledgerWallet?.connect(DerivationPaths[item]).catch(error => {
                          console.log('Error connecting Ledger wallet:', error)
                          notify(
                            {
                              title: t`Error`,
                              summary: error.message || t`Failed to connect Ledger wallet`,
                              type: NotificationType.ERROR,
                            },
                            3000,
                          )
                        })
                        setShowLedgerType(false)
                      }}
                    >
                      <img
                        src="https://storage.googleapis.com/bitfi-static-35291d79/images/tokens/btc.svg"
                        width={20}
                        height={20}
                      />
                      <span className="ml-1.5 text-base font-medium">{item}</span>
                      <span className="text-sm text-subText">{DerivationPaths[item]}</span>
                    </div>
                  )
                })}
              </>
            ) : (
              <OptionGrid>
                {availableWallets.map(wallet => {
                  return (
                    <Option
                      disabled={!isAcceptedTerm || (connectingWallet !== null && connectingWallet !== wallet.type)}
                      selected={connectingWallet === wallet.type}
                      key={wallet.type}
                      onClick={() => {
                        if (connectingWallet) return
                        if (wallet.name === 'Ledger') {
                          setShowLedgerType(true)
                        } else wallet.connect()
                      }}
                    >
                      <div className="flex w-full items-center gap-2">
                        <img
                          src={wallet.logo}
                          alt=""
                          width={20}
                          height={20}
                          style={{
                            borderRadius: '50%',
                          }}
                        />
                        <span className="flex flex-row flex-nowrap font-medium text-subText">{wallet.name}</span>
                        {connectingWallet === wallet.type && <Loader color={theme.white} />}
                      </div>
                      <span className="min-w-max text-xs text-subText">{wallet.isInstalled() && t`Detected`}</span>
                    </Option>
                  )
                })}
              </OptionGrid>
            )}
          </ContentWrapper>
        </UpperSection>
      </div>
    </Modal>
  )
}
