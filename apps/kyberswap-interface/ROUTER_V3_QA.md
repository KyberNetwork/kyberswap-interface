# Router V3 QA

On the QA deployment's Swap page, open Settings and enable **Router V3 test**.
The toggle switches the quote/build client in session state without changing the URL or reloading.
Changing it clears cached routes and permits and fetches a new quote.
Turning it off restores the original client (URL client ID, if any, otherwise `kyberswap`).
The setting defaults to off after a page reload and is not shown inside Safe.
Supported chains: Ethereum, BSC, Base, Robinhood.

The existing Swap flow forwards this client ID to both quote and build requests.
Do not add `useRouterV3`: router selection comes from the API rollout configuration.
The normal client remains `kyberswap` when no client ID is supplied.

## Network checks

- Quote: `x-client-id: router-v3-sim-test` on `/api/v1/routes`.
- Build: the same header and `source: router-v3-sim-test` on `/api/v1/route/build`.
- Both responses should select `0x6868D319c8c9A78F7d39DC3602C5c917315132D7`.
- Check the actual API host in DevTools: signed-in users can use the domain from global config.

## Wallet checks on each supported chain

1. Refresh the page. Swap native input without an ERC20 approval.
2. Swap ERC20 input without V3 allowance: approve the API-selected router, then swap.
3. With existing V2 allowance, verify the new-router tooltip on the approval button.
4. With sufficient V3 allowance, verify no extra approval is required.
5. Where a supported EIP-2612 token is available, use a wallet without V3 allowance:
   sign for V3, build with the five-word permit, and complete the swap.
   Existing allowance must not mask a failed permit.
6. Repeat with the normal client on a route that returns V2 to check the seven-word permit fallback.

Permit2, simulation UI, Stop Market and notification banners are outside this change.
The tooltip's Read more link currently uses the existing approval guide; replace it when the public Router Upgrade guide is available.

Live quote checks with this client passed on all four chains. Wallet execution remains a QA step.
