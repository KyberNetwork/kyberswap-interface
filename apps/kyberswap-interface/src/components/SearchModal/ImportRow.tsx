import { Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { CSSProperties } from 'react'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { AutoRow } from 'components/Row'
import { cn } from 'utils/cn'

type ImportRowProps = {
  token: Token
  style?: CSSProperties
  dim?: boolean
  setImportToken: (token: Token) => void
}

const ImportRow = ({ token, style, dim, setImportToken }: ImportRowProps) => {
  return (
    <div
      style={style}
      className={cn(
        'grid h-14 items-center gap-2 rounded-lg px-5 py-1 hover:bg-primary-15 active:bg-primary-20',
        '[grid-template-columns:auto_minmax(auto,1fr)_auto]',
      )}
    >
      <CurrencyLogo currency={token} size={'24px'} style={dim ? { opacity: 0.6 } : undefined} />
      <AutoColumn className={cn('gap-1', dim && 'opacity-60')}>
        <AutoRow>
          <p className="m-0 text-base font-medium leading-[normal] text-text">{token.symbol}</p>
          <div className="m-0 ml-2 text-subText">
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
        className={cn(dim && 'opacity-60')}
        onClick={() => setImportToken(token)}
      >
        <Trans>Import</Trans>
      </ButtonPrimary>
    </div>
  )
}

export default ImportRow
