import { Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { CSSProperties } from 'react'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { AutoRow } from 'components/Row'
import { cn } from 'utils/cn'

export default function ImportRow({
  token,
  style,
  dim,
  setImportToken,
}: {
  token: Token
  style?: CSSProperties
  dim?: boolean
  setImportToken: (token: Token) => void
}) {
  return (
    <div
      style={style}
      className={cn(
        'grid h-14 items-center gap-4 px-5 py-1',
        '[grid-template-columns:auto_minmax(auto,1fr)_auto]',
        dim && 'opacity-40',
      )}
    >
      <CurrencyLogo currency={token} size={'24px'} style={{ opacity: dim ? '0.6' : '1' }} />
      <AutoColumn className={cn('gap-1', dim ? 'opacity-60' : 'opacity-100')}>
        <AutoRow>
          <p className="m-0 text-base font-medium leading-[normal] text-text">{token.symbol}</p>
          <div className="m-0 ml-2 font-light text-text3">
            <div className="max-w-[140px] truncate text-xs" title={token.name}>
              {token.name}
            </div>
          </div>
        </AutoRow>
      </AutoColumn>
      <ButtonPrimary
        data-testid="button-import-token"
        width="fit-content"
        padding="6px 12px"
        fontWeight={500}
        fontSize="14px"
        onClick={() => setImportToken(token)}
      >
        <Trans>Import</Trans>
      </ButtonPrimary>
    </div>
  )
}
