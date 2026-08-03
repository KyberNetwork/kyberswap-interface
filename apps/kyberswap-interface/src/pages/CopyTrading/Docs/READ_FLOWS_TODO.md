# Copy Trading UI and Read Flows TODO

Lần cập nhật: 2026-08-03

## Scope

Mục tiêu hiện tại:

- Hoàn thiện UI của các màn Copy Trading.
- Hoàn thiện toàn bộ read flows dựa trên 24 GET operations đã có trong service.
- Xử lý đúng lifecycle, pagination, loading, error, empty và stale states.

Ngoài scope:

- Không tích hợp các prepare mutation.
- Không triển khai Wallet Session.
- Không broadcast transaction.
- Không sửa hoặc bật real mode trong `write/**`.
- Không hoàn thiện Start, Add Capital, Stop, Withdraw, Manual Sell hoặc Close
  Position write flow.

Nguồn contract:

- `Entities and Flows.md`: product flow và lifecycle.
- `FE_API_Catalog.md`: frontend API contract.
- `openapi.yaml`: schema và enum chính xác.
- `IMPLEMENTATION_STATUS.md`: coverage và gap hiện tại.

## P0 — Correctness của các read flow hiện tại

- [x] Fix performance query để `WINDOW_ALL` chỉ dùng `WEEK` hoặc `MONTH`;
      không gửi `WINDOW_ALL + DAY`.
- [x] Không dùng `isCopyRunClosed` để gộp `STOPPED` với `CLOSED` tại những UI
      cần lifecycle chính xác.
- [x] Render riêng `ACTIVE`, `CLOSING`, `STOPPED` và `CLOSED` của Copy Run.
- [x] Dùng `my-copies/:copyId` cho cả Open Copy Detail và Copy Smart Wallet:
      `ACTIVE`/`CLOSING` render Open Detail, `STOPPED` render Smart Wallet.
- [x] Nếu direct Copy Run dưới `my-copies/:copyId` đã là `CLOSED`, redirect
      canonical sang `history/:copyId`.
- [x] Render position theo API `lifecycle` và `quantityState`; không gộp
      `ACTIVE` với `CLOSING` cho logic hiển thị trạng thái.
- [x] Giữ Open và History là hai server-owned views; không tự filter hoặc chuyển
      row giữa hai view.
- [x] Xác nhận Open giữ run `STOPPED` khi còn position `ACTIVE`, `CLOSING` hoặc
      `LEFTOVER`; quote balance không phải điều kiện giữ run trong Open.
- [ ] Fail closed các action control theo advisory availability. Leaderboard
      Copy vẫn bỏ qua `startCopyAvailability`; Add Capital vẫn enable khi status
      missing/unspecified; Stop Copy vẫn xuất hiện cho mọi Open-view row, kể cả
      `CLOSING` hoặc `STOPPED`.
- [x] Type đầy đủ các activity detail variants và ngừng parse display summary để
      suy ra P&L hoặc business state.
- [x] Render generic `sell_unaligned` thành `Owner Sell`; giữ Stop Copy là
      lifecycle row không có amount và tách khỏi downstream execution/position.
- [x] Render metric/valuation `UNAVAILABLE` thành `—`, không đổi thành `0`.
- [x] Hiển thị indication riêng cho KPI có dữ liệu `STALE`.
- [x] Sửa label portfolio equity đang hiển thị thành
      `Assets Under Management ($)`.

## P0 — Loading và wallet states

- [x] Dùng logo loader khi vào Agent Profile và Copy Detail trong lúc detail API
      ban đầu chưa trả dữ liệu.
- [x] Không dùng logo loader cho background refetch, table, tab, chart hoặc
      Alerts Feed; giữ loading behavior hiện có tại các surface này.
- [x] Hiển thị dedicated disconnected-wallet state trên owner screens thay vì
      empty content.
- [x] Alerts Feed chỉ hiển thị `LIVE` khi có polling/refetch thực; nếu chưa có
      thì bỏ live indication.

## P1 — Cursor-backed infinite scroll

- [x] Dùng TanStack `useInfiniteQuery` để giữ page/cursor chain; RTK lazy query
      chỉ thực hiện request theo `pageParam`.
- [x] Giữ và truyền opaque `nextCursor`; không parse hoặc tự tạo cursor.
- [x] Reset cursor sequence khi route, owner, agent, chain, view, filter hoặc
      sort thay đổi.
- [x] Hoàn thiện infinite scroll cho qualification-ranked Agent Leaderboard.
- [ ] Hoàn thiện product surface và infinite scroll cho Agent discovery
      (`GET /agents`); không coi Leaderboard là cùng collection.
