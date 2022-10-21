import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { Edit3, Trash } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Checkbox from 'components/CheckBox'
import CurrencyLogo from 'components/CurrencyLogo'
import ProgressBar from 'components/ProgressBar'
import { nativeOnChain } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

const IconWrap = styled.div<{ color: string }>`
  background-color: ${({ color }) => `${rgba(color, 0.2)}`};
  border-radius: 24px;
  padding: 6px 8px 6px 8px;
  height: fit-content;
  margin-left: 5px;
`

export const ItemWrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 12px;
  padding: 10px;
  grid-template-columns: 1.5fr 1fr 1.5fr 2fr 80px;
  display: grid;
  gap: 10px;
  align-items: center;
`

const ItemWrapperMobile = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  padding: 20px 0px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`
const DeltaAmount = styled.div<{ color: string }>`
  font-weight: 500;
  color: ${({ color }) => color};
  margin-left: 8px;
`
const Colum = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px 12px;
  justify-content: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
      gap: 5px 12px;
  `}
`

const Time = () => {
  const theme = useTheme()
  return (
    <Flex fontWeight={'500'}>
      <Text color={theme.subText}>{dayjs(Date.now()).format('DD/MM/YYYY')}</Text>
      &nbsp; <Text color={theme.border}>{dayjs(Date.now()).format('hh:mm')}</Text>
    </Flex>
  )
}

const Actions = () => {
  const theme = useTheme()
  return (
    <Flex alignItems={'center'}>
      <IconWrap color={theme.primary}>
        <Edit3 color={theme.primary} size={15} />
      </IconWrap>
      <IconWrap color={theme.red}>
        <Trash color={theme.red} size={15} />
      </IconWrap>
    </Flex>
  )
}
const AmountInfo = () => {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  return (
    <Colum>
      <Flex>
        {chainId && <CurrencyLogo size={'16px'} currency={nativeOnChain(chainId)} />}{' '}
        <DeltaAmount color={theme.primary}>+ 0.25 ETH</DeltaAmount>
      </Flex>
      <Flex>
        {chainId && <CurrencyLogo size={'16px'} currency={nativeOnChain(chainId)} />}{' '}
        <DeltaAmount color={theme.border}>- 0.25 ETH</DeltaAmount>
      </Flex>
    </Colum>
  )
}
export default function OrderItem() {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  if (upToSmall)
    return (
      <ItemWrapperMobile>
        <Flex justifyContent={'space-between'}>
          <AmountInfo />
          <Actions />
        </Flex>
        <Flex justifyContent={'space-between'}>
          <ProgressBar height="11px" percent={66} title={`Partially Filled: 25%`} />
          <Time />
        </Flex>
        <Flex justifyContent={'space-between'}>
          <Colum>
            <Text>
              <Trans>Created</Trans>
            </Text>
            <Time />
          </Colum>
          <Colum>
            <Text textAlign={'right'}>
              <Trans>Expiry</Trans>
            </Text>
            <Time />
          </Colum>
        </Flex>
      </ItemWrapperMobile>
    )
  return (
    <ItemWrapper>
      <Flex style={{ gap: 10 }}>
        <Checkbox type="checkbox" />
        <AmountInfo />
      </Flex>
      <Colum>
        <Time />
        <Time />
      </Colum>
      <Colum>
        <Time />
        <Time />
      </Colum>
      <Colum>
        <ProgressBar height="11px" percent={66} title={`Partially Filled: 25%`} />
      </Colum>
      <Actions />
    </ItemWrapper>
  )
}
