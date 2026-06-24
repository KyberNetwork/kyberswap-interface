# Limit Order QA Test Script

Use the examples below as concrete scenarios. Token names are examples; any pair with the same balance/allowance setup is fine.

Expected processing pattern:
- Create order: `Wrap native? -> Approve token -> Sign order`
- Take/fill order: `Wrap native? -> Approve token -> Fill order`
- `Wrap native` appears only when the required wrapped token balance is missing and native balance can cover the deficit.
- `Approve token` always appears. If allowance is already enough, it should auto-pass without wallet popup.

## Create Order - ERC20 Input

### 1. ERC20 balance enough, allowance already enough
- Example: create order `100 USDT -> 0.04 ETH`.
- Wallet balance: `500 USDT`.
- Existing allowance: `200 USDT`.
- Reserved active making amount: `0 USDT`.
- Expected processing steps: `Approve USDT`, `Sign order`.
- Expected tx/signature: approve step auto-passes; no approve tx; order signing/API create runs.

### 2. ERC20 balance enough, allowance missing
- Example: create order `100 USDT -> 0.04 ETH`.
- Wallet balance: `500 USDT`.
- Existing allowance: `20 USDT`.
- Reserved active making amount: `0 USDT`.
- Expected processing steps: `Approve USDT`, `Sign order`.
- Expected tx/signature: approve USDT tx is requested; order signing starts after approval is detected.

### 3. ERC20 allowance enough for input but not reserved active amount
- Example: create order `100 USDT -> 0.04 ETH`.
- Wallet balance: `500 USDT`.
- Existing allowance: `120 USDT`.
- Reserved active making amount: `50 USDT`.
- Required allowance check: `100 + 50 = 150 USDT`.
- Expected processing steps: `Approve USDT`, `Sign order`.
- Expected tx/signature: approve tx is requested because available allowance after reserved amount is only `70 USDT`.

### 4. ERC20 invalid or zero amount
- Example: input amount is `0`, empty, or unparsable.
- Expected result: bottom button shows `Please enter a valid input amount`.
- Expected result: token input tooltip error is not shown separately.
- Expected result: review modal cannot open.

## Create Order - Native / WETH Input

### 5. Native ETH input, WETH balance and allowance already enough
- Example: create order `1 ETH -> 3,500 USDT`.
- Wallet balance: `2 ETH`, `1 WETH`.
- Existing WETH allowance: `2 WETH`.
- Reserved active making amount: `0 WETH`.
- Expected processing steps: `Approve WETH`, `Sign order`.
- Expected tx/signature: no wrap tx; approve step auto-passes; order signing/API create runs.

### 6. Native ETH input, WETH balance enough but allowance missing
- Example: create order `1 ETH -> 3,500 USDT`.
- Wallet balance: `2 ETH`, `1 WETH`.
- Existing WETH allowance: `0 WETH`.
- Expected processing steps: `Approve WETH`, `Sign order`.
- Expected tx/signature: no wrap tx; approve WETH tx is requested; order signing starts after approval is detected.

### 7. Native ETH input, WETH balance missing but ETH enough
- Example: create order `1 ETH -> 3,500 USDT`.
- Wallet balance: `2 ETH`, `0 WETH`.
- Existing WETH allowance: `0 WETH`.
- Expected wrap amount: `1 ETH`.
- Expected processing steps: `Wrap ETH`, `Approve WETH`, `Sign order`.
- Expected tx/signature: wrap `1 ETH`; approve WETH tx is requested; order signing starts after approval is detected.

### 8. WETH input, WETH balance enough but allowance missing
- Example: create order `1 WETH -> 3,500 USDT`.
- Wallet balance: `1.5 WETH`, `0 ETH`.
- Existing WETH allowance: `0 WETH`.
- Expected processing steps: `Approve WETH`, `Sign order`.
- Expected tx/signature: no wrap tx; approve WETH tx is requested; order signing starts after approval is detected.

### 9. WETH input, WETH balance partially missing but ETH enough
- Example: create order `1 WETH -> 3,500 USDT`.
- Wallet balance: `0.4 WETH`, `2 ETH`.
- Existing WETH allowance: `5 WETH`.
- Expected wrap amount: `0.6 ETH`.
- Expected processing steps: `Wrap ETH`, `Approve WETH`, `Sign order`.
- Expected tx/signature: wrap `0.6 ETH`; approve step auto-passes; order signing/API create runs.

### 10. WETH input, WETH plus ETH insufficient
- Example: create order `1 WETH -> 3,500 USDT`.
- Wallet balance: `0.4 WETH`, `0.3 ETH`.
- Existing WETH allowance: any value.
- Required available amount: `0.4 + 0.3 = 0.7 WETH equivalent`.
- Expected result: bottom button shows `Insufficient Balance`.
- Expected result: review/processing cannot start.

## Take / Fill Order - ERC20 Pay Token

### 11. ERC20 pay token, allowance already enough
- Example: fill order requiring taker to pay `100 USDT` and receive `0.04 ETH`.
- Wallet balance: `500 USDT`.
- Existing USDT allowance: `200 USDT`.
- Expected processing steps: `Approve token`, `Fill order`.
- Expected tx: approve step auto-passes; no approve tx; fill tx is submitted.

