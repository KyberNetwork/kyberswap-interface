# Entities and Flows

Lần cập nhật: 2026-07-31

Tài liệu này là bản đọc nhanh để hiểu entity, lifecycle và user flow của Copy
Trading. Chi tiết endpoint/schema nằm trong `FE_API_Catalog.md` và
`openapi.yaml`; trạng thái code thực tế nằm trong `IMPLEMENTATION_STATUS.md`.

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

| Status    | Ý nghĩa                                                                                |
| --------- | -------------------------------------------------------------------------------------- |
| `ACTIVE`  | Đang copy Agent. Có thể Add Capital hoặc Stop Copy nếu availability cho phép.          |
| `CLOSING` | Stop hoặc position exit đang xử lý. Không gửi lại action cũ; chờ API hội tụ.           |
| `STOPPED` | Generation đã ngừng copy nhưng có thể còn quote balance hoặc settlement chưa hoàn tất. |
| `CLOSED`  | Run đã settle và hiện được API trả trong History.                                      |

Live API từng trả `STOPPED` trong Open rồi sau đó trả cùng Copy Run dưới History
với status `CLOSED`. Vì vậy frontend không tự đổi lifecycle hoặc chuyển row giữa
Open và History; cả status và view đều do server quyết định.

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
→ Copy Run/Position chuyển qua CLOSING hoặc STOPPED
→ Chờ position exit và settlement
→ Withdraw quote balance nếu prepare cho phép
→ API trả Copy Run CLOSED trong History
```

### Start Copy

Start Copy có thể cần hai transaction:

```text
Tạo một UUIDv4 startRequestId
→ prepare: CREATE_REQUIRED
→ gửi exact Create call
→ đợi receipt và API hội tụ
→ prepare lại với cùng UUID và target: FUNDING_REQUIRED
→ gửi exact Fund call
→ đợi receipt và prepare lại
→ COMPLETED / Copy Run ACTIVE
```

Minimum, quote token và wallet balance lấy từ response prepare. Một generation
mới phải dùng UUID mới; không tái sử dụng Copy Run cũ.

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

## 5. Prepared-action flow

Mọi write action dùng cùng safety boundary:

```text
Read availability
→ Refresh direct entity/account/position
→ Gọi prepare endpoint
→ Kiểm tra status, reason, preview và exact call
→ Validate account, chain, call kind, target, value và deadline
→ Gửi call.to / call.data / call.valueRaw nguyên trạng
→ Đợi receipt thành công
→ Poll đến khi read model hội tụ
→ Refetch list, summary và detail liên quan
```

| Prepared status       | Frontend behavior                                              |
| --------------------- | -------------------------------------------------------------- |
| `READY`               | Validate và gửi exact call.                                    |
| `PARTIALLY_COMPLETED` | Gửi stage hiện tại của Start Copy, đợi hội tụ rồi prepare lại. |
| `COMPLETED`           | Không gửi transaction; refresh reads và kết thúc flow.         |
| `PENDING`             | Không gửi; chờ `reprepareAfter` rồi prepare lại.               |
| `UNAVAILABLE`         | Không gửi; hiển thị typed reason.                              |

Không ABI-encode, rebuild hoặc chỉnh sửa calldata từ preview. Wallet Session chỉ
authorize preparation cho Manual Sell/Close Position; nó không submit
transaction.

## 6. Implementation boundary

Service đã khai báo đủ read và prepare API, nhưng write UI hiện tại vẫn là mock
prototype và chưa gọi mutation hook thật. Không được bật real mode chỉ bằng cách
đổi mock flag.

Xem `IMPLEMENTATION_STATUS.md` để biết phần nào đã implement, E2E đã verify tới
đâu và các concern khi tích hợp API.
