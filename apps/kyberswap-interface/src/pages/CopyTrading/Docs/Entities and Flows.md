# Entities and Flows

Lần cập nhật: 2026-08-13

Tài liệu này là bản đọc nhanh để hiểu entity, lifecycle và user flow của Copy
Trading. Contract hiện tại nằm trong `FE_API_Catalog.md`; `openapi.yaml` đã
được đồng bộ byte-for-byte từ Swagger pre-release ngày 2026-08-13. Trạng thái
code thực tế nằm trong `IMPLEMENTATION_STATUS.md`.

## 1. Mental model

```text
Owner Wallet
└── Copy Run: một generation copy một Agent
    ├── Agent: leader và strategy được copy
    ├── Copy Account: smart account giữ quote balance và positions
    └── Follower Positions: exposure của riêng owner
```

- Một lần Start Copy thành công tạo một Copy Run và Copy Account mới.
- Add Capital nạp thêm quote token vào Copy Account hiện tại, không tạo
  lifecycle mới.
- Position của Agent chỉ dùng để quan sát. Position mà owner có thể action là
  follower position thuộc Copy Run của mình.
- Allocated capital, Copy Account quote balance và position value là ba giá trị
  khác nhau. Quote balance có thể giảm vì vốn đã được dùng để mở position.
- Activity là audit trail; không parse display text để suy ra lifecycle hoặc
  action availability.

## 2. Lifecycle

### Copy Run và Copy Account

| Status    | Ý nghĩa                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------- |
| `ACTIVE`  | Đang copy Agent. Có thể Add Capital hoặc Stop Copy nếu availability cho phép.                            |
| `CLOSING` | Stop hoặc position exit đang xử lý. Không gửi lại action cũ; chờ API hội tụ.                             |
| `STOPPED` | Generation đã ngừng copy. Run vẫn có thể còn position `ACTIVE`, `CLOSING` hoặc `LEFTOVER`.               |
| `CLOSED`  | Lifecycle đã terminal. Live API hiện trả các run này trong History, nhưng view vẫn do server quyết định. |

Status và Open/History là hai trục riêng. Contract hiện tại quy định:

- Open chứa run `ACTIVE`/`CLOSING` và run đã stop nhưng vẫn còn position
  `ACTIVE`, `CLOSING` hoặc `LEFTOVER`.
- Khi authoritative projection không còn các position trên, server chuyển run
  sang History ngay; không có time-based grace period.
- Quote balance còn lại không giữ run trong Open. Run trong History vẫn có thể
  advertise Withdraw Quote.
- Frontend không tự filter, promote status hoặc chuyển row giữa hai view. Reorg
  hay reactivation có thể khiến server đưa run trở lại Open.

Hai route `my-copies/:copyId` và `history/:copyId` dùng chung một Copy Detail.
Direct response chỉ đổi badge, timeline và action eligibility; không đổi sang
một page riêng:

```text
Open Positions | Closed Positions | Action Logs
```

Các tab đọc dữ liệu theo selected Copy Run:

```text
Open/Closed Positions → Copy Run positions + status filter
Action Logs           → Owner activity + copyRunId filter
Remaining in Wallet   → bounded copy-account wallet inventory + authoritative server USD total
```

Withdraw chỉ render khi direct Copy Run có status `STOPPED`, sau đó vẫn phải
qua `withdrawQuoteAvailability`. Quy tắc detail này không định nghĩa membership
của list Open/History.

Màn History hiện chỉ có một bảng Copy History, dùng
`copy-runs?view=OWNER_COPY_VIEW_HISTORY`. Summary và các row đều cùng scope
terminal/history Copy Run. Endpoint owner-wide
`positions?view=POSITION_VIEW_CLOSED` chưa có UI surface trên màn này.

### Position

| Lifecycle | Ý nghĩa                        |
| --------- | ------------------------------ |
| `ACTIVE`  | Position đang mở.              |
| `CLOSING` | Position đang được thoát/sell. |
| `CLOSED`  | Position đã đóng.              |

Quantity state là trục riêng:

```text
OPEN_FULL | OPEN_PARTIAL | CLOSED
```

