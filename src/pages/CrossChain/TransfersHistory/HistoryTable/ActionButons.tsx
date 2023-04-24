import { rgba } from 'polished'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { DropdownArrowIcon } from 'components/ArrowRotate'
import { MultichainTransfer } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'
import { getAxelarScanUrl } from 'pages/CrossChain'
import { ExternalLinkIcon } from 'theme'

const IconWrap = styled.div`
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  cursor: pointer;
  border-radius: 24px;
  padding: 7px 8px 5px 8px;
  margin-left: 5px;
  height: 30px;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
`

export default function ActionButtons({
  transfer,
  expand,
  setExpand,
}: {
  transfer: MultichainTransfer
  setExpand: (v: boolean) => void
  expand: boolean
}) {
  const theme = useTheme()
  return (
    <Flex>
      <IconWrap>
        <ExternalLinkIcon href={getAxelarScanUrl(transfer.srcTxHash)} color={theme.subText} />
      </IconWrap>
      <IconWrap onClick={() => setExpand(!expand)}>
        <DropdownArrowIcon rotate={!!expand} color={theme.subText} />
      </IconWrap>
    </Flex>
  )
}
