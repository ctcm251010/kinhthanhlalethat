# Lộ trình

## Phase 1 — Base version (hoàn thành ngày 15/09/2026)

- [x] Khởi tạo Astro/TypeScript static-first.
- [x] Thiết lập design tokens, layout, header và footer responsive.
- [x] Xây trang chủ và các route nội dung chính.
- [x] Thiết lập Content Collections cho Truth Topic và Truth Lesson.
- [x] Tạo dữ liệu mẫu trung tính để kiểm tra layout.
- [x] Xây Bible Reader từ dữ liệu JSON mẫu.
- [x] Tạo article reader và MDX components.
- [x] Cấu hình Decap CMS tại `/admin/`.
- [x] Thêm SEO cơ bản, sitemap, robots và trang 404.
- [x] Chuẩn bị Cloudflare Workers Static Assets/Workers Builds.
- [x] Viết README vận hành và tài liệu OAuth/deploy.
- [x] Chạy typecheck, Astro check, production build và browser QA.

## Phase 2 — Nội dung và tích hợp production

- [ ] Cung cấp tên miền, URL canonical và thông tin contact thật.
- [x] Kết nối GitHub repository `ctcm251010/kinhthanhlalethat` và push branch `main`.
- [ ] Phân quyền repository cho editor được phép xuất bản.
- [ ] Tạo GitHub OAuth App và deploy OAuth proxy trên Cloudflare.
- [ ] Kết nối Workers Builds với GitHub, bật preview builds và custom domain.
- [ ] Import dữ liệu Kinh Thánh 1925 từ nguồn đã xác minh.
- [ ] Kết nối form liên hệ với Cloudflare Worker/Email Service và Turnstile.

## Phase 3 — Mở rộng có kiểm chứng

- [ ] Tìm kiếm nội dung và câu Kinh Thánh.
- [ ] Copy/chia sẻ câu Kinh Thánh.
- [ ] Bookmark cục bộ hoặc đồng bộ nếu sau này có nhu cầu tài khoản.
- [ ] Theo dõi Web Vitals và tối ưu từ dữ liệu thực tế.

Các tính năng phase sau chỉ được triển khai khi có yêu cầu và quyết định rõ về dữ liệu, bảo mật, dependency và chi phí vận hành.