`LEFTOVER` là một view/residue condition, không phải lifecycle. Một position
`ACTIVE`, đang lỗ hoặc có leftover không tự động đủ điều kiện Manual Sell hay
Close Position.

## 3. Main flow

```text
Chọn Agent
→ Start Copy
→ Copy Run ACTIVE
→ Add Capital nếu cần
→ Agent execution có thể tạo follower Position
→ Stop Copy
→ Copy Run CLOSING vẫn ở Open Copy Detail trong khi API hội tụ
→ Copy Run STOPPED và còn active/closing/leftover position vẫn ở Copy Detail
→ Withdraw/Manual Sell/Close Position chỉ khi API advertise và prepare cho phép
→ Khi không còn active/closing/leftover position, server đưa run vào History
→ Live API hiện trả run đó với status CLOSED
```

### Start Copy

Production UI dùng funded Start Copy. Khi wallet đã có đủ allowance, flow chỉ
có một Create transaction mang toàn bộ target capital:

```text
Tạo một UUIDv4 startRequestId
→ prepare: CREATE_REQUIRED
→ nếu thiếu allowance, hiển thị review; checkbox gate nút Approve riêng
→ follow permit/approval scheme và spender do API trả về
→ tạo UUID mới cho authorized attempt; giữ nguyên target/mode/permit bytes trong memory
→ prepare authorized UUID đến READY và quay lại review
→ user bấm Start Copying riêng để ký Create transaction
→ gửi exact Create call
→ đợi receipt và API hội tụ
→ prepare lại với cùng authorized UUID và target
→ COMPLETED / Copy Run ACTIVE
```

Authorization có thể là EIP-2612, DAI-like, standard approval hoặc
zero-then-set approval; FE không suy luận từ token symbol và không hardcode
spender/domain. Smart account bỏ native permit và dùng approval fallback.
Trong lúc authorize, review modal giữ nguyên và loading nằm trên nút Approve;
FE không tự gửi Create call sau khi approval/permit hoàn tất.
Minimum, quote token và wallet balance lấy từ response prepare. Một generation
mới phải dùng UUID mới; không tái sử dụng Copy Run cũ. Funded production flow
không gửi một Fund call riêng.

### Actions trên Copy Run

| Action         | Điều kiện/input chính                                     | Kết quả chính                                                   |
| -------------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| Add Capital    | Run `ACTIVE`, amount và availability hợp lệ.              | Tăng allocated capital; không tạo lifecycle mới.                |
| Stop Copy      | Run `ACTIVE`; refresh và gửi current `userPositionIds[]`. | Ngừng copy; position có thể qua `CLOSING`; quote vẫn ở account. |
| Withdraw Quote | Account đã Stop, còn quote balance và prepare cho phép.   | Max-sweep quote token về recipient do API chuẩn bị.             |

Stop Copy chấp nhận `userPositionIds = []` khi không có position cần xử lý. Nếu
position set thay đổi trước khi ký, bỏ preparation cũ và prepare lại. Stop
không tự chuyển quote balance về ví owner; Withdraw là action riêng và request
body là `{}`.

### Position recovery

Manual Sell và Close Position không phải nút bán tùy ý:

- **Manual Sell** chỉ xuất hiện khi position advertise `MANUAL_SELL` và có
  pending-sell-obligation FIFO. Unresolved count và sell ratio phải lấy nguyên
  từ FIFO hiện tại, không cho user tự chọn phần trăm.
- **Close Position** chỉ xuất hiện khi position advertise `CLOSE_POSITION` cho
  full-position recovery. `UNAVAILABLE / CLOSE_NOT_ELIGIBLE` nghĩa là không
  được ép close bằng một call khác.
- Cả hai flow cần Wallet Session: ký đúng SIWE message, đổi lấy access token và
  chỉ giữ token trong memory.

## 4. Action theo state

