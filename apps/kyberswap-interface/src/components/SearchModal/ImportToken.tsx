import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect } from 'react'
import { AlertTriangle, ArrowLeft } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { useAddUserToken } from 'state/user/hooks'
import { CloseIcon, TYPE } from 'theme'
import { ExternalLinkIcon } from 'theme/components'
import { getEtherscanLink, shortenAddress } from 'utils'

import { PaddedColumn } from './styleds'

interface ImportProps {
  enterToImport?: boolean
  tokens: Token[]
  onBack?: () => void
  onDismiss?: () => void
  handleCurrencySelect?: (currency: Currency[]) => void
}

export function ImportToken({ enterToImport = false, tokens, onBack, onDismiss, handleCurrencySelect }: ImportProps) {
  const theme = useTheme()

  const addToken = useAddUserToken()

  const onClickImport = useCallback(() => {
    tokens.forEach(addToken)
    handleCurrencySelect?.(tokens)
  }, [tokens, addToken, handleCurrencySelect])

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter' && enterToImport) {
        e.preventDefault()
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
      <PaddedColumn gap="14px" style={{ width: '100%', flex: '1 1' }}>
        <RowBetween>
          {onBack ? <ArrowLeft style={{ cursor: 'pointer' }} onClick={onBack} /> : <div></div>}
          <TYPE.mediumHeader>{tokens.length > 1 ? t`Import Tokens` : t`Import Token`}</TYPE.mediumHeader>
          {onDismiss ? <CloseIcon onClick={onDismiss} /> : <div />}
        </RowBetween>
      </PaddedColumn>
      <div className="h-px w-full bg-bg3" />
      <div className="flex flex-col gap-4 p-4">
        <Card className="w-fit rounded-[20px] bg-warning-20 p-[15px]">
          <div className="flex items-start">
            <div>
              <AlertTriangle stroke={theme.warning} size="17px" />
            </div>
            <div className="ml-2 text-sm font-medium text-warning">
              <Trans>This token isn’t frequently swapped. Please do your own research before trading.</Trans>
            </div>
          </div>
        </Card>
        {tokens.map(token => {
          return (
            <Card className="bg-buttonBlack p-8" key={token.address}>
              <div className="flex gap-2.5">
                <CurrencyLogo currency={token} size={'44px'} />
                <AutoColumn gap="4px">
                  <TYPE.body fontWeight={500} fontSize={20}>
                    {token.symbol}
                  </TYPE.body>
                  <span className="text-sm font-normal text-subText">{token.name}</span>
                  <div className="flex items-center gap-[5px] text-text">
                    <div className="text-[10px] sm:text-xs">
                      <Trans>Address</Trans>: {shortenAddress(token.chainId, token.address, 7)}
                    </div>
                    <CopyHelper toCopy={token.address} style={{ color: theme.subText }} />
                    <ExternalLinkIcon
                      color={theme.subText}
                      size={16}
                      href={getEtherscanLink(token.chainId, token.address, 'address')}
                    />
                  </div>
                </AutoColumn>
              </div>
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
      </div>
    </div>
  )
}
