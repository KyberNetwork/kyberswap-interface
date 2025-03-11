import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { usePrevious } from 'react-use'

import Modal from 'components/Modal'
import TokenInfoTab from 'components/swapv2/TokenInfo'
import useLast from 'hooks/useLast'
import { Field } from 'state/swap/actions'

import { CurrencySearch } from './CurrencySearch'
import { ImportToken } from './ImportToken'

interface CurrencySearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
  filterWrap?: boolean
  title?: string
  tooltip?: ReactNode
  onCurrencyImport?: (token: Token) => void
  customChainId?: ChainId
}

enum CurrencyModalView {
  search,
  importToken,
}

export default function CurrencySearchModal({
  isOpen,
  onDismiss,
  onCurrencySelect,
  selectedCurrency,
  otherSelectedCurrency,
  showCommonBases = false,
  filterWrap,
  title,
  tooltip,
  onCurrencyImport,
  customChainId,
}: CurrencySearchModalProps) {
  const [modalView, setModalView] = useState<CurrencyModalView>(CurrencyModalView.search)
  const lastOpen = useLast(isOpen)

  useEffect(() => {
    if (isOpen && !lastOpen) {
      setModalView(CurrencyModalView.search)
    }
  }, [isOpen, lastOpen])

  const handleCurrencySelect = useCallback(
    (currency: Currency[] | Currency) => {
      onCurrencySelect(Array.isArray(currency) ? currency[0] : currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect],
  )

  // for token import view
  const prevView = usePrevious(modalView)

  // used for import token flow
  const [importToken, setImportToken] = useState<Token | undefined>()

  // change min height if not searching
  const minHeight = modalView === CurrencyModalView.importToken ? 40 : 80

  const isMobileHorizontal = Math.abs(window.orientation) === 90 && isMobile

  const onImportToken = useCallback(
    (token: Token) => {
      setImportToken(token)
      setModalView(CurrencyModalView.importToken)
      onCurrencyImport?.(token)
    },
    [onCurrencyImport],
  )

  const [tokenToShowInfo, setTokenToShowInfo] = useState<Token | null>(null)

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={() => {
        setTokenToShowInfo(null)
        onDismiss()
      }}
      margin="auto"
      maxHeight={isMobileHorizontal ? 100 : 80}
      height={isMobileHorizontal ? '95vh' : undefined}
      minHeight={minHeight}
    >
      {tokenToShowInfo ? (
        <div style={{ width: '100%' }}>
          <TokenInfoTab
            currencies={{ [Field.INPUT]: tokenToShowInfo, [Field.OUTPUT]: tokenToShowInfo }}
            onBack={() => setTokenToShowInfo(null)}
          />
        </div>
      ) : modalView === CurrencyModalView.search ? (
        <CurrencySearch
          isOpen={isOpen}
          onDismiss={onDismiss}
          onCurrencySelect={handleCurrencySelect}
          selectedCurrency={selectedCurrency}
          otherSelectedCurrency={otherSelectedCurrency}
          showCommonBases={showCommonBases}
          setImportToken={onImportToken}
          filterWrap={filterWrap}
          title={title}
          tooltip={tooltip}
          customChainId={customChainId}
          setTokenToShowInfo={setTokenToShowInfo}
        />
      ) : modalView === CurrencyModalView.importToken && importToken ? (
        <ImportToken
          tokens={[importToken]}
          onDismiss={onDismiss}
          onBack={() =>
            setModalView(prevView && prevView !== CurrencyModalView.importToken ? prevView : CurrencyModalView.search)
          }
          handleCurrencySelect={handleCurrencySelect}
        />
      ) : null}
    </Modal>
  )
}
