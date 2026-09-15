# Kiến trúc hệ thống

## Tổng quan

Website sử dụng Astro với TypeScript ở chế độ static site generation (SSG). Nội dung được lưu trong Git và sinh thành HTML tại thời điểm build. Base version không có database, tài khoản độc giả hay backend riêng.

Source code được lưu tại `https://github.com/ctcm251010/kinhthanhlalethat` trên branch production `main`.

Luồng xuất bản dự kiến:

1. Tác giả đăng nhập Decap CMS tại `/admin/`.
2. Decap CMS tạo hoặc cập nhật file nội dung trong GitHub repository.
3. Với `editorial_workflow`, bản nháp được quản lý bằng branch và pull request.
4. Cloudflare Workers Builds nhận commit trên nhánh `main`, chạy build Astro và deploy thư mục `dist` dưới dạng Static Assets.

## Các lớp chính

- `src/pages`: các route Astro, ưu tiên prerender hoàn toàn.
- `src/layouts`: layout chung và layout đọc bài.
- `src/components`: component giao diện và MDX có thể tái sử dụng.
- `src/content.config.ts`: schema có validation cho topic và lesson.
- `src/content`: nội dung Markdown/MDX được Git quản lý.
- `src/data/bible`: dữ liệu Kinh Thánh theo cấu trúc Book → Chapter → Verse.
- `src/config`: thông tin site và contact placeholder tập trung.
- `src/styles`: design tokens và stylesheet dùng chung.
- `public/admin`: Decap CMS và cấu hình collection.
- `public/uploads`: media do CMS quản lý.

## Quyết định kỹ thuật

- Dùng Astro thuần, không thêm React/Vue/Svelte.
- Dùng Content Collections và Zod để metadata có schema rõ ràng.
- Dùng MDX chỉ cho lesson cần component giàu nội dung; Markdown thường vẫn được hỗ trợ.
- Menu mobile dùng HTML/CSS và JavaScript tối thiểu, không hydrate framework.
- Bible Reader đọc JSON qua module dữ liệu, không nhúng toàn bộ nội dung vào component.
- Form liên hệ hiện chỉ là UI, không hiển thị trạng thái gửi thành công giả. Endpoint được để trống trong config cho phase sau.
- Decap CMS dùng GitHub backend và đã trỏ tới repository `ctcm251010/kinhthanhlalethat`; OAuth proxy Cloudflare Worker chỉ được mô tả, chưa triển khai hoặc lưu secret.
- Deploy dùng Cloudflare Workers Static Assets với Git integration; không cần Astro Cloudflare adapter vì toàn bộ route được prerender.

## Bảo mật và vận hành

- Không commit OAuth client secret, API token hay thông tin liên hệ cá nhân.
- `/admin/` có `noindex` và chỉ tải Decap CMS từ CDN được ghim major version.
- Decap chỉ cho phép các field và media path đã định nghĩa.
- Nội dung Word được chuyển thành semantic Markdown; không lưu inline style tùy ý.
- Form liên hệ sẽ cần validation server-side và Turnstile khi có endpoint thật.

## Giới hạn base version

- Chưa có dữ liệu Kinh Thánh 1925 đầy đủ.
- Chưa có tìm kiếm, bookmark, copy/chia sẻ câu Kinh Thánh.
- Chưa có backend gửi form.
- Chưa có GitHub OAuth App, OAuth Worker hay credential production.
