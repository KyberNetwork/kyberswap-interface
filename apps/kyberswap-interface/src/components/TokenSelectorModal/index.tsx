import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { usePrevious } from 'react-use'

import Modal from 'components/Modal'
import { ImportTokenView } from 'components/TokenSelectorModal/ImportTokenView'
import { TokenSelectorContent } from 'components/TokenSelectorModal/TokenSelectorContent'
import TokenInfoTab from 'components/swapv2/TokenInfo'
import useLast from 'hooks/useLast'
import { Field } from 'state/swap/actions'
import { cn } from 'utils/cn'

interface TokenSelectorModalProps {
  isOpen: boolean
  onDismiss?: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect?: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showPinnedTokens?: boolean
  filterWrap?: boolean
  title?: string
  tooltip?: ReactNode
  onCurrencyImport?: (token: Token) => void
  customChainId?: ChainId
  trackingSource?: string
}

enum TokenSelectorModalView {
  search,
  importToken,
}

const TokenSelectorModal = ({
  isOpen,
  onDismiss,
  onCurrencySelect,
  selectedCurrency,
  otherSelectedCurrency,
  showPinnedTokens,
  filterWrap,
  title,
  tooltip,
  onCurrencyImport,
  customChainId,
  trackingSource,
}: TokenSelectorModalProps) => {
  const [modalView, setModalView] = useState<TokenSelectorModalView>(TokenSelectorModalView.search)
  const lastOpen = useLast(isOpen)

  useEffect(() => {
    if (isOpen && !lastOpen) {
      setModalView(TokenSelectorModalView.search)
    }
  }, [isOpen, lastOpen])

  const handleCurrencySelect = useCallback(
    (currency: Currency[] | Currency) => {
      onCurrencySelect?.(Array.isArray(currency) ? currency[0] : currency)
      onDismiss?.()
    },
    [onDismiss, onCurrencySelect],
  )

  // for token import view
  const prevView = usePrevious(modalView)

  // used for import token flow
  const [importToken, setImportToken] = useState<Token | undefined>()

  // change min height if not searching
  const minHeight = modalView === TokenSelectorModalView.importToken ? 'fit-content' : 80

  const isMobileHorizontal = Math.abs(window.orientation) === 90 && isMobile

  const onImportToken = useCallback(
    (token: Token) => {
      setImportToken(token)
      setModalView(TokenSelectorModalView.importToken)
      onCurrencyImport?.(token)
    },
    [onCurrencyImport],
  )

  const [tokenToShowInfo, setTokenToShowInfo] = useState<Token | null>(null)
  // Detail view keeps mounting through its slide-out so the "←" back has an exit animation; it
  // unmounts only once slideOutRight finishes (onAnimationEnd below).
  const [detailClosing, setDetailClosing] = useState(false)
  const closeTokenInfo = useCallback(() => {
    // With reduced motion the slide-out is suppressed and onAnimationEnd never fires, so unmount now.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setTokenToShowInfo(null)
      return
    }
    setDetailClosing(true)
  }, [])

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={() => {
        setTokenToShowInfo(null)
        setDetailClosing(false)
        onDismiss?.()
      }}
      margin="auto"
      maxWidth="480px"
      maxHeight={isMobileHorizontal ? 100 : 80}
      minHeight={minHeight}
      height={isMobileHorizontal ? '95vh' : undefined}
    >
      {tokenToShowInfo ? (
        <div
          className={cn(
            'w-full motion-reduce:animate-none',
            detailClosing ? 'animate-slideOutRight' : 'animate-slideInRight',
          )}
          onAnimationEnd={e => {
            // Only react to the wrapper's own slide-out finishing (ignore bubbled child animations).
            if (e.target === e.currentTarget && detailClosing) {
              setTokenToShowInfo(null)
              setDetailClosing(false)
            }
          }}
        >
          <TokenInfoTab
            currencies={{ [Field.INPUT]: tokenToShowInfo, [Field.OUTPUT]: tokenToShowInfo }}
            onBack={closeTokenInfo}
          />
        </div>
      ) : modalView === TokenSelectorModalView.search ? (
        <TokenSelectorContent
          isOpen={isOpen}
          onDismiss={onDismiss}
          onCurrencySelect={handleCurrencySelect}
          selectedCurrency={selectedCurrency}
          otherSelectedCurrency={otherSelectedCurrency}
          showPinnedTokens={showPinnedTokens}
          onImportToken={onImportToken}
          filterWrap={filterWrap}
          title={title}
          tooltip={tooltip}
          customChainId={customChainId}
          trackingSource={trackingSource}
          onShowTokenInfo={setTokenToShowInfo}
        />
      ) : modalView === TokenSelectorModalView.importToken && importToken ? (
        <ImportTokenView
          tokens={[importToken]}
          onDismiss={onDismiss}
          onBack={() =>
            setModalView(
              prevView && prevView !== TokenSelectorModalView.importToken ? prevView : TokenSelectorModalView.search,
            )
          }
          onCurrencySelect={handleCurrencySelect}
        />
      ) : null}
    </Modal>
  )
}

export default TokenSelectorModal
