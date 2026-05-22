import { Trans, t } from '@lingui/macro'
import { useMemo, useRef } from 'react'
import { isMobile } from 'react-device-detect'
import { Download } from 'react-feather'
import { QRCode, IProps as QRCodeProps } from 'react-qrcode-logo'

import KncLogo from 'assets/images/kyber_logo_for_qr.png'
import { AddressInput } from 'components/AddressInputPanel'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { shortenAddress } from 'utils'

const QR_SIZE = 200
const QR_ID = 'react-qrcode-logo'

export default function ReceiveToken() {
  const { account = '', chainId } = useActiveWeb3React()
  const copyButtonRef = useRef<HTMLDivElement>(null)

  const qrCodeProps: QRCodeProps | undefined = useMemo(() => {
    if (!account) {
      return undefined
    }

    return {
      logoImage: KncLogo,
      logoWidth: 32,
      logoHeight: 32,
      size: QR_SIZE,
      value: `ethereum:${account}`,
      eyeColor: { outer: '#000000', inner: '#000000' },
      quietZone: 14,
      removeQrCodeBehindLogo: true,
    }
  }, [account])

  const onCopy = async () => {
    copyButtonRef.current?.click()
  }

  const downloadQR = () => {
    try {
      const canvas = document.getElementById(QR_ID) as HTMLCanvasElement
      if (!canvas) return
      const link = document.createElement('a')
      link.download = 'your_qrcode-logo.png'

      link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')
      link.click()
    } catch (error) {
      console.error(error)
    }
  }

  const theme = useTheme()

  let qrElement = null
  let error = true
  try {
    error = false
    qrElement = qrCodeProps ? <QRCode {...qrCodeProps} /> : <div className="h-[228px] w-[228px]" />
  } catch (e) {
    qrElement = (
      <div className="flex h-[228px] w-[228px] items-center justify-center rounded-2xl border-2 border-solid border-border text-center text-sm text-subText">
        <Trans>
          Something went wrong,
          <br />
          please try again
        </Trans>
      </div>
    )
  }

  return (
    <div
      className={
        'flex flex-1 basis-full flex-col justify-between gap-3.5 overflow-y-scroll ' +
        `[&_#${QR_ID}]:rounded-2xl ` +
        '[&::-webkit-scrollbar-thumb]:bg-disableText [&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-1'
      }
    >
      <div className="flex flex-1 flex-col justify-center gap-8">
        <Column style={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          {qrElement}

          {!error && !isMobile && (
            <div onClick={downloadQR} className="flex cursor-pointer items-center gap-[5px] text-sm text-primary">
              <span>
                <Trans>Download Image</Trans>
              </span>
              <Download size={14} />
            </div>
          )}
        </Column>

        <Column gap="12px">
          <label className="text-xs font-medium leading-4 text-subText">
            <Trans>Your Wallet Address</Trans>
          </label>

          <MouseoverTooltip placement="bottom" text={t`Copy address to clipboard`} width="fit-content">
            <div onClick={onCopy} role="button" className="flex w-full cursor-pointer flex-col">
              <AddressInput
                style={{ color: theme.subText, cursor: 'pointer' }}
                disabled
                value={shortenAddress(chainId, account, 17, false)}
                icon={<CopyHelper ref={copyButtonRef} toCopy={account} style={{ color: theme.subText }} />}
              />
            </div>
          </MouseoverTooltip>
        </Column>
      </div>
    </div>
  )
}