| State chính                           | Action có thể thực hiện                                          |
| ------------------------------------- | ---------------------------------------------------------------- |
| Chưa có active run cho Agent          | Start Copy nếu Agent và prepare cho phép.                        |
| Run `ACTIVE`, chưa có position        | Add Capital; Stop Copy với `userPositionIds = []`.               |
| Run `ACTIVE`, có position bình thường | Add Capital; Stop Copy. Không tự Manual Sell/Close Position.     |
| Run hoặc Position `CLOSING`           | Không gửi lại action; chờ receipt/projector rồi prepare lại.     |
| Run `STOPPED`, còn quote balance      | Withdraw nếu prepare cho phép.                                   |
| Run `CLOSED`                          | Đọc History; chỉ Withdraw nếu availability/prepare vẫn cho phép. |
| Có pending sell obligation            | Manual Sell nếu được advertise và Wallet Session hợp lệ.         |
| Đủ điều kiện full recovery            | Close Position nếu được advertise và Wallet Session hợp lệ.      |
| Position `CLOSED`                     | Không Manual Sell hoặc Close Position lần nữa.                   |

Read availability dùng để enable UI. Kết quả prepare mới nhất mới là quyết định
cuối cùng.

## 5. Activity semantics

- `position.actionType = sell_unaligned` là generic owner-directed exit và phải
  hiển thị **Owner Sell**. Không suy luận thành Manual Sell hoặc Close Position
  từ amount, remaining balance, lifecycle hay calldata.
- Stop Copy là một lifecycle row không có token/amount/value. Các row
  `EXIT_*`, `POSITION_REDUCED` và `POSITION_CLOSED` phía sau là những sự kiện
  độc lập và giữ token/accounting của chính chúng.
- Deposit, Add Capital, Withdraw Quote và Returned Capital phải dùng typed
  activity/capital detail; summary chỉ là display text.

## 6. Prepared-action flow

Mọi write action dùng cùng safety boundary:

```text
Read availability
→ Refresh direct entity/account/position
→ Gọi prepare endpoint
→ Kiểm tra status, reason, preview và exact call
→ Với funded Start thiếu allowance, user xác nhận Approve riêng; authorize đúng token/spender/scheme
→ Prepare lại bằng UUID mới; chỉ khi READY và user bấm Start Copying mới gửi Create call
→ Validate owner account, Smart Wallet, chain, call kind, target, value và deadline
→ Gửi call.to / call.data / call.valueRaw nguyên trạng
→ Đợi receipt thành công
→ Poll đến khi read model hội tụ
→ Refetch list, summary và detail liên quan
```

| Prepared status       | Frontend behavior                                                                 |
| --------------------- | --------------------------------------------------------------------------------- |
| `READY`               | Validate và gửi exact call.                                                       |
| `PARTIALLY_COMPLETED` | Chỉ hợp lệ cho multi-stage Start; funded production UI không gửi Fund call riêng. |
| `COMPLETED`           | Không gửi transaction; refresh reads và kết thúc flow.                            |
| `PENDING`             | Không gửi; chờ `reprepareAfter` rồi prepare lại.                                  |
| `UNAVAILABLE`         | Không gửi; hiển thị typed reason.                                                 |

Không ABI-encode, rebuild hoặc chỉnh sửa calldata từ preview. Wallet Session chỉ
authorize preparation cho Manual Sell/Close Position; nó không submit
transaction.

`PreparedAction.copyAccount` là identity của Smart Wallet, không phải `call.to`.
Với mọi action ngoài Start Copy, field này phải khớp Copy Account đang chọn;
Start funding/completion phải khớp `startCopy.predictedCopyAccount`.

Các swap preview của Stop Copy, Manual Sell và Close Position chỉ có hiệu lực
trong preparation hiện tại. Render expected/minimum quote theo metric status và
giữ `effectiveSlippageBps = 0` như một giá trị thật. Stop Copy total không có
aggregate slippage; không average từ các position. Khi qua `reprepareAfter`, qua
`liquidationConfigDeadline`, hoặc state liên quan đổi, bỏ preview và prepare lại.

## 7. Implementation boundary

Service đã khai báo đủ read và prepare API. Production write UI gọi mutation
thật, validate exact prepared call, submit qua connected wallet, đợi receipt và
refresh read model; không còn mock signer hoặc mock transaction-hash path.

Xem `IMPLEMENTATION_STATUS.md` để biết phần nào đã implement, E2E đã verify tới
đâu và các concern khi tích hợp API.
