import { Currency, Token } from '@kyberswap/ks-sdk-core'
import React, { useCallback, useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'

import { Z_INDEXS } from 'constants/styles'
import useLast from 'hooks/useLast'
import usePrevious from 'hooks/usePrevious'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import Modal from '../Modal'
import { CurrencySearch, CurrencySearchBridge } from './CurrencySearch'
import { ImportToken } from './ImportToken'

interface CurrencySearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
}

export enum CurrencyModalView {
  search,
  manage,
  importToken,
  importList,
}

export default function CurrencySearchModal({
  isOpen,
  onDismiss,
  onCurrencySelect,
  selectedCurrency,
  otherSelectedCurrency,
  showCommonBases = false,
}: CurrencySearchModalProps) {
  const [modalView, setModalView] = useState<CurrencyModalView>(CurrencyModalView.manage)
  const lastOpen = useLast(isOpen)

  useEffect(() => {
    if (isOpen && !lastOpen) {
      setModalView(CurrencyModalView.search)
    }
  }, [isOpen, lastOpen])

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect],
  )

  // for token import view
  const prevView = usePrevious(modalView)

  // used for import token flow
  const [importToken, setImportToken] = useState<Token | undefined>()

  // change min height if not searching
  const minHeight = modalView === CurrencyModalView.importToken || modalView === CurrencyModalView.importList ? 40 : 80

  const showImportView = useCallback(() => setModalView(CurrencyModalView.importToken), [])
  const showManageView = useCallback(() => setModalView(CurrencyModalView.manage), [])
  const isMobileHorizontal = Math.abs(window.orientation) === 90 && isMobile
  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      margin="auto"
      maxHeight={isMobileHorizontal ? 100 : 80}
      height={isMobileHorizontal ? '95vh' : undefined}
      minHeight={minHeight}
    >
      {modalView === CurrencyModalView.search ? (
        <CurrencySearch
          isOpen={isOpen}
          onDismiss={onDismiss}
          onCurrencySelect={handleCurrencySelect}
          selectedCurrency={selectedCurrency}
          otherSelectedCurrency={otherSelectedCurrency}
          showCommonBases={showCommonBases}
          showImportView={showImportView}
          setImportToken={setImportToken}
          showManageView={showManageView}
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

interface CurrencySearchModalBridgeProps {
  isOpen: boolean
  isOutput: boolean
  onDismiss: () => void
  onCurrencySelect: (currency: WrappedTokenInfo) => void
}
export function CurrencySearchModalBridge({
  isOpen,
  isOutput,
  onDismiss,
  onCurrencySelect,
}: CurrencySearchModalBridgeProps) {
  const handleCurrencySelect = useCallback(
    (currency: WrappedTokenInfo) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect],
  )

  return (
    <Modal
      zindex={Z_INDEXS.MODAL}
      isOpen={isOpen}
      onDismiss={onDismiss}
      margin="auto"
      maxHeight={80}
      height={isOutput ? undefined : '95vh'}
      minHeight={isOutput ? undefined : 80}
    >
      <CurrencySearchBridge
        isOutput={isOutput}
        isOpen={isOpen}
        onDismiss={onDismiss}
        onCurrencySelect={handleCurrencySelect}
      />
    </Modal>
  )
}