### 12. ERC20 pay token, allowance missing
- Example: fill order requiring taker to pay `100 USDT`.
- Wallet balance: `500 USDT`.
- Existing USDT allowance: `20 USDT`.
- Expected processing steps: `Approve token`, `Fill order`.
- Expected tx: approve USDT tx is requested; fill tx starts after approval is detected.

### 13. Fill amount exceeds available amount
- Example: order has available amount `60 HYPE`.
- User enters fill amount `100 HYPE`.
- Expected result: submit button shows `Exceeds order available`.
- Expected result: processing modal cannot start.

## Take / Fill Order - WETH Pay Token

### 14. WETH pay token, WETH balance and allowance already enough
- Example: fill order requiring taker to pay `1 WETH`.
- Wallet balance: `2 WETH`, `0 ETH`.
- Existing WETH allowance: `2 WETH`.
- Expected processing steps: `Approve token`, `Fill order`.
- Expected tx: no wrap tx; approve step auto-passes; fill tx is submitted.

### 15. WETH pay token, WETH balance enough but allowance missing
- Example: fill order requiring taker to pay `1 WETH`.
- Wallet balance: `1.5 WETH`, `0 ETH`.
- Existing WETH allowance: `0 WETH`.
- Expected processing steps: `Approve token`, `Fill order`.
- Expected tx: no wrap tx; approve WETH tx is requested; fill tx starts after approval is detected.

### 16. WETH pay token, WETH balance missing but ETH enough
- Example: fill order requiring taker to pay `1 WETH`.
- Wallet balance: `0.4 WETH`, `2 ETH`.
- Existing WETH allowance: `5 WETH`.
- Expected wrap amount: `0.6 ETH`.
- Expected processing steps: `Wrap ETH`, `Approve token`, `Fill order`.
- Expected tx: wrap `0.6 ETH`; approve step auto-passes; fill tx is submitted.

### 17. WETH pay token, WETH balance missing and allowance missing
- Example: fill order requiring taker to pay `1 WETH`.
- Wallet balance: `0.4 WETH`, `2 ETH`.
- Existing WETH allowance: `0 WETH`.
- Expected wrap amount: `0.6 ETH`.
- Expected processing steps: `Wrap ETH`, `Approve token`, `Fill order`.
- Expected tx: wrap `0.6 ETH`; approve WETH tx is requested; fill tx starts after approval is detected.

### 18. WETH pay token, WETH plus ETH insufficient
- Example: fill order requiring taker to pay `1 WETH`.
- Wallet balance: `0.4 WETH`, `0.3 ETH`.
- Existing WETH allowance: any value.
- Required available amount: `0.7 WETH equivalent`, below `1 WETH`.
- Expected result: submit button shows `Insufficient Balance`.
- Expected result: processing modal cannot start.

## Take / Fill Order - Fee and Encode Payload

### 19. Fill threshold and taker fee display
- Example: fill order requiring taker to pay `100 HYPE`, order rate `1 HYPE = 35 USDT`, taker fee `0.4%`.
- Gross receive amount: `3,500 USDT`.
- UI `You Receive`: `3,486 USDT`.
- Expected encode payload: `thresholdAmount` equals raw amount for `3,500 USDT`, not `3,486 USDT`.

## Processing Modal Behavior

### 20. Approve step auto-pass
- Example: allowance is already enough before opening processing modal.
- Expected result: `Approve token` row is visible, then quickly changes to success without wallet popup.
- Applies to: create order and take order.

### 21. Processing cannot be dismissed mid-step
- Example: start `Wrap ETH`, `Approve token`, `Sign order`, or `Fill order`.
- Expected result: clicking outside does not close modal.
- Expected result: close icon is disabled while the active step is running.
- Expected result: close works after success or error.

### 22. Retry failed step
- Example: reject approve in wallet.
- Expected result: approve row becomes error.
- Expected result: `Retry` appears on the same row without layout jump.
- Expected result: retry reruns only approve step, not previous successful wrap step.

### 23. Create success actions
- Example: create order finishes successfully.
- Expected result: modal shows `Close` and `View Order`.
- Expected result: `View Order` opens Limit page with `tab=my_order`.

### 24. Take success actions
- Example: fill order tx is submitted successfully.
- Expected result: modal shows `Close`.
- Expected result: closing modal also closes the fill modal flow.

## Cancel Order

### 25. Gasless cancel refresh
- Example: cancel order `#123` with gasless cancel.
- Expected result: cancel request succeeds.
- Expected result: My Orders list refreshes.
- Expected result: insufficient-orders badge refreshes.

### 26. Hard cancel refresh
- Example: cancel order `#123` with hard cancel.
- Expected result: cancel tx is submitted.
- Expected result: cancel tx is added to the transaction store with the cancelled order id.
- Expected result: My Orders shows the order as cancelling while the tx is pending.
- Expected result: My Orders list refreshes after tx/Firebase/order polling updates.
- Expected result: insufficient-orders badge refreshes.

## URL / Tab Behavior

### 27. Reserved order notice link
- Example: notice says `Some of your USDT is already reserved... here`.
- Action: click `here`.
- Expected result: confirm modal closes if it was open.
- Expected URL params:
  - `tab=my_order`
  - `orderTab=active`
  - `search=<input token address>`

### 28. View created order
- Example: create order on Ethereum pair `USDT -> ETH`.
- Action: click `View Order` after success.
- Expected result: opens Limit route for the current network/pair.
- Expected URL param: `tab=my_order`.
