import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { useMedia } from 'react-use'

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
import type { NonEvmChain, NonEvmCurrency } from 'pages/CrossChainSwap/adapters/types'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

type Props = {
  isOpen: boolean
  selectedCurrency?: Currency | null
  otherSelectedCurrency?: Currency | null
  customChainId?: ChainId
  /** Form mode delegates chain changes to the caller. Defaults to form with onSelectChain, otherwise wallet. */
  chainSelectionMode?: 'wallet' | 'form'
  initialNonEvmChain?: NonEvmChain
  selectedNonEvmCurrency?: NonEvmCurrency
  /** Enables non-EVM networks in form mode; commits before onDismiss, without EVM callbacks. */
  onSelectNonEvmCurrency?: (chain: NonEvmChain, currency: NonEvmCurrency) => void

  /** Display-unit balances only for forms that also scale their ERC-8056 balance labels. */
  scaleERC8056Balances?: boolean
  showPinnedTokens?: boolean
  /** Presentation only; hiding discovery does not change the selection mode. */
  showDiscoveryTabs?: boolean
  filterWrap?: boolean
  title?: string
  tooltip?: ReactNode
  trackingSource?: string

  onDismiss?: () => void
  onCurrencySelect?: (currency: Currency) => void
  /** Called when opening the import warning, not when the import is confirmed. */
  onCurrencyImport?: (token: Token) => void
  /** Called before onCurrencySelect when the selected EVM chain differs from customChainId/app chain. */
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
  showDiscoveryTabs = true,
  chainSelectionMode,
  onSelectNonEvmCurrency,
  initialNonEvmChain,
  selectedNonEvmCurrency,
  onSelectChain,
}: Props) => {
  const { chainId: appChainId } = useActiveWeb3React()
  const anchorChainId = customChainId || appChainId

  // Selection owns import, chain confirmation, and commit callbacks.
  const selection = useTokenSelection({
    isOpen,
    anchorChainId,
    trackingSource,
    onCurrencySelect,
    onCurrencyImport,
    onSelectChain,
    chainSelectionMode,
    onDismiss,
  })
  const { importToken } = selection
  const supportsNonEvm = selection.chainSelectionMode === 'form' && !!onSelectNonEvmCurrency

  // Track each modal session independently of the selected view.
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

  // Detail view stays mounted until slideOutRight finishes (onAnimationEnd below).
  const [tokenToShowInfo, setTokenToShowInfo] = useState<Token | null>(null)
  const [detailClosing, setDetailClosing] = useState(false)

  const closeTokenInfo = useCallback(() => {
    // With reduced motion the slide-out is suppressed and onAnimationEnd never fires, so unmount now.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setTokenToShowInfo(null)
      return
    }

    setDetailClosing(true)
  }, [])

  const isDesktopWidth = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall + 1}px)`)

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
        maxWidth={showDiscoveryTabs && isDesktopWidth && !tokenToShowInfo && !importToken ? '720px' : '480px'}
        width={showDiscoveryTabs && isDesktopWidth ? 'calc(100vw - 32px)' : undefined}
        className={tokenToShowInfo || importToken ? undefined : '!overflow-hidden'}
        maxHeight="calc(100dvh - 32px)"
        height={importToken && !tokenToShowInfo ? undefined : 'min(800px, 75dvh)'}
      >
        {/* Kept mounted (only hidden) behind the token-info / import overlays so the search view's
            selected chain, tab, query and scroll survive those round-trips — unmounting it resets them. */}
        <div className={cn(tokenToShowInfo || importToken ? 'hidden' : 'contents')}>
          <TokenSelectorContent
            onDismiss={selection.dismiss}
            onRequestSelect={selection.requestSelection}
            anchorChainId={anchorChainId}
            chainSelectionMode={selection.chainSelectionMode}
            initialNonEvmChain={supportsNonEvm ? initialNonEvmChain : undefined}
            selectedNonEvmCurrency={supportsNonEvm ? selectedNonEvmCurrency : undefined}
            onSelectNonEvmCurrency={
              supportsNonEvm && onSelectNonEvmCurrency
                ? (chain, currency) => {
                    onSelectNonEvmCurrency(chain, currency)
                    selection.dismiss()
                  }
                : undefined
            }
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
            <TokenInfo tokens={[tokenToShowInfo]} onBack={closeTokenInfo} />
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