- [x] Hoàn thiện infinite scroll cho Agent Positions, History và Action Logs.
- [x] Hoàn thiện infinite scroll cho My Copies và Copy History.
- [x] Hoàn thiện infinite scroll cho Copy Run Positions.
- [x] Hoàn thiện infinite scroll cho Owner Activity / Alerts Feed.
- [x] Hoàn thiện ba cursor chain độc lập của Copy Smart Wallet: balances, open
      positions và account history.
- [ ] Hoàn thiện cursor chain cho Agent Performance và Copy Run Performance;
      hiện chart chỉ đọc page đầu với `limit=100`.
- [ ] Quyết định product cap hoặc theo cursor cho Sidebar Agents/Open Copies;
      hiện Sidebar dùng snapshot `limit=100`.
- [ ] Expose error/retry state cho infinite scroll. Cursor expired/rejected phải
      bỏ sequence cũ và restart từ page đầu với filter hiện tại.
- [x] Chỉ cho đi tiếp khi response hiện tại có opaque `nextCursor`; không cho
      nhảy tới cursor chưa được server trả.
- [x] Có end state rõ ràng khi `pagination.hasMore = false`.

## P1 — Hoàn thiện GET operations chưa có UI consumer

- [ ] Agent discovery (`GET /agents`); Leaderboard là collection khác.
- [ ] Agent position detail.
- [ ] Agent position events.
- [ ] All owner positions; không thêm bảng thứ hai vào màn Copy History hiện tại.
- [ ] Owner copy-account list.
- [x] Copy-account detail trong Copy Smart Wallet.
- [x] Copy-account balances trong Copy Smart Wallet.
- [x] Copy-account positions trong Copy Smart Wallet.
- [ ] Pending sell obligations ở chế độ read-only, không nối recovery action.
- [x] Copy-account history trong Copy Smart Wallet.

Các Copy Account reads thuộc nhánh `STOPPED` của route Copy Detail hiện có;
không thêm top-level collection route khi API chưa có owner view riêng cho
Smart Wallet.

## P2 — UI consistency và usability

- [x] Thêm `LEADERBOARD_SORT_FIELD_OPEN_POSITIONS` vào type, mapping và table
      header.
- [x] Hiển thị đầy đủ strategy categories có thể overlap thay vì chỉ một badge.
- [x] Dùng canonical `agentId` để xác định active agent trong Sidebar; không
      match bằng display name.
- [x] Debounce leaderboard/agent search.
- [ ] Tách loading và error state của hai performance series.
- [ ] Kiểm tra responsive layout cho tables, tabs, side panels và charts.
- [ ] Chuẩn hóa date, token amount, USD, percentage và unavailable formatting.
- [ ] Đảm bảo keyboard focus, accessible label và disabled state cho filter,
      infinite scroll và expandable rows.

## Verification cho từng nhóm thay đổi

- [x] Đối chiếu request params và response fields với `openapi.yaml`.
- [x] Đối chiếu thêm runtime validation khi generated OpenAPI chưa thể hiện đủ;
      owner `copy-summary` và `copy-runs` trả HTTP 400 nếu thiếu `view` dù
      generated parameter đang ghi optional.
- [x] Chạy TypeScript check của app.
- [x] Chạy ESLint cho các file Copy Trading đã đổi.
- [x] Chạy Prettier và `git diff --check`.
- [x] Browser smoke test Agent Profile, `WINDOW_ALL`, stale badge, Open Positions
      sort và disconnected-wallet state.
- [ ] Browser test Copy Detail và cursor qua nhiều page với connected test
      wallet.
- [ ] Test Open/History bằng server response, không bằng local status filtering.
- [ ] Test pagination qua ít nhất hai cursor pages khi live data cho phép.
- [x] Xác nhận không có prepare mutation hoặc transaction nào được gọi.
- [x] Cập nhật `IMPLEMENTATION_STATUS.md` sau mỗi nhóm được hoàn tất.

## Definition of Done

Read UI được xem là hoàn thiện khi:

1. Mỗi GET operation trong scope có owner UI rõ ràng hoặc được ghi nhận là không
   cần consumer.
2. Lifecycle và availability được render từ typed API fields.
3. Detail page có initial logo loader; các surface khác giữ loading/error/empty
   behavior đã được chấp nhận và owner screen có disconnected-wallet state.
4. Mọi cursor collection cần thiết có page chain phù hợp bằng
   `useInfiniteQuery`, giữ opaque cursor đúng contract và có recoverable
   error/restart behavior. Chart có thể tự gom page thay vì render scroll
   container.
5. Không còn parsing display text cho business logic.
6. Không có thay đổi hoặc side effect nào tới write flows.
