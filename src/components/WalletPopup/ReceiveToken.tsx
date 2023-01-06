import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Check, Download } from 'react-feather'
import { QRCode } from 'react-qrcode-logo'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import KncLogo from 'assets/images/kyber_logo_black.png'
import { AddressInput } from 'components/AddressInputPanel'
import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import { useActiveWeb3React } from 'hooks'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'

const Label = styled.label<{ color?: string }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme, color }) => color ?? theme.subText};
`
const Wrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
`

const QR_SIZE = 200

export default function SendToken() {
  const { account = '', isEVM } = useActiveWeb3React()
  const [qrConfig, setQrConfig] = useState<{ [key: string]: any } | null>(null)

  useEffect(() => {
    if (!account) return
    setQrConfig({ logoImage: KncLogo, size: QR_SIZE, value: isEVM ? `ethereum:${account}` : account })
  }, [account, isEVM])

  const [isCopied, setCopied] = useState(false)
  const [, copyToClipboard] = useCopyClipboard()

  const onCopy = async () => {
    copyToClipboard(account)
    setCopied(true)
  }

  const downLoadQR = () => {
    try {
      const canvas = document.getElementById('react-qrcode-logo') as HTMLCanvasElement
      if (!canvas) return
      const link = document.createElement('a')
      link.download = 'your_qrcode-logo.png'

      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {}
  }

  const theme = useTheme()

  let qrElement = null
  try {
    qrElement = !qrConfig ? (
      <div style={{ height: QR_SIZE + 20 }} />
    ) : (
      <QRCode
        {...{
          ...qrConfig,
          eyeRadius: [
            {
              outer: [
                qrConfig.eyeradius_0_outer_0,
                qrConfig.eyeradius_0_outer_1,
                qrConfig.eyeradius_0_outer_2,
                qrConfig.eyeradius_0_outer_3,
              ],
              inner: [
                qrConfig.eyeradius_0_inner_0,
                qrConfig.eyeradius_0_inner_1,
                qrConfig.eyeradius_0_inner_2,
                qrConfig.eyeradius_0_inner_3,
              ],
            },
            {
              outer: [
                qrConfig.eyeradius_1_outer_0,
                qrConfig.eyeradius_1_outer_1,
                qrConfig.eyeradius_1_outer_2,
                qrConfig.eyeradius_1_outer_3,
              ],
              inner: [
                qrConfig.eyeradius_1_inner_0,
                qrConfig.eyeradius_1_inner_1,
                qrConfig.eyeradius_1_inner_2,
                qrConfig.eyeradius_1_inner_3,
              ],
            },
            {
              outer: [
                qrConfig.eyeradius_2_outer_0,
                qrConfig.eyeradius_2_outer_1,
                qrConfig.eyeradius_2_outer_2,
                qrConfig.eyeradius_2_outer_3,
              ],
              inner: [
                qrConfig.eyeradius_2_inner_0,
                qrConfig.eyeradius_2_inner_1,
                qrConfig.eyeradius_2_inner_2,
                qrConfig.eyeradius_2_inner_3,
              ],
            },
          ],
          eyeColor: [
            {
              outer: qrConfig.eyecolor_0_outer ?? qrConfig.fgColor ?? '#000000',
              inner: qrConfig.eyecolor_0_inner ?? qrConfig.fgColor ?? '#000000',
            },
            {
              outer: qrConfig.eyecolor_1_outer ?? qrConfig.fgColor ?? '#000000',
              inner: qrConfig.eyecolor_1_inner ?? qrConfig.fgColor ?? '#000000',
            },
            {
              outer: qrConfig.eyecolor_2_outer ?? qrConfig.fgColor ?? '#000000',
              inner: qrConfig.eyecolor_2_inner ?? qrConfig.fgColor ?? '#000000',
            },
          ],
        }}
      />
    )
  } catch (error) {}
  return (
    <Wrapper>
      <Flex flexDirection={'column'} style={{ gap: 32, flex: 1, justifyContent: 'center' }}>
        <Column
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {qrElement}

          <Flex
            onClick={downLoadQR}
            color={theme.primary}
            fontSize="14px"
            alignItems={'center'}
            style={{ gap: 5, cursor: 'pointer' }}
          >
            <Text>
              <Trans>Download Image</Trans>
            </Text>
            <Download size={14} />
          </Flex>
        </Column>

        <Column gap="12px">
          <Label>
            <Trans>Your Wallet Address</Trans>
          </Label>

          <AddressInput
            style={{ color: theme.subText }}
            disabled
            value={account}
            icon={<CopyHelper toCopy={account} style={{ color: theme.subText }} />}
          />
        </Column>
      </Flex>
      <ButtonPrimary height="44px" onClick={onCopy}>
        {isCopied ? (
          <Trans>
            <Trans>Copied Address</Trans>&nbsp;
            <Check size={16} />
          </Trans>
        ) : (
          <Trans>Copy Address</Trans>
        )}
      </ButtonPrimary>
    </Wrapper>
  )
}
