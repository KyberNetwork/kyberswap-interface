import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { X } from 'react-feather'
import { Image, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as ChevronDown } from 'assets/svg/down.svg'
import Kyber from 'components/Icons/Kyber'
import Row, { RowFit } from 'components/Row'
import { NETWORKS_INFO } from 'constants/networks'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'

import { NETWORK_TO_CHAINID, SUPPORTED_NETWORK_KYBERAI } from '../constants'

const NetworkSelectContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  position: relative;
  border-radius: 999px;
  background: ${({ theme }) => theme.background};
  min-width: 160px;
  cursor: pointer;

  :hover {
    z-index: 10;
    filter: brightness(1.2);
  }
`

const DropdownWrapper = styled(motion.div)`
  position: absolute;
  width: 100%;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.buttonGray};
  left: 0;
  top: calc(100% + 2px);
  padding: 4px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const DropdownItem = styled(Row)`
  height: 32px;
  padding: 4px 8px;
  gap: 8px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  :hover {
    filter: brightness(1.2);
    background-color: ${({ theme }) => theme.background};
  }
`

const NetworkSelect = ({ filter, setFilter }: { filter?: string; setFilter: (c?: string) => void }) => {
  console.log('🚀 ~ file: NetworkSelect.tsx:63 ~ NetworkSelect ~ filter:', filter)
  const theme = useTheme()

  const [isShowOptions, setIsShowOptions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(containerRef, () => setIsShowOptions(false))

  return (
    <NetworkSelectContainer
      onClick={() => {
        setIsShowOptions(prev => !prev)
      }}
      ref={containerRef}
    >
      <Row style={{ gap: '8px' }}>
        {filter ? (
          <Image
            minHeight={20}
            minWidth={20}
            height={20}
            width={20}
            src={NETWORKS_INFO[NETWORK_TO_CHAINID[filter]].icon}
          />
        ) : (
          <Kyber size={20} color={theme.subText} />
        )}
        <Text color={theme.subText} fontSize="14px" lineHeight="24px">
          {filter ? NETWORKS_INFO[NETWORK_TO_CHAINID[filter]].name : <Trans>All Chains</Trans>}
        </Text>
      </Row>
      <RowFit>
        {filter ? (
          <X
            size={16}
            color={theme.subText}
            onClick={e => {
              e.stopPropagation()
              setFilter()
            }}
          />
        ) : (
          <ChevronDown
            color={theme.border}
            style={{ transform: `rotate(${isShowOptions ? '180deg' : 0})`, transition: 'transform 0.2s' }}
          />
        )}
      </RowFit>
      <AnimatePresence>
        {isShowOptions && (
          <DropdownWrapper
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {Object.keys(SUPPORTED_NETWORK_KYBERAI).map((chainId, index) => (
              <DropdownItem
                key={chainId}
                onClick={() => {
                  setFilter(SUPPORTED_NETWORK_KYBERAI[+chainId as ChainId])
                }}
              >
                <Image
                  minHeight={16}
                  minWidth={16}
                  height={16}
                  width={16}
                  src={NETWORKS_INFO[+chainId as ChainId].icon}
                />
                <Text key={index} color={theme.subText} fontSize="12px">
                  {NETWORKS_INFO[+chainId as ChainId].name}
                </Text>
              </DropdownItem>
            ))}
          </DropdownWrapper>
        )}
      </AnimatePresence>
    </NetworkSelectContainer>
  )
}

export default NetworkSelect
