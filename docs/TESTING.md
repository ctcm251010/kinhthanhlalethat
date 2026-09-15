# Hướng dẫn kiểm thử

## Validation tự động

```bash
npm run typecheck
npm run check
npm run build
npm run check:links
```

## Smoke test bằng trình duyệt

Kiểm tra ở desktop, tablet và mobile:

1. Header sticky, active navigation và menu hamburger dùng được bằng bàn phím.
2. Trang chủ hiển thị topic/lesson từ Content Collections.
3. `/kinh-thanh/` đổi sách, đổi chương, đi chương trước/sau.
4. `/le-that/` dẫn đến topic, lesson và breadcrumb đúng.
5. Article có một H1 phủ trên ảnh hero, thân bài một cột dễ đọc, component MDX, related và previous/next; ảnh mặc định và `coverImage` riêng đều không gây layout shift hoặc tràn ngang.
6. `/lien-he/` báo rõ form chưa kết nối, không hiển thị gửi thành công giả.
7. `/admin/` tải Decap CMS, đọc đúng `config.yml` và local backend.
8. Route không tồn tại trả trang 404.

## Kiểm thử production sau deploy

- Mở domain production bằng cửa sổ ẩn danh.
- Kiểm tra canonical, sitemap và robots dùng đúng domain.
- Kiểm tra một preview build từ branch khác `main`.
- Đăng nhập CMS, tạo draft thử nghiệm, publish và xác nhận Workers Builds rebuild site.
- Xóa nội dung thử nghiệm sau khi smoke test.

## Kết quả base version — 15/09/2026

- `npm run typecheck`: đạt.
- `npm run check`: đạt, 0 error/0 warning/0 hint.
- `npm run build`: đạt, sinh 21 page/endpoint static.
- `npm run check:links`: đạt, kiểm tra 21 file HTML và không có link nội bộ thiếu đích.
- `wrangler deploy --dry-run`: đạt, đọc 54 static asset, không có binding/backend.
- `npm audit --omit=dev`: 0 vulnerability cho production dependency.
- Browser QA bằng Chrome headless tại 1440px và mobile emulation 390px: không có horizontal overflow trên các route đại diện; mỗi trang công khai có đúng một H1.
- Menu hamburger mở được; selector chương điều hướng từ chương 1 sang chương 2; hero image tải thành công.
- Form liên hệ với dữ liệu test chỉ hiển thị cảnh báo “chưa kết nối”, không gửi request ra ngoài và không báo thành công giả.
- Decap local backend tải đủ hai collection, ba topic mẫu và các field editor.

Dev dependency `decap-server` hiện kéo theo advisory prototype pollution mức thấp trong `@hapi/joi` và chưa có bản sửa upstream. Dependency này chỉ dùng cho CMS proxy ở local, không nằm trong output production; cần kiểm tra lại khi Decap phát hành bản cập nhật.

## Kết quả làm mới layout bài “Lẽ Thật” — 15/09/2026

- `npm run typecheck`: đạt.
- `npm run check`: đạt, 0 error/0 warning/0 hint.
- `npm run build`: đạt, sinh 21 page/endpoint và các kích thước WebP tối ưu cho ảnh hero.
- `npm run check:links`: đạt, không có internal link bị thiếu.
- Browser QA tại desktop và viewport gọn 500px: ảnh hero, tiêu đề, metadata, nội dung một cột, menu mobile và BibleQuote không tràn ngang; tiêu đề vẫn dễ đọc trên nền ảnh.
