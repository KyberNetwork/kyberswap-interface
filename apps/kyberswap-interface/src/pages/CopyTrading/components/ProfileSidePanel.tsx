import { Zap } from 'react-feather'

import { Center, HStack, Stack } from 'components/Stack'

const ProfileSidePanel = ({
  copiedCapital,
  isCopied,
  wishlistTokens,
}: {
  copiedCapital: string
  isCopied: boolean
  wishlistTokens: string[]
}) => (
  <Stack className="gap-5">
    <Stack className="gap-5 rounded-xl bg-buttonBlack p-5">
      <h3 className="m-0 border-b border-border pb-3 text-base font-semibold text-text">
        {isCopied ? 'Your Current Copy' : 'Copy This Agent'}
      </h3>
      {isCopied ? (
        <>
          <HStack className="items-center justify-between">
            <span className="text-sm text-subText">Capital In</span>
            <span className="text-xl font-semibold text-primary">{copiedCapital}</span>
          </HStack>
          <HStack className="gap-3.5 max-md:flex-col">
            <button className="h-10 flex-1 cursor-pointer rounded-xl border-0 bg-primary-20 text-sm font-semibold text-primary transition-colors hover:bg-primary-30">
              My Copy
            </button>
            <button className="h-10 flex-1 cursor-pointer rounded-xl border-0 bg-primary text-sm font-semibold text-black transition-colors hover:bg-primary-30">
              Add Capital
            </button>
          </HStack>
        </>
      ) : (
        <>
          <p className="m-0 text-sm leading-6 text-subText">
            Your funds remain in your personal Smart Contract Wallet. Only proportional trades are executed.
          </p>
          <button className="h-10 cursor-pointer rounded-xl border-0 bg-primary text-sm font-semibold text-black transition-colors hover:bg-primary-30">
            <Zap size={14} className="mr-1 inline fill-warning text-warning" />
            Copy
          </button>
        </>
      )}
    </Stack>
    <Stack className="gap-3.5 rounded-xl bg-buttonBlack p-5">
      <HStack className="items-center gap-4">
        <span className="w-20 text-sm text-subText">Win Rate</span>
        <div className="relative h-2 flex-1 rounded-full bg-subText-20">
          <div className="h-full w-5/12 rounded-full bg-gradient-to-r from-blue to-primary" />
          <Center className="left-5/12 absolute top-1/2 h-6 -translate-y-1/2 rounded-md bg-primary px-2 text-xs font-semibold text-black">
            45%
          </Center>
        </div>
      </HStack>
      <HStack className="items-center justify-between">
        <span className="text-sm text-subText">Max Drawdown</span>
        <span className="text-sm text-text">-12.5%</span>
      </HStack>
    </Stack>
    <Stack className="gap-3.5 rounded-xl bg-buttonBlack p-5">
      <h3 className="m-0 border-b border-border pb-3 text-base font-semibold text-text">Strategy & Execution</h3>
      <ul className="m-0 space-y-2 pl-5 text-sm leading-6 text-subText">
        <li>
          <span className="font-semibold text-text">Momentum Tracking:</span> Aims to capture sustained price movements
          across L2 networks.
        </li>
        <li>
          <span className="font-semibold text-text">Execution Model:</span> Sequential follower execution. Slight lag
          may occur between agent and follower trades.
        </li>
        <li>
          <span className="font-semibold text-text">v1 Constraints:</span> Trades only vs Stablecoins (USDC). TP/SL
          limits are manual.
        </li>
      </ul>
    </Stack>
    <Stack className="gap-3.5 rounded-xl bg-buttonBlack p-5">
      <h3 className="m-0 border-b border-border pb-3 text-base font-semibold text-text">Wishlisted Tokens</h3>
      <HStack className="flex-wrap gap-2.5">
        {wishlistTokens.map(token => (
          <span key={token} className="rounded-lg border border-border bg-background px-3 py-1 text-sm text-text">
            {token}
          </span>
        ))}
      </HStack>
    </Stack>
  </Stack>
)

export default ProfileSidePanel
