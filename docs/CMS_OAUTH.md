# Decap CMS và GitHub OAuth

## Trạng thái hiện tại

`/admin/` đã có giao diện Decap CMS, collection cho Topic/Lesson, media upload và `editorial_workflow`. Cấu hình production đang dùng placeholder; chưa có OAuth credential và chưa có Worker xác thực.

Các placeholder phải thay trước production:

- `YOUR_GITHUB_USER/YOUR_REPOSITORY`
- `https://YOUR-OAUTH-WORKER.YOUR-SUBDOMAIN.workers.dev`
- `https://example.com`

## Kiến trúc đã chọn

Decap dùng `github` backend. Trình duyệt mở OAuth proxy trên Cloudflare Worker; Worker chuyển người dùng sang GitHub OAuth và đổi authorization code lấy access token. `GITHUB_CLIENT_SECRET` chỉ tồn tại dưới dạng Worker secret, không nằm trong repository hoặc JavaScript phía trình duyệt.

Base version chỉ mô tả kiến trúc này. Không scaffold mã OAuth từ một template cộng đồng khi chưa review dependency, quyền GitHub và domain production.

## Cấu hình production đề xuất

1. Tạo GitHub OAuth App trong phần Developer settings.
2. Đặt Homepage URL là domain website.
3. Đặt Authorization callback URL là `https://<oauth-worker-domain>/callback`.
4. Deploy OAuth proxy đã được review lên Cloudflare Worker.
5. Lưu client ID bằng Worker variable và client secret bằng `wrangler secret put`; không ghi chúng vào file.
6. Cập nhật `repo`, `base_url`, `site_url`, `display_url` và `logo_url` trong `public/admin/config.yml`.
7. Chỉ cấp quyền push repository cho tác giả được phép xuất bản.
8. Kiểm tra login, tạo draft, pull request, preview build, approve và publish.

## Local CMS

Chạy hai terminal:

```bash
npm run dev
npm run cms
```

Sau đó mở `http://localhost:4321/admin/`. `local_backend: true` sẽ dùng Decap Proxy ở local và không cần GitHub OAuth. Local backend không mô phỏng đầy đủ `editorial_workflow`; cần smoke test lại workflow trên repository thử nghiệm trước production.

## MDX trong editor

Decap Markdown editor hỗ trợ paragraph, heading, bold, italic, list, link và blockquote. `editor-components.js` đăng ký component tối thiểu cho `YouTube` và `BibleQuote`.

`Callout` và `Figure` vẫn có thể được viết trong chế độ Raw theo cú pháp MDX. Không paste HTML/inline style từ Word; chỉ giữ cấu trúc semantic rồi áp dụng style từ website.
