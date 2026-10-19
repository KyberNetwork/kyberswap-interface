import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'

import Modal from 'components/Modal'
import TokenInfo from 'components/TokenInfo'
import { ImportTokenView } from 'components/TokenSelectorModal/ImportTokenView'
import { SwitchChainModal } from 'components/TokenSelectorModal/SwitchChainModal'
import { TokenSelectorContent } from 'components/TokenSelectorModal/TokenSelectorContent'
import { useTokenSelection } from 'components/TokenSelectorModal/hooks/useTokenSelection'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useLast from 'hooks/useLast'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { Field } from 'state/swap/actions'
import { cn } from 'utils/cn'

type Props = {
  isOpen: boolean
  selectedCurrency?: Currency | null
  otherSelectedCurrency?: Currency | null
  customChainId?: ChainId
  /** Display-unit balances only for forms that also scale their ERC-8056 balance labels. */
  scaleERC8056Balances?: boolean
  showPinnedTokens?: boolean
  showDiscoveryTabs?: boolean
  filterWrap?: boolean
  title?: string
  tooltip?: ReactNode
  trackingSource?: string
  onDismiss?: () => void
  onCurrencySelect?: (currency: Currency) => void
  onCurrencyImport?: (token: Token) => void
  /** The form owns its chain state when supplied; otherwise selection switches the app/wallet. */
  onSelectChain?: (chainId: ChainId) => void
}

const TokenSelectorModal = ({
  isOpen,
  onDismiss,
  onCurrencySelect,
  selectedCurrency,
  otherSelectedCurrency,
  scaleERC8056Balances,
  showPinnedTokens,
  filterWrap,
  title,
  tooltip,
  onCurrencyImport,
  customChainId,
  trackingSource,
  showDiscoveryTabs,
  onSelectChain,
}: Props) => {
  const { chainId: appChainId } = useActiveWeb3React()
  const anchorChainId = customChainId || appChainId
  const selection = useTokenSelection({
    isOpen,
    anchorChainId,
    trackingSource,
    onCurrencySelect,
    onCurrencyImport,
    onSelectChain,
    onDismiss,
  })
  const { importToken } = selection
  const lastOpen = useLast(isOpen)
  const { trackingHandler } = useTracking()
  useEffect(() => {
    if (isOpen && !lastOpen) {
      trackingHandler(TRACKING_EVENT_TYPE.TS_OPENED, {
        source: trackingSource,
        chain: NETWORKS_INFO[anchorChainId].name,
        chain_id: anchorChainId,
      })
    }
  }, [isOpen, lastOpen, trackingHandler, trackingSource, anchorChainId])
  const minHeight = importToken ? 'fit-content' : 80
  const isMobileHorizontal = Math.abs(window.orientation) === 90 && isMobile

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
    <>
      <Modal
        isOpen={isOpen}
        onDismiss={() => {
          setTokenToShowInfo(null)
          setDetailClosing(false)
          selection.dismiss()
        }}
        bgColor="var(--ks-background)"
        margin={isMobile ? undefined : 'auto'}
        maxWidth="480px"
        maxHeight={isMobileHorizontal ? 100 : 80}
        minHeight={minHeight}
        height={isMobileHorizontal ? '95vh' : undefined}
      >
        {/* Kept mounted (only hidden) behind the token-info / import overlays so the search view's
            selected chain, tab, query and scroll survive those round-trips — unmounting it resets them. */}
        <div className={cn(tokenToShowInfo || importToken ? 'hidden' : 'contents')}>
          <TokenSelectorContent
            onDismiss={selection.dismiss}
            onRequestSelect={selection.requestSelection}
            anchorChainId={anchorChainId}
            importChainId={importToken?.chainId}
            selectedCurrency={selectedCurrency}
            otherSelectedCurrency={otherSelectedCurrency}
            scaleERC8056Balances={scaleERC8056Balances}
            showPinnedTokens={showPinnedTokens}
            filterWrap={filterWrap}
            title={title}
            tooltip={tooltip}
            trackingSource={trackingSource}
            showDiscoveryTabs={showDiscoveryTabs}
            onShowTokenInfo={setTokenToShowInfo}
          />
        </div>
        {importToken && !tokenToShowInfo ? (
          <ImportTokenView
            tokens={[importToken]}
            onDismiss={selection.dismiss}
            onBack={selection.reset}
            onCurrencySelect={selection.confirmImport}
          />
        ) : null}
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
            <TokenInfo
              currencies={{ [Field.INPUT]: tokenToShowInfo, [Field.OUTPUT]: tokenToShowInfo }}
              onBack={closeTokenInfo}
            />
          </div>
        ) : null}
      </Modal>
      <SwitchChainModal
        token={selection.switchChainToken}
        onDismiss={selection.reset}
        onConfirm={selection.confirmChain}
      />
    </>
  )
}

export default TokenSelectorModal
