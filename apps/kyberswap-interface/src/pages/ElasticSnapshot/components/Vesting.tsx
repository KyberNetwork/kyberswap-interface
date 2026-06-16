import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { readContract } from '@wagmi/core'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMedia } from 'react-use'

import { ButtonPrimary } from 'components/Button'
import { wagmiConfig } from 'components/Web3Provider'
import { useActiveWeb3React } from 'hooks'
import VestingClaimModal from 'pages/ElasticSnapshot/components/VestingClaimModal'
import abi from 'pages/ElasticSnapshot/data/abis/vestingAbi.json'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { Address } from 'utils/viem'

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })

const VestingItem = ({ claimBox, children }: { claimBox?: boolean; children: React.ReactNode }) => (
  <div className={cn('rounded-xl px-4 py-3 font-medium', claimBox ? 'bg-primary-20' : 'bg-buttonBlack')}>
    {children}
  </div>
)

export interface VestingInterface {
  claimData: { receiver: string; vestingAmount: number; index: number }
  proof: string[]
}

const disableWallets = [
  '0xd1bbca0dfde1f51ccd17e33de1a7ead48faa1d68',
  '0x194eda5c8302bc8550e3e918b36520d138fba8ae',
  '0x12a2455cca45d8f6d9149f0e996260ae49eda8b4',
]

export default function Vesting({
  userSelectedOption,
  userVestingData,
  contractAddress,
  tcLink,
}: {
  userSelectedOption: 'A' | 'B'
  userVestingData: VestingInterface
  contractAddress: string
  tcLink: string
}) {
  const { account } = useActiveWeb3React()

  const proof = useMemo(() => userVestingData?.proof, [userVestingData])

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [vestedAmount, setVestedAmount] = useState(0)

  const [, setRender] = useState(0)
  const getVestedData = useCallback(() => {
    if (contractAddress && userVestingData) {
      readContract(wagmiConfig, {
        address: contractAddress as Address,
        abi: abi,
        functionName: 'claimed',
        args: [BigInt(userVestingData.claimData.index)],
        chainId: ChainId.MATIC,
      }).then(res => {
        setVestedAmount(Number((res as bigint).toString()) / 10 ** 6)
        setRender(prev => prev + 1)
      })
    }
  }, [contractAddress, userVestingData])

  useEffect(() => {
    const i = setInterval(() => {
      getVestedData()
    }, 10_000)
    return () => {
      clearInterval(i)
    }
  }, [getVestedData])

  useEffect(() => {
    if (contractAddress && userVestingData) {
      Promise.all([
        readContract(wagmiConfig, {
          address: contractAddress as Address,
          abi: abi,
          functionName: 'claimed',
          args: [BigInt(userVestingData.claimData.index)],
          chainId: ChainId.MATIC,
        }),
        readContract(wagmiConfig, {
          address: contractAddress as Address,
          abi: abi,
          functionName: 'vestingStartTime',
          chainId: ChainId.MATIC,
        }),
        readContract(wagmiConfig, {
          address: contractAddress as Address,
          abi: abi,
          functionName: 'vestingEndTime',
          chainId: ChainId.MATIC,
        }),
      ]).then(([vested, start, end]) => {
        setVestedAmount(Number((vested as bigint).toString()) / 10 ** 6)
        setStartTime(Number(start))
        setEndTime(Number(end))
      })
    }
  }, [contractAddress, userVestingData])

  const [show, setShow] = useState(false)

  if (!userVestingData) return null

  const totalAmount = userVestingData.claimData.vestingAmount / 10 ** 6

  const now = Math.floor(Date.now() / 1000)
  const unlockedAmount = now < endTime ? (totalAmount * (now - startTime)) / (endTime - startTime) : totalAmount
  const claimableAmount = unlockedAmount - vestedAmount

  const claimedPercent = (vestedAmount * 100) / totalAmount
  const unlockedPercent = (unlockedAmount * 100) / totalAmount

  const claimablePercent = unlockedPercent - claimedPercent

  const isRemoved = disableWallets.includes(account?.toLowerCase() || '')

  return (
    <>
      {show && proof && (
        <VestingClaimModal
          onDismiss={() => setShow(false)}
          leafIndex={userVestingData.claimData.index}
          proof={proof}
          tokenAmount={claimableAmount}
          vestingAmount={userVestingData.claimData.vestingAmount}
          contractAddress={contractAddress}
          tcLink={tcLink}
        />
      )}
      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-background px-6 py-4 text-sm">
          <div className="text-subText">
            <Trans>Wallet Address: </Trans>{' '}
            <span className="font-medium text-text">{upToSmall && account ? shortenAddress(1, account) : account}</span>
            {isRemoved && <div className="mt-2 text-subText">This wallet has been removed from Treasury Grant</div>}
          </div>
        </div>

        <div className="px-6 py-4 text-sm" style={{ background: 'rgba(41, 41, 41, 0.4)' }}>
          <div>
            <Trans>
              Grant Plan: USD stablecoins equivalent of {userSelectedOption === 'A' ? '60%' : '100%'} of Reference Value
              of Affected Assets associated with such Affected Address, vested over{' '}
              {userSelectedOption === 'A' ? '3' : '12'} months.
            </Trans>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 max-md:grid-cols-1">
            <VestingItem>
              <div className="text-subText">
                <Trans>Total Amount (USDC)</Trans>
              </div>
              <div className="mt-4 text-xl">{format(totalAmount)}</div>
            </VestingItem>

            <VestingItem>
              <div className="text-subText">
                <Trans>Total Vested Amount (USDC)</Trans>
              </div>
              <div className="mt-4 text-xl">{format(vestedAmount)}</div>
            </VestingItem>

            <VestingItem claimBox>
              <div className="text-subText">
                <Trans>Unlocked Amount (USDC)</Trans>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl">{format(claimableAmount)}</span>
                <ButtonPrimary
                  width="64px"
                  height="24px"
                  disabled={claimableAmount === 0 || isRemoved}
                  onClick={() => setShow(true)}
                >
                  Claim
                </ButtonPrimary>
              </div>
            </VestingItem>
          </div>
          <div className="mt-6 flex items-end justify-end">
            {now > endTime ? (
              <span>Fully Unlocked</span>
            ) : (
              <>
                <span className="text-subText">Full Unlock</span>
                <span className="ml-1">
                  {dayjs(endTime * 1000).format('DD MMM YYYY')} ({dayjs(endTime * 1000).fromNow()})
                </span>
              </>
            )}
          </div>
          <div className="relative mt-2 h-3 w-full rounded-full bg-buttonGray">
            <div
              className="absolute left-0 top-0 h-3 rounded-full"
              style={{ background: '#d1faee', width: `${unlockedPercent}%` }}
            />
            <div className="absolute left-0 top-0 h-3 rounded-full bg-green" style={{ width: `${claimedPercent}%` }} />
          </div>

          <div className="mb-16 mt-8 grid grid-cols-3 gap-6 max-sm:grid-cols-2">
            <div className="flex items-center">
              <div className="mr-2 size-4 bg-green" />
              {claimedPercent.toFixed(0)}% Claimed
            </div>
            <div className="flex items-center">
              <div className="mr-2 size-4" style={{ backgroundColor: '#d1faee' }} />
              {claimablePercent.toFixed(0)}% Unlocked
            </div>
            <div className="flex items-center">
              <div className="mr-2 size-4 bg-buttonGray" />
              {(100 - unlockedPercent).toFixed(0)}% Locked
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
