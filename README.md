# Kinh Thánh Là Lẽ Thật

Base version cho website học, đọc và chia sẻ nội dung Kinh Thánh bằng tiếng Việt. Project dùng Astro static-first, TypeScript, Content Collections, Markdown/MDX, Decap CMS và Cloudflare Workers Static Assets.

> Nội dung bài học và dữ liệu Bible hiện chỉ dùng để kiểm tra kiến trúc/UI. Không xem dữ liệu mẫu là nội dung Kinh Thánh hoặc tuyên bố giáo lý.

## Yêu cầu môi trường

- Node.js 22.12 trở lên
- npm 10 trở lên
- Git

## Cài dependency

```bash
npm install
```

## Chạy local

```bash
npm run dev
```

Mặc định website chạy tại `http://localhost:4321`.

## Validation và build

```bash
npm run typecheck
npm run check
npm run build
npm run check:links
npm run preview
```

Output production nằm trong `dist/`.

## Cấu trúc project

```text
src/
  assets/                 Ảnh được Astro tối ưu
  components/             Component giao diện và MDX
  config/                 Site/contact config
  content/                Topic và lesson do Git quản lý
  data/bible/             JSON Book → Chapter → Verse
  layouts/                Base layout và article layout
  pages/                  Route Astro
  services/               Tích hợp dịch vụ, hiện có contact placeholder
  styles/                 Design tokens và global CSS
public/
  admin/                   Decap CMS
  uploads/                 Media do CMS quản lý
docs/                      Kiến trúc, data model, roadmap và vận hành
scripts/                   Validation bổ sung
```

## Thêm Topic thủ công

Tạo file `.md` trong `src/content/truth-topics`. Tên file nên giống `slug`:

```yaml
---
title: "Tên chủ đề"
slug: "ten-chu-de"
description: "Mô tả đủ rõ cho card và trang topic."
order: 4
icon: "compass"
featured: false
draft: true
---
```

`icon` chỉ nhận `compass`, `seedling` hoặc `lamp`. Chuyển `draft` thành `false` sau khi review.

## Thêm Lesson thủ công

Tạo file `.mdx` trong `src/content/truth-lessons`:

```yaml
---
title: "Tên bài học"
slug: "ten-bai-hoc"
description: "Mô tả ngắn của bài."
topic: "ten-chu-de"
publishedDate: 2026-09-15
author: "Ban biên tập"
featured: false
draft: true
---
```

`topic` phải trùng ID file của topic. Astro schema và `reference()` sẽ dừng build nếu tham chiếu sai.

## MDX components

Article renderer cung cấp sẵn bốn component:

```mdx
<YouTube id="VIDEO_ID" title="Tiêu đề video" />

<BibleQuote reference="Sách 1:1">
  Nội dung đã đối chiếu từ nguồn được phép sử dụng.
</BibleQuote>

<Callout title="Ghi chú" type="note">
  Nội dung cần nhấn mạnh.
</Callout>

<Figure src="/uploads/example.jpg" alt="Mô tả ảnh" caption="Chú thích ảnh" />
```

`type` của `Callout` nhận `note`, `important` hoặc `warning`. YouTube dùng domain tăng quyền riêng tư `youtube-nocookie.com` và chỉ chấp nhận video ID.

## Decap CMS

Chạy website và local CMS proxy ở hai terminal:

```bash
npm run dev
npm run cms
```

Mở `http://localhost:4321/admin/`. Cấu hình tại `public/admin/config.yml`; hướng dẫn OAuth chi tiết ở `docs/CMS_OAUTH.md`.

Media upload được commit vào `public/uploads` và dùng URL `/uploads/<file>`.

## GitHub và authentication

1. Tạo repository GitHub và push branch `main`.
2. Thay `YOUR_GITHUB_USER/YOUR_REPOSITORY` trong `public/admin/config.yml`.
3. Tạo GitHub OAuth App và OAuth proxy Cloudflare Worker.
4. Thay `base_url` bằng URL Worker; giữ client secret trong Cloudflare Worker Secrets.
5. Test `editorial_workflow` trên repository thử nghiệm trước khi cho tác giả sử dụng.

Không commit `.env`, API token, OAuth secret hoặc credential cá nhân.

## Import Kinh Thánh 1925 sau này

1. Xác minh nguồn, quyền sử dụng và checksum của bộ dữ liệu.
2. Chuyển mỗi sách thành một JSON đúng schema trong `docs/DATA_MODEL.md`.
3. Kiểm tra slug duy nhất, số chương tăng dần và số câu không trùng.
4. So sánh mẫu với nguồn gốc bằng kiểm tra thủ công độc lập.
5. Thay dữ liệu giữ chỗ, chạy toàn bộ validation và browser QA.

Không tự sinh câu Kinh Thánh bằng AI.

## Deploy Cloudflare Workers

### Deploy local bằng Wrangler

```bash
npm run deploy
```

Lần đầu Wrangler sẽ yêu cầu đăng nhập Cloudflare. File `wrangler.jsonc` deploy thư mục `dist` dưới dạng Static Assets và không chạy server-side Worker.

### Tự động deploy từ GitHub

1. Vào Cloudflare Dashboard → Workers & Pages → Create application → Import a repository.
2. Chọn GitHub repository.
3. Đặt Worker name trùng `kinh-thanh-la-le-that` trong `wrangler.jsonc`.
4. Production branch: `main`.
5. Build command: `npm run build`.
6. Deploy command: `npx wrangler deploy`.
7. Bật non-production branch builds để có preview URL nếu cần.
8. Cấu hình `PUBLIC_SITE_URL` bằng domain production; `robots.txt`, sitemap và canonical sẽ dùng giá trị này. Cập nhật riêng URL placeholder trong Decap config.

Sau deploy, làm smoke test theo `docs/TESTING.md`.

## Form liên hệ

Base version không có endpoint và không giả lập gửi thành công. Khi triển khai, cập nhật `contactFormEndpoint` trong `src/config/site.ts`, tạo Worker/API xử lý validation server-side, giới hạn tần suất, Turnstile và dịch vụ email. Quyết định này cần review riêng trước khi thêm dependency hoặc secret.
