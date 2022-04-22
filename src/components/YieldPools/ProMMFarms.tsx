import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  HeadingContainer,
  StakedOnlyToggle,
  StakedOnlyToggleWrapper,
  StakedOnlyToggleText,
  HeadingRight,
  SearchInput,
  SearchContainer,
  ProMMFarmTableHeader,
  ClickableText,
} from './styleds'
import { Trans, t } from '@lingui/macro'
import { Search } from 'react-feather'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useBlockNumber } from 'state/application/hooks'
import { useHistory, useLocation } from 'react-router-dom'
import { stringify } from 'querystring'
import useTheme from 'hooks/useTheme'
import { useMedia } from 'react-use'
import InfoHelper from 'components/InfoHelper'
import { AMP_HINT } from 'constants/index'
import { Flex, Text } from 'rebass'
import { useProMMFarms, useGetProMMFarms } from 'state/farms/promm/hooks'
import LocalLoader from 'components/LocalLoader'
import { useActiveWeb3React } from 'hooks'
import { ButtonPrimary, ButtonLight } from 'components/Button'
import Deposit from 'components/Icons/Deposit'
import Withdraw from 'components/Icons/Withdraw'
import Harvest from 'components/Icons/Harvest'
import Divider from 'components/Divider'
import ProMMFarmGroup from './ProMMFarmGroup'
import { DepositModal, StakeModal } from './ProMMFarmModals'

type ModalType = 'deposit' | 'withdraw' | 'stake' | 'unstake'

function ProMMFarms({ active }: { active: boolean }) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [stakedOnly, setStakedOnly] = useState({
    active: false,
    ended: false,
  })
  const activeTab = active ? 'active' : 'ended'
  const { data: farms, loading } = useProMMFarms()
  const getProMMFarms = useGetProMMFarms()

  useEffect(() => {
    getProMMFarms()
  }, [getProMMFarms])

  const blockNumber = useBlockNumber()
  const currentTimestamp = Math.floor(Date.now() / 1000)

  const ref = useRef<HTMLDivElement>()
  const [open, setOpen] = useState(false)
  useOnClickOutside(ref, open ? () => setOpen(prev => !prev) : undefined)
  const qs = useParsedQueryString()
  const search = (qs.search as string) || ''
  const history = useHistory()
  const location = useLocation()

  const above1000 = useMedia('(min-width: 1000px)')

  const handleSearch = useCallback(
    (search: string) => {
      const target = {
        ...location,
        search: stringify({ ...qs, search }),
      }

      history.replace(target)
    },
    [history, location, qs],
  )

  const noFarms = !Object.keys(farms).length

  const [selectedFarm, setSeletedFarm] = useState<null | string>(null)
  const [seletedModal, setSeletedModal] = useState<ModalType | null>(null)
  const [selectedPoolId, setSeletedPoolId] = useState<number | null>(null)

  console.log(seletedModal, selectedPoolId)
  return (
    <>
      {selectedFarm && seletedModal === 'deposit' && (
        <DepositModal
          selectedFarmAddress={selectedFarm}
          onDismiss={() => {
            setSeletedFarm(null)
            setSeletedModal(null)
            setSeletedPoolId(null)
          }}
        />
      )}

      {selectedFarm && selectedPoolId !== null && seletedModal === 'stake' && (
        <StakeModal
          poolId={selectedPoolId}
          selectedFarmAddress={selectedFarm}
          onDismiss={() => {
            setSeletedFarm(null)
            setSeletedModal(null)
            setSeletedPoolId(null)
          }}
        />
      )}

      <HeadingContainer>
        <StakedOnlyToggleWrapper>
          <StakedOnlyToggle
            className="staked-only-switch"
            checked={stakedOnly[active ? 'active' : 'ended']}
            onClick={() => setStakedOnly(prev => ({ ...prev, [activeTab]: !prev[activeTab] }))}
          />
          <StakedOnlyToggleText>
            <Trans>Staked Only</Trans>
          </StakedOnlyToggleText>
        </StakedOnlyToggleWrapper>
        <HeadingRight>
          <SearchContainer>
            <SearchInput
              placeholder={t`Search by token name or pool address`}
              maxLength={255}
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            <Search color={theme.subText} />
          </SearchContainer>
        </HeadingRight>
      </HeadingContainer>

      {above1000 && (
        <ProMMFarmTableHeader>
          <Flex grid-area="token_pairs" alignItems="center" justifyContent="flex-start">
            <ClickableText>
              <Trans>Token Pair</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="pool_fee" alignItems="center" justifyContent="flex-start">
            <ClickableText>
              <Trans>Pool | Fee</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="liq" alignItems="center" justifyContent="flex-center">
            <ClickableText>
              <Trans>Staked TVL</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="end" alignItems="center" justifyContent="flex-start">
            <ClickableText>
              <Trans>Ending In</Trans>
            </ClickableText>
            <InfoHelper text={t`Once a farm has ended, you will continue to receive returns through LP Fees`} />
          </Flex>

          <Flex grid-area="apy" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>APR</Trans>
            </ClickableText>
            <InfoHelper
              text={
                active
                  ? t`Total estimated return based on yearly fees and bonus rewards of the pool`
                  : t`Estimated return based on yearly fees of the pool`
              }
            />
          </Flex>

          <Flex grid-area="vesting_duration" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>Vesting</Trans>
            </ClickableText>
            <InfoHelper text={t`After harvesting, your rewards will unlock linearly over the indicated time period`} />
          </Flex>

          <Flex grid-area="staked_balance" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Deposit</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="reward" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Rewards</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="action" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>Actions</Trans>
            </ClickableText>
          </Flex>
        </ProMMFarmTableHeader>
      )}

      {loading && noFarms ? (
        <Flex backgroundColor={theme.background}>
          <LocalLoader />
        </Flex>
      ) : noFarms ? (
        <Flex
          backgroundColor={theme.background}
          justifyContent="center"
          padding="32px"
          style={{ borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}
        >
          <Text color={theme.subText}>
            {stakedOnly[activeTab] || search ? (
              <Trans>No Farms found</Trans>
            ) : (
              <Trans>Currently there are no Farms.</Trans>
            )}
          </Text>
        </Flex>
      ) : (
        Object.keys(farms).map(fairLaunchAddress => {
          return (
            <ProMMFarmGroup
              key={fairLaunchAddress}
              address={fairLaunchAddress}
              onOpenModal={(modalType: ModalType, pid?: number) => {
                setSeletedModal(modalType)
                setSeletedFarm(fairLaunchAddress)
                setSeletedPoolId(pid ?? null)
              }}
            />
          )
        })
      )}
    </>
  )
}

export default ProMMFarms
