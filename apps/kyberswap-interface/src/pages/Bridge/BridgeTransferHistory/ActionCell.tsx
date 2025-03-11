import { rgba } from 'polished'
import { useState } from 'react'
import { ExternalLink } from 'react-feather'
import { Flex } from 'rebass'
import { useLazyGetBridgeTransactionDetailQuery } from 'services/crossChain'
import styled, { css } from 'styled-components'

import Loader from 'components/Loader'
import useTheme from 'hooks/useTheme'

const ExternalLinkWrapper = styled.div<{ disabled: boolean }>`
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  border-radius: 999px;
  color: ${({ theme }) => theme.subText};
  transition: color 150ms;

  &:hover,
  &:active,
  &:focus {
    color: ${({ theme }) => theme.text};
  }

  ${({ disabled }) =>
    disabled &&
    css`
      pointer-events: none;
    `}
`

type Props = {
  hash: string | undefined
}

const ActionCell: React.FC<Props> = ({ hash }) => {
  const theme = useTheme()
  const [getTxsDetail] = useLazyGetBridgeTransactionDetailQuery()

  const getScanUrl = async (hash: string) => {
    const newScanUrl = `https://scan.multichain.org/#/tx?params=${hash}`
    const oldScanUrl = `https://anyswap.net/explorer/tx?params=${hash}`
    try {
      const { data } = await getTxsDetail(hash) // get txs detail via NEW api from Multichain
      return data?.error ? oldScanUrl : newScanUrl
    } catch (error) {
      return newScanUrl
    }
  }

  const [loading, setLoading] = useState(false)
  const onClick = async () => {
    if (loading || !hash) return
    setLoading(true)
    const url = await getScanUrl(hash)
    window.open(url)
    setLoading(false)
  }

  return (
    <WrapperActionCell>
      <ExternalLinkWrapper onClick={onClick} disabled={!hash}>
        {loading ? <Loader size={'16px'} /> : <ExternalLink color={theme.text} size={16} />}
      </ExternalLinkWrapper>
    </WrapperActionCell>
  )
}

const WrapperActionCell = styled(Flex)`
  width: fit-content;
  align-items: center;
`

export default ActionCell
