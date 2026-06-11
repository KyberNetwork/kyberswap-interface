import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect } from 'react'
import { AlertTriangle, ArrowLeft } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import Card from 'components/Card'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import { HStack, Stack } from 'components/Stack'
import { PaddedColumn } from 'components/TokenSelectorModal/components'
import { useAddUserToken } from 'state/user/hooks'
import { CloseIcon } from 'theme'
import { ExternalLinkIcon } from 'theme/components'
import { getEtherscanLink, shortenAddress } from 'utils'

type ImportTokenViewProps = {
  enterToImport?: boolean
  tokens: Token[]
  onBack?: () => void
  onDismiss?: () => void
  onCurrencySelect?: (currency: Currency[]) => void
}

export const ImportTokenView = ({
  enterToImport = false,
  tokens,
  onBack,
  onDismiss,
  onCurrencySelect,
}: ImportTokenViewProps) => {
  const addToken = useAddUserToken()

  const onClickImport = useCallback(() => {
    tokens.forEach(addToken)
    onCurrencySelect?.(tokens)
  }, [tokens, addToken, onCurrencySelect])

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && enterToImport) {
        event.preventDefault()
        onClickImport()
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('keydown', onKeydown)
    }
  }, [onClickImport, enterToImport])

  return (
    <div className="relative w-full overflow-auto">
      <PaddedColumn className="w-full flex-1 gap-[14px]">
        <HStack className="items-center justify-between">
          {onBack ? <ArrowLeft className="cursor-pointer" onClick={onBack} /> : <span className="size-6" />}
          <span className="text-xl font-medium leading-[normal]">
            {tokens.length > 1 ? t`Import Tokens` : t`Import Token`}
          </span>
          {onDismiss ? <CloseIcon onClick={onDismiss} /> : <span className="size-6" />}
        </HStack>
      </PaddedColumn>
      <div className="h-px w-full bg-bg3" />
      <Stack className="gap-4 p-4">
        <Card className="w-fit rounded-[20px] bg-warning-20 p-[15px]">
          <HStack className="items-start gap-2">
            <span>
              <AlertTriangle size="17px" className="text-warning" />
            </span>
            <span className="text-sm font-medium text-warning">
              <Trans>This token isn’t frequently swapped. Please do your own research before trading.</Trans>
            </span>
          </HStack>
        </Card>
        {tokens.map(token => {
          return (
            <Card className="bg-buttonBlack p-8" key={token.address}>
              <HStack className="gap-2.5">
                <CurrencyLogo currency={token} size={'44px'} />
                <Stack className="gap-1">
                  <span className="text-xl font-medium leading-[normal] text-text">{token.symbol}</span>
                  <span className="text-sm font-normal text-subText">{token.name}</span>
                  <HStack className="items-center gap-[5px] text-text">
                    <span className="text-[10px] sm:text-xs">
                      <Trans>Address</Trans>: {shortenAddress(token.chainId, token.address, 7)}
                    </span>
                    <CopyHelper toCopy={token.address} className="text-subText" />
                    <ExternalLinkIcon
                      className="text-subText"
                      size={16}
                      href={getEtherscanLink(token.chainId, token.address, 'address')}
                    />
                  </HStack>
                </Stack>
              </HStack>
            </Card>
          )
        })}

        <ButtonPrimary
          borderRadius="20px"
          padding="10px 1rem"
          onClick={onClickImport}
          data-testid="button-confirm-import-token"
        >
          <Trans>I understand</Trans>
        </ButtonPrimary>
      </Stack>
    </div>
  )
}
