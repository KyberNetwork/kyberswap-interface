import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { Info } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'

import { ButtonPrimary } from 'components/Button'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { PoolsPageWrapper } from 'components/PageWrappers'
import Tabs from 'components/Tabs'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

import TreasuryGrantAndInstantClaim from './components/TreasuryGrantAndInstantClaim'
import Vesting, { VestingInterface } from './components/Vesting'
import poolsByCategoriesRaw from './data/category.json'
import data from './data/data.json'
import phase3 from './data/phase3.json'
import vestingOptionA from './data/vesting/optionA.json'
import vestingOptionAPhase2 from './data/vesting/optionA_phase2.json'
import vestingOptionB from './data/vesting/optionB.json'
import vestingOptionBPhase2 from './data/vesting/optionB_phase2.json'
import vestingPhase3 from './data/vesting/phase3.json'

const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 7 })

const Tag = ({ children }: { children: React.ReactNode }) => (
  <div className="flex size-[22px] items-center justify-center rounded-full bg-primary-30 text-xs font-medium text-primary">
    {children}
  </div>
)

const poolsByCategories: {
  [key: string]: {
    [key: string]: string[]
  }
} = {}

Object.keys(poolsByCategoriesRaw).forEach(key => {
  const dataByCat = poolsByCategoriesRaw[key]
  poolsByCategories[key] = {}

  Object.keys(dataByCat).forEach(network => {
    poolsByCategories[key][network] = (dataByCat[network as keyof typeof dataByCat] as any[]).map(
      (item: any) => item.pool,
    )
  })
})

interface Position {
  position_id: number
  liquidity_usd: number
  position_usd: number
  fee_usd: number
  info: {
    pool: string
    chain: string
    pair: string
    token0: string
    token1: string
  }
}

const vestingContractAddress = {
  A: '0x04F57dE350E76ec952b6B4d1283Ba800ab3c95e3',
  B: '0xF3E4C1f21a1218Ae8e48569c94275ABd605563fD',
}

const phase2AddressVestingContract = {
  A: '0xde919Fe1e7FccCb29d4B7cBd6E803d8d25DCD2d8',
  B: '0xbA04Fa014fF307a3E731b3898bC0633f9B559995',
}

const vestingPhase3ContractAddress = '0xBA06228A869b7B7833B18b3B43541f366b0B3E4e'

