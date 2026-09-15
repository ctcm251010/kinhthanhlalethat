# Decap CMS và GitHub OAuth

## Trạng thái hiện tại

`/admin/` đã có Decap CMS, collection Topic/Lesson, media upload và `editorial_workflow`. GitHub backend trỏ tới `ctcm251010/kinhthanhlalethat`; website và CMS hiện dùng:

- Website: `https://kinh-thanh-la-le-that.ctcm251010.workers.dev`
- OAuth Worker: `https://kinh-thanh-la-le-that-oauth.ctcm251010.workers.dev`
- Callback: `https://kinh-thanh-la-le-that-oauth.ctcm251010.workers.dev/callback`

Mã Worker và cấu hình Decap đã hoàn tất. GitHub OAuth App, hai Worker secrets và deployment thật vẫn cần được tạo trong tài khoản GitHub/Cloudflare của chủ dự án.

## Kiến trúc và phạm vi quyền

Decap mở OAuth Worker trong popup. Worker tạo `state`, PKCE verifier/challenge bằng Web Crypto, lưu state/verifier trong cookie `HttpOnly`, chuyển người dùng sang GitHub, đổi authorization code lấy token rồi kiểm tra tài khoản có quyền push vào đúng repository. Token chỉ được gửi về đúng origin CMS bằng `window.postMessage`; Worker không lưu hoặc log token.

Repository đang public nên OAuth App chỉ xin scope `public_repo`. Scope này vẫn áp dụng cho mọi public repository mà tài khoản GitHub đó có quyền, vì GitHub OAuth App không hỗ trợ giới hạn token vào duy nhất một repository. Worker giảm rủi ro bằng cách chỉ cho đăng nhập CMS thành công khi GitHub xác nhận quyền push vào `ctcm251010/kinhthanhlalethat`.

Worker không có database, KV, Durable Object hay dependency runtime. `nodejs_compat` không được bật vì code chỉ dùng Web Platform APIs.

## 1. Tạo GitHub OAuth App

1. Mở GitHub → avatar → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. Nhập **Application name**: `Kinh Thánh Là Lẽ Thật CMS`.
3. Nhập **Homepage URL**: `https://kinh-thanh-la-le-that.ctcm251010.workers.dev`.
4. Nhập **Authorization callback URL** chính xác: `https://kinh-thanh-la-le-that-oauth.ctcm251010.workers.dev/callback`.
5. Chọn **Register application** rồi tạo Client secret.
6. Sao chép Client ID và Client secret để nhập trực tiếp vào Cloudflare. Không gửi secret qua chat, không chụp màn hình công khai và không ghi vào Git.

Có thể giữ access-token expiration mặc định. Khi token hết hạn, editor đăng nhập GitHub lại; Worker không lưu refresh token.

## 2. Deploy OAuth Worker bằng Cloudflare Builds

Tạo một Worker/Build riêng cho OAuth, không thay project website hiện tại:

1. Cloudflare Dashboard → **Workers & Pages** → **Create application** → import repository `ctcm251010/kinhthanhlalethat`.
2. **Project name**: `kinh-thanh-la-le-that-oauth`.
3. **Production branch**: `main`.
4. **Build command**: để trống.
5. **Deploy command**:

   ```bash
   npx wrangler deploy --config workers/decap-oauth/wrangler.jsonc
   ```

6. Không bật **Cloudflare Access** vì popup phải đi qua GitHub OAuth; quyền editor được kiểm soát bởi GitHub repository.
7. Có thể tắt build cho non-production branches của Worker OAuth để tránh preview origin không nằm trong OAuth allowlist.

Nếu muốn deploy từ máy local, chạy:

```bash
npx wrangler login
npm run oauth:deploy
```

## 3. Nhập secrets

Trong Worker `kinh-thanh-la-le-that-oauth`, mở **Settings** → **Variables and Secrets** → **Add** và chọn loại **Secret** cho cả hai giá trị:

- `GITHUB_CLIENT_ID`: Client ID của OAuth App.
- `GITHUB_CLIENT_SECRET`: Client secret của OAuth App.

Hoặc nhập bằng Wrangler, từng lệnh sẽ hỏi giá trị mà không ghi vào file:

```bash
npx wrangler secret put GITHUB_CLIENT_ID --config workers/decap-oauth/wrangler.jsonc
npx wrangler secret put GITHUB_CLIENT_SECRET --config workers/decap-oauth/wrangler.jsonc
```

Sau khi thêm hoặc đổi secret, deploy lại Worker nếu Cloudflare yêu cầu.

## 4. Cấp quyền editor

Chỉ tài khoản GitHub có quyền push vào repository mới đăng nhập thành công. Với editor khác, vào GitHub repository → **Settings** → **Collaborators** → mời tài khoản đó với quyền phù hợp. Không cấp `Admin` nếu chỉ cần biên tập nội dung.

## 5. Smoke test production

1. Mở `https://kinh-thanh-la-le-that-oauth.ctcm251010.workers.dev/health`; phải nhận JSON có `status: "ok"`.
2. Mở `https://kinh-thanh-la-le-that.ctcm251010.workers.dev/admin/` trong cửa sổ ẩn danh.
3. Chọn đăng nhập GitHub, kiểm tra màn hình chỉ xin scope liên quan public repository.
4. Tạo một bài có `draft: true`, lưu và kiểm tra branch/pull request do `editorial_workflow` tạo.
5. Mở preview build, duyệt bài, publish rồi kiểm tra commit vào `main` kích hoạt Cloudflare build website.
6. Đăng nhập bằng tài khoản không có quyền push để xác nhận Worker từ chối.

## Validation local

```bash
npm run oauth:check
```

Lệnh này tạo lại Env types từ `wrangler.jsonc`, typecheck Worker và chạy test giả lập state/PKCE, quyền repository cùng callback của Decap. Có thể kiểm tra bundle mà không deploy bằng:

```bash
npx wrangler deploy --dry-run --config workers/decap-oauth/wrangler.jsonc
```

## Local CMS

Chạy hai terminal:

```bash
npm run dev
npm run cms
```

Sau đó mở `http://localhost:4321/admin/`. `local_backend: true` dùng Decap Proxy ở local và không cần GitHub OAuth. Local backend không mô phỏng đầy đủ `editorial_workflow`, vì vậy vẫn phải smoke test luồng thật trên production.

## Khi chuyển sang custom domain

Cần cập nhật đồng bộ bốn nơi rồi deploy lại:

1. `CMS_ORIGIN` và `OAUTH_ORIGIN` trong `workers/decap-oauth/wrangler.jsonc`.
2. Homepage URL và callback URL của GitHub OAuth App.
3. `base_url`, `site_url`, `display_url` trong `public/admin/config.yml`.
4. `PUBLIC_SITE_URL` trong Cloudflare Builds của website.

Sai khác dù chỉ ở protocol, host hoặc callback path có thể làm OAuth thất bại.

## MDX trong editor

Decap Markdown editor hỗ trợ paragraph, heading, bold, italic, list, link và blockquote. `editor-components.js` đăng ký component tối thiểu cho `YouTube` và `BibleQuote`. `Callout` và `Figure` có thể viết trong chế độ Raw theo cú pháp MDX; không paste HTML/inline style từ Word.
