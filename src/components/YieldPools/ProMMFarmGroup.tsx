import React from 'react'
import { Text, Flex } from 'rebass'
import useTheme from 'hooks/useTheme'
import { Trans, t } from '@lingui/macro'
import { useActiveWeb3React } from 'hooks'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import Deposit from 'components/Icons/Deposit'
import Withdraw from 'components/Icons/Withdraw'
import Harvest from 'components/Icons/Harvest'
import Divider from 'components/Divider'
import styled from 'styled-components'
import { useProMMFarms } from 'state/farms/promm/hooks'
import { ProMMFarmTableRow } from './styleds'
import { Token, ChainId } from '@vutien/sdk-core'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { shortenAddress } from 'utils'
import CopyHelper from 'components/Copy'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { useWalletModalToggle } from 'state/application/hooks'

const FarmRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${({ theme }) => theme.bg2};
  padding: 1rem;
`

const BtnLight = styled(ButtonLight)`
  padding: 10px 12px;
  height: 36px;
  width: fit-content;
`

function ProMMFarmGroup({ address }: { address: string }) {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const { data } = useProMMFarms()
  const farms = data[address]
  const toggleWalletModal = useWalletModalToggle()
  if (!farms) return null
  const currentTimestamp = Math.floor(Date.now() / 1000)

  return (
    <>
      <FarmRow>
        <Flex sx={{ gap: '20px' }} alignItems="center">
          <Flex flexDirection="column" sx={{ gap: '8px' }}>
            <Text fontSize="12px" color={theme.subText}>
              <Trans>Deposited Liquidity</Trans>
            </Text>
            <Flex>$123.456 </Flex>
          </Flex>

          {!!account ? (
            <Flex sx={{ gap: '12px' }} alignItems="center">
              <BtnLight>
                <Deposit />
                <Text fontSize="14px" marginLeft="4px">
                  <Trans>Deposit</Trans>
                </Text>
              </BtnLight>

              <BtnLight style={{ background: theme.subText + '33', color: theme.subText }}>
                <Withdraw />
                <Text fontSize="14px" marginLeft="4px">
                  <Trans>Withdraw</Trans>
                </Text>
              </BtnLight>
            </Flex>
          ) : (
            <BtnLight onClick={toggleWalletModal}>
              <Trans>Connect Wallet</Trans>
            </BtnLight>
          )}
        </Flex>
        <Flex alignItems="center" sx={{ gap: '24px' }}>
          <Flex flexDirection="column" sx={{ gap: '8px' }}>
            <Text fontSize="12px" color={theme.subText}>
              <Trans>Deposited Liquidity</Trans>
            </Text>
            <Flex>$123.456 </Flex>
          </Flex>

          <ButtonPrimary style={{ height: '36px', fontSize: '14px' }} padding="10px 12px" width="fit-content">
            <Harvest />
            <Text marginLeft="4px">
              <Trans>Harvest All</Trans>
            </Text>
          </ButtonPrimary>
        </Flex>
      </FarmRow>
      <Divider />
      {farms.map(farm => {
        const token0 = new Token(
          chainId as ChainId,
          farm.poolInfo.token0.address,
          farm.poolInfo.token0.decimals,
          farm.poolInfo.token0.symbol,
          farm.poolInfo.token0.name,
        )
        const token1 = new Token(
          chainId as ChainId,
          farm.poolInfo.token1.address,
          farm.poolInfo.token1.decimals,
          farm.poolInfo.token1.symbol,
          farm.poolInfo.token1.name,
        )

        return (
          <React.Fragment key={farm.pAddress}>
            <ProMMFarmTableRow>
              <div>
                <DoubleCurrencyLogo currency0={token0} currency1={token1} />
                <Text marginTop="0.5rem" fontSize={14}>
                  {token0.symbol} - {token1.symbol}
                </Text>
              </div>

              <div>
                <Flex alignItems="center">
                  <Text fontSize={14}>{shortenAddress(farm.pAddress)}</Text>
                  <CopyHelper toCopy={farm.pAddress} />
                </Flex>
                <Text marginTop="0.5rem" color={theme.subText}>
                  Fee = {farm.poolInfo.feeTier / 100}%
                </Text>
              </div>

              <Text>TODO: TVL</Text>
              <Text>
                {farm.endTime > currentTimestamp
                  ? getFormattedTimeFromSecond(farm.endTime - currentTimestamp)
                  : t`ENDED`}
              </Text>
              {/* TODO: calculate farm apr */}
              <Text textAlign="end" color={theme.apr}>
                {farm.poolInfo.apr.toFixed(2)}%
              </Text>

              <Text textAlign="end">{getFormattedTimeFromSecond(farm.vestingDuration, true)}</Text>
            </ProMMFarmTableRow>
            <Divider />
          </React.Fragment>
        )
      })}
    </>
  )
}

export default ProMMFarmGroup