export default function ElasticSnapshot() {
  const { account } = useActiveWeb3React()

  const theme = useTheme()

  const userInfo = data.find(item => item.user_address.toLowerCase() === account?.toLowerCase())

  const vestingP3 = vestingPhase3.find(item => item.claimData.receiver.toLowerCase() === account?.toLowerCase())
  const vestingA = vestingOptionA.find(item => item.claimData.receiver.toLowerCase() === account?.toLowerCase())
  const vestingB = vestingOptionB.find(item => item.claimData.receiver.toLowerCase() === account?.toLowerCase())
  const phase3Info = phase3.find(
    item => item.receiver.toLowerCase() === account?.toLowerCase() || item.oldAddress === account?.toLowerCase(),
  )

  const vestingAPhase2 = vestingOptionAPhase2.find(
    item => item.claimData.receiver.toLowerCase() === account?.toLowerCase(),
  )
  const vestingBPhase2 = vestingOptionBPhase2.find(
    item => item.claimData.receiver.toLowerCase() === account?.toLowerCase(),
  )
  const userHaveVestingData = !!(vestingA || vestingB || vestingAPhase2 || vestingBPhase2 || phase3Info)

  const categories = ['category 1', 'category 2', 'category 3', 'category 4', 'category 5']

  const positionsByCategories: Array<Position[]> = []

  categories.forEach(cat => {
    const temp: Position[] = []
    userInfo?.positions.forEach((pos: Position) => {
      if (poolsByCategories[cat]?.[pos.info.chain]?.includes(pos.info.pool)) temp.push(pos)
    })

    positionsByCategories.push(temp)
  })
  const [selectedCategory, setSelectedCategory] = useState(0)

  const toggleWalletModal = useWalletModalToggle()

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const categoriesDesc = [
    <Trans key={0}>
      Affected Assets taken from Affected Pools by the primary KyberSwap Elastic Exploit (“Primary Exploit”) which
      commenced on November 22, 2023 at 10:54 PM UTC, which Affected Assets have yet to be recovered{' '}
    </Trans>,
    <Trans key={1}>
      Affected Assets taken from Affected Pools by subsequent activity (“Category 2 MBA”) of two mimicking bots
      mimicking the Primary Exploit, which Affected Assets have yet to be recovered
    </Trans>,
    <Trans key={2}>
      Affected Assets taken from Affected Pools by subsequent activity (“Category 3 MBA” which together with Category 2
      MBA collectively referred to as “MBA”) of two front-run bots mimicking the Primary Exploit – which Affected Assets
      have been partially recovered along with assets (“Category 3 Swapped Affected Assets”) into which part of such
      Affected Assets have been swapped into by such front-run bots.
    </Trans>,
    <Trans key={3}>
      Affected Assets presently locked in Affected Pools due to incorrect pool state as a result of the Primary Exploit
      and MBA.
    </Trans>,
    <Trans key={4}>
      Affected Assets previously locked in Affected Pools due to incorrect pool state as a result of the Primary
      Exploit, but which have been recovered from such liquidity pools.
    </Trans>,
  ]

  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'snapshot'
  const setTab = useCallback(
    (t: string) => {
      searchParams.set('tab', t)
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams],
  )

  useEffect(() => {
    if (!userHaveVestingData) setTab('snapshot')
  }, [account, userHaveVestingData, setTab])

  return (
    <PoolsPageWrapper>
      <div className={cn('flex items-center justify-between gap-4', upToMedium ? 'flex-col' : 'flex-row')}>
        <div className="flex flex-[3] flex-col gap-3">
          <div className="flex cursor-pointer items-center gap-4">
            <h2
              className={cn('text-2xl font-medium', tab === 'snapshot' ? 'text-primary' : 'text-text')}
              role="button"
              onClick={() => setTab('snapshot')}
            >
              <Trans>Snapshot</Trans>
            </h2>

            {userHaveVestingData && (
              <>
                <span className="text-2xl text-subText">|</span>

                <h2
                  className={cn('text-2xl font-medium', tab === 'vesting' ? 'text-primary' : 'text-text')}
                  onClick={() => setTab('vesting')}
                >
                  <Trans>Vesting</Trans>
                </h2>
              </>
            )}
          </div>

          {tab === 'snapshot' && (
            <>
              <span className="text-sm leading-5 text-subText">
                <Trans>
                  You can find the list of your liquidity positions in KyberSwap Elastic pools that were affected by the
                  exploit below. Snapshots for each chain are taken based on the last block prior to the exploit.
                  <br />
                  <br />
                  Prices are sourced based on the closest available pricing data from CoinGecko immediately following
                  the exploit.
                </Trans>
              </span>
              <ExternalLink href="https://blog.kyberswap.com/kyberswap-treasury-grant-program/">
                <span className="text-sm">
                  <Trans>Official announcement is here ↗</Trans>
                </span>
              </ExternalLink>
            </>
          )}
        </div>

        {tab === 'snapshot' && (
          <div className="flex w-full max-w-[580px] flex-col gap-3">
            <div className={cn('grid gap-4', upToSmall ? 'grid-cols-2' : 'grid-cols-3')}>
              <div className="flex flex-col justify-between gap-4 rounded-xl bg-black-48 p-3">
                <span className="text-sm font-medium text-subText">
                  <Trans>Total Amount (USD)</Trans>
                </span>
                <span className="text-xl font-medium">
                  {phase3Info ? format(phase3Info.value) : userInfo ? format(userInfo.total_usd) : '--'}
                </span>
              </div>

              {upToSmall && <div />}

              <div className="flex flex-col justify-between gap-4 rounded-xl bg-black-48 p-3">
                <span className="text-sm font-medium leading-5 text-subText">
                  <Trans>
                    Total Liquidity Amount
                    <br />
                    (USD)
                  </Trans>
                </span>
                <span className="text-xl font-medium">
                  {phase3Info ? format(phase3Info.value) : userInfo ? format(userInfo.total_liquidity_usd) : '--'}
                </span>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-xl bg-black-48 p-3">
                <span className="text-sm font-medium leading-5 text-subText">
                  <Trans>
                    Total Fees Amount
                    <br />
                    (USD)
                  </Trans>
                </span>
                <span className="text-xl font-medium">{userInfo ? format(userInfo.total_fee_usd) : '--'}</span>
              </div>
            </div>
            <span className="text-right text-[10px] italic text-subText">
              <Trans>Total Amount (USD) = Total Liquidity Amount (USD) + Total Fees Amount (USD)</Trans>
            </span>
          </div>
        )}
      </div>

      {tab === 'snapshot' ? (
        <>
          {(userInfo || phase3Info) && <TreasuryGrantAndInstantClaim userHaveVestingData={userHaveVestingData} />}

          <div className={cn('mt-6 flex flex-col', upToSmall && '-mx-4')}>
            <div
              className={cn(
                'overflow-hidden rounded-2xl border border-border bg-background text-center text-sm leading-relaxed text-subText',
                'max-sm:rounded-none max-sm:border-0',
              )}
            >
              {account ? (
                userInfo ? (
                  <>
                    <div className="px-6 py-4 text-left text-sm">
                      <Trans>Wallet address</Trans>:{' '}
                      <span className="font-medium text-text">{upToSmall ? shortenAddress(1, account) : account}</span>
                    </div>

                    <Tabs
                      className="rounded-none border-t border-border bg-background"
                      activeKey={selectedCategory}
                      onChange={key => setSelectedCategory(+key)}
                      tabItemStyle={{ background: theme.background }}
                      items={categories.map((_, index) => {
                        return {
                          key: index,
                          label: (
                            <span className="flex items-center gap-1 text-sm font-medium">
                              <Trans>Category</Trans> {index + 1}{' '}
                              {!!positionsByCategories[index].length && (
                                <Tag>{positionsByCategories[index].length}</Tag>
                              )}
                            </span>
                          ),
                          children: (
                            <div
                              className={cn(
                                'flex justify-between gap-6 p-4',
                                upToMedium ? 'flex-col-reverse items-start' : 'flex-row items-center',
                              )}
                            >
                              <div className="text-left">
                                <div className="text-xl font-medium text-text">
                                  <Trans>Category</Trans> {selectedCategory + 1}
                                </div>
                                <div className="my-4 text-sm font-medium">{categoriesDesc[selectedCategory]}</div>
                              </div>

                              <div
                                className={cn(
                                  'rounded-xl bg-buttonBlack p-3 text-left',
                                  upToMedium ? 'min-w-full' : 'min-w-[180px]',
                                )}
                              >
                                <div className="text-sm font-medium">
                                  <Trans>Total Amount (USD)</Trans>
                                </div>

                                <div className="mt-6 text-xl font-medium text-text">
                                  {format(
                                    positionsByCategories[selectedCategory].reduce((s, c) => s + c.position_usd, 0),
                                  )}
                                </div>
                              </div>
                            </div>
                          ),
                        }
                      })}
                    />

                    {!upToSmall && (
                      <div className="grid grid-cols-[1fr_0.75fr_1fr_1fr] items-center bg-tableHeader p-4 text-xs font-medium text-subText">
                        <span className="text-left">
                          <Trans>POOLS</Trans>
                        </span>
                        <span className="text-right">
                          <Trans>NFT ID</Trans>
                        </span>

                        <span className="ml-auto w-fit border-b border-dotted border-border text-right">
                          <MouseoverTooltip
                            text={t`This is the USD value of your liquidity position immediately before the exploit.`}
                          >
                            <Trans>POSITION LIQUIDITY (USD)</Trans>
                          </MouseoverTooltip>
                        </span>
                        <span className="ml-auto w-fit border-b border-dotted border-border text-right">
                          <MouseoverTooltip
                            text={t`This is the USD value of the fees earned by your liquidity position immediately before the exploit.`}
                          >
                            <Trans>POSITION FEE (USD)</Trans>
                          </MouseoverTooltip>
                        </span>
                      </div>
                    )}

                    {!positionsByCategories[selectedCategory].length && (
                      <div className="px-4 py-12">
                        <Trans>
                          None of the liquidity position(s) held by your wallet ({shortenAddress(1, account)}) were
                          affected by the exploit on this category.
                        </Trans>
                      </div>
                    )}
                    {positionsByCategories[selectedCategory].map(item => (
                      <div
                        key={item.position_id}
                        className={cn(
                          'grid items-center border-b border-border bg-background p-4 text-sm text-text',
                          upToSmall
                            ? 'grid-cols-2 justify-between gap-3 bg-buttonBlack'
                            : 'grid-cols-[1fr_0.75fr_1fr_1fr]',
                        )}
                      >
                        <div className="flex">
                          <Logo
                            address0={item.info.token0}
                            address1={item.info.token1}
                            chainId={chainToChainId[item.info.chain]}
                          />
                          {item.info.pair}
                        </div>
                        <span className="text-right">#{item.position_id}</span>

                        {upToSmall && (
                          <>
                            <MouseoverTooltip
                              text={t`This is the USD value of your liquidity position immediately before the exploit.`}
                            >
                              <span className="border-b border-dotted border-border text-xs font-medium text-subText">
                                <Trans>POSITION LIQUIDITY (USD)</Trans>
                              </span>
                            </MouseoverTooltip>

                            <span className="w-fit justify-self-end border-b border-dotted border-border text-xs font-medium text-subText">
                              <MouseoverTooltip
                                text={t`This is the USD value of the fees earned by your liquidity position immediately before the exploit.`}
                              >
                                <Trans>POSITION FEES (USD)</Trans>
                              </MouseoverTooltip>
                            </span>
                          </>
                        )}
                        <span className={upToSmall ? 'text-left' : 'text-right'}>{format(item.liquidity_usd)}</span>
                        <span className="text-right">{format(item.fee_usd)}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center px-4 py-9">
                    <Info size={64} />
                    <div className="mt-6 text-sm">
                      <Trans>
                        None of the liquidity position(s) held by your wallet ({shortenAddress(1, account)}) were
                        affected by the exploit.
                      </Trans>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center px-4 py-12">
                  <div className="mb-6 max-w-[820px] text-sm">
                    <Trans>
                      Please connect your wallet to view your affected position(s). If your Affected Address is a
                      Multisig or other Contracts, you won’t be able to complete the steps via the UI. Instead, please
                      contact us at <a href="mailto:support@kyberswap.com">support@kyberswap.com</a>
                    </Trans>
                  </div>

                  <ButtonPrimary onClick={toggleWalletModal} width="94px">
                    <Trans>Connect</Trans>
                  </ButtonPrimary>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        userHaveVestingData && (
          <>
            <span className="text-sm leading-5 text-subText">
              <Trans>
                You can find the vesting details of each category of assets that were affected by the exploit below.
              </Trans>
            </span>

            {(vestingA || vestingB) && (
              <Vesting
                userSelectedOption={vestingA ? 'A' : 'B'}
                userVestingData={(vestingA || vestingB) as VestingInterface}
                contractAddress={vestingContractAddress[vestingA ? 'A' : 'B']}
                tcLink="https://bafkreidnmptjtdvhzcuy4jiib34j5aapsuklhrryqptvfprnld7o6st42y.ipfs.w3s.link"
              />
            )}
            {(vestingAPhase2 || vestingBPhase2) && (
              <Vesting
                userSelectedOption={vestingAPhase2 ? 'A' : 'B'}
                userVestingData={(vestingAPhase2 || vestingBPhase2) as VestingInterface}
                contractAddress={phase2AddressVestingContract[vestingAPhase2 ? 'A' : 'B']}
                tcLink="https://bafkreieg7lvkcjcx3gczdqta2izunwovrn7rcjg6j24ixjftniiyopp5w4.ipfs.w3s.link"
              />
            )}

            {vestingP3 && (
              <Vesting
                userSelectedOption={'B'}
                userVestingData={vestingP3 as VestingInterface}
                contractAddress={vestingPhase3ContractAddress}
                tcLink="https://bafkreieg7lvkcjcx3gczdqta2izunwovrn7rcjg6j24ixjftniiyopp5w4.ipfs.w3s.link"
              />
            )}
          </>
        )
      )}
    </PoolsPageWrapper>
  )
}

const chainToChainId: { [key: string]: ChainId } = {
  ethereum: 1,
  optimism: 10,
  arbitrum: 42161,
  avalanche: 43114,
  base: 8453,
  polygon: 137,
}
const Logo = ({ chainId, address0, address1 }: { chainId: ChainId; address0: string; address1: string }) => {
  const allTokens = useAllTokens(true, chainId)

  return (
    <div className="relative">
      <DoubleCurrencyLogo
        size={20}
        currency0={allTokens[address0.toLowerCase()]}
        currency1={allTokens[address1.toLowerCase()]}
      />

      <img
        src={NETWORKS_INFO[chainId].icon}
        className="absolute bottom-0 right-1 z-[1]"
        width="12px"
        height="12px"
        alt=""
      />
    </div>
  )
}
