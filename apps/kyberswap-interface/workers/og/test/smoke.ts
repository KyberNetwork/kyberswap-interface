// Node smoke test of the worker's pure + network logic (no workerd). Bundled with esbuild and run
// under node, which has global fetch. Provides minimal Cache/ctx stubs.
import { parsePairPath, buildSwapMeta, parsePoolPath, buildPoolMeta } from '@/meta'
import { resolvePool } from '@/pools'
import { resolveToken } from '@/tokens'

const cache: Cache = {
  match: async () => undefined,
  put: async () => undefined,
} as unknown as Cache

const ctx = { waitUntil: () => undefined, passThroughOnException: () => undefined } as unknown as ExecutionContext

let failures = 0
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ok   ${name}`)
  } else {
    failures++
    console.log(`  FAIL ${name}`, detail ?? '')
  }
}

async function main() {
  console.log('# parsePairPath')
  const p1 = parsePairPath('/swap/ethereum/eth-to-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', new URLSearchParams())
  check('path pair parses', !!p1 && p1.chain.chainId === 1 && p1.inId === 'eth')
  check('path pair out id', p1?.outId === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')

  const p2 = parsePairPath('/limit/bnb/bnb-to-usdt', new URLSearchParams())
  check('limit kind', p2?.kind === 'limit' && p2.chain.chainId === 56)

  const p3 = parsePairPath('/swap/ethereum', new URLSearchParams('inputCurrency=eth&outputCurrency=usdc'))
  check('legacy query form', !!p3 && p3.inId === 'eth' && p3.outId === 'usdc')

  const p4 = parsePairPath('/swap/ethereum', new URLSearchParams())
  check('bare landing -> null', p4 === null)

  const p5 = parsePairPath('/earn/pools', new URLSearchParams())
  check('non-swap -> null', p5 === null)

  const p6 = parsePairPath('/swap/notachain/eth-to-usdc', new URLSearchParams())
  check('unknown chain -> null', p6 === null)

  const p7 = parsePairPath('/swap/ethereum/eth-to-eth', new URLSearchParams())
  check('same-token clears out (app parity)', !!p7 && p7.inId === 'eth' && p7.outId === '')

  const p8 = parsePairPath('/swap/ethereum/-to-usdc', new URLSearchParams())
  check('input-empty one-sided parses', !!p8 && p8.inId === '' && p8.outId === 'usdc')

  console.log('# resolveToken (live ks-setting)')
  const eth = await resolveToken(1, 'eth', 'ETH', cache, ctx)
  check('native ETH resolves', eth?.symbol === 'ETH' && !!eth?.logoURI, eth)

  const usdcByAddr = await resolveToken(1, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'ETH', cache, ctx)
  check('USDC by address', usdcByAddr?.symbol === 'USDC' && !!usdcByAddr?.logoURI, usdcByAddr)

  const usdcBySym = await resolveToken(1, 'usdc', 'ETH', cache, ctx)
  check('USDC by symbol', usdcBySym?.symbol === 'USDC', usdcBySym)

  const bnb = await resolveToken(56, 'bnb', 'BNB', cache, ctx)
  check('native BNB on chain 56', bnb?.symbol === 'BNB' && !!bnb?.logoURI, bnb)

  console.log('# buildSwapMeta')
  if (p1) {
    const meta = await buildSwapMeta(p1, cache, ctx)
    check('meta title', !!meta && meta.title.includes('ETH') && meta.title.includes('USDC'), meta?.title)
    check('meta image url', !!meta && meta.image.includes('/og/swap?') && meta.image.includes('chain=ethereum'), meta?.image)
    check('meta og url', !!meta && meta.url === 'https://kyberswap.com/swap/ethereum/eth-to-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', meta?.url)
  }

  // Provided side that can't resolve -> bail (serve page unchanged), no misleading 'Token' card.
  const junk = parsePairPath('/swap/ethereum/eth-to-0x000000000000000000000000000000000000dead', new URLSearchParams())
  const junkMeta = junk ? await buildSwapMeta(junk, cache, ctx) : 'no-parse'
  check('unresolvable provided side -> null meta', junkMeta === null, junkMeta)

  // One-sided (input-empty): og:url keeps the empty side in place (no direction flip), and the title
  // is a clean single-token card (no "→ Token").
  if (p8) {
    const m8 = await buildSwapMeta(p8, cache, ctx)
    check('one-sided og url keeps direction', !!m8 && m8.url === 'https://kyberswap.com/swap/ethereum/-to-usdc', m8?.url)
    check('one-sided title is single-token', !!m8 && m8.title === 'Swap USDC | KyberSwap' && !m8.title.includes('→'), m8?.title)
  }

  console.log('# parsePoolPath')
  const usdcWeth = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'
  const pp1 = parsePoolPath(`/pools/ethereum/uniswapv3/${usdcWeth}`)
  check('pool path parses', !!pp1 && pp1.chain.chainId === 1 && pp1.protocol === 'uniswapv3' && pp1.address === usdcWeth)
  check('legacy /pools/add-liquidity -> null', parsePoolPath('/pools/add-liquidity') === null)
  check('bad pool address -> null', parsePoolPath('/pools/ethereum/uniswapv3/notanaddress') === null)
  check('unknown pool chain -> null', parsePoolPath(`/pools/notachain/uniswapv3/${usdcWeth}`) === null)

  console.log('# resolvePool + buildPoolMeta (live earn-service)')
  const pool = await resolvePool(1, usdcWeth, 'uniswapv3', cache, ctx)
  check('pool resolves both tokens', !!pool && !!pool.token0.symbol && !!pool.token1.symbol, pool)
  if (pp1) {
    const pmeta = await buildPoolMeta(pp1, cache, ctx)
    check('pool meta title', !!pmeta && pmeta.title.includes('Pool') && pmeta.title.includes('KyberSwap'), pmeta?.title)
    check('pool meta image -> /og/pool', !!pmeta && pmeta.image.includes('/og/pool?') && pmeta.image.includes('chain=ethereum'), pmeta?.image)
    check('pool meta canonical url', !!pmeta && pmeta.url === `https://kyberswap.com/pools/ethereum/uniswapv3/${usdcWeth}`, pmeta?.url)
    check(
      'pool meta is self-canonical + index',
      !!pmeta && pmeta.canonical === pmeta.url && (pmeta.robots || '').startsWith('index,follow'),
      { canonical: pmeta?.canonical, robots: pmeta?.robots },
    )
  }

  console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL PASS')
  process.exit(failures ? 1 : 0)
}

main()
