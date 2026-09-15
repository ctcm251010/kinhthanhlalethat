# Mô hình dữ liệu

## Truth Topic

Mỗi topic là một file Markdown trong `src/content/truth-topics`.

| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `title` | string | Có | Tên hiển thị |
| `slug` | string | Có | Slug URL duy nhất |
| `description` | string | Có | Mô tả ngắn |
| `order` | integer | Có | Thứ tự hiển thị |
| `icon` | enum | Có | Icon nằm trong danh sách cho phép |
| `coverImage` | string | Không | Đường dẫn media |
| `featured` | boolean | Có | Hiển thị nổi bật ở trang chủ |
| `draft` | boolean | Có | Không xuất bản khi `true` |

## Truth Lesson

Mỗi lesson là một file Markdown hoặc MDX trong `src/content/truth-lessons`.

| Field | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `title` | string | Có | Tiêu đề bài |
| `slug` | string | Có | Slug trong topic |
| `description` | string | Có | Lead và mô tả card |
| `topic` | reference | Có | Tham chiếu entry của `truthTopics` |
| `publishedDate` | date | Có | Ngày xuất bản |
| `updatedDate` | date | Không | Ngày cập nhật |
| `author` | string | Không | Tác giả |
| `coverImage` | string | Không | Ảnh hero của bài; dùng ảnh mặc định của website nếu bỏ trống |
| `featured` | boolean | Có | Đánh dấu nổi bật |
| `draft` | boolean | Có | Loại khỏi site production khi `true` |
| `seoTitle` | string | Không | Ghi đè SEO title |
| `seoDescription` | string | Không | Ghi đè meta description |

Slug route được tạo từ `topic.data.slug` và `lesson.data.slug`. Schema Astro kiểm tra reference topic để giảm lỗi gõ sai trong source; Decap CMS dùng widget relation để chọn topic.

## Bible

Mỗi sách là một file JSON trong `src/data/bible`:

```json
{
  "book": "Tên sách",
  "slug": "ten-sach",
  "abbreviation": "TS",
  "testament": "old",
  "chapters": [
    {
      "chapter": 1,
      "verses": [
        { "verse": 1, "text": "Nội dung đã được xác minh nguồn" }
      ]
    }
  ]
}
```

Base version chỉ dùng ít dữ liệu minh họa được ghi rõ là bản mẫu, không tự bịa toàn bộ Kinh Thánh. Khi import bản 1925 cần xác minh bản quyền/nguồn, validate schema, slug và số thứ tự câu trước khi merge.

## Contact config

Thông tin Zalo, Telegram, email và endpoint form nằm trong `src/config/site.ts`. Giá trị base version là placeholder, không phải dữ liệu cá nhân hoặc secret.

## Database

Không có database và không có migration trong base version.

Việc kết nối GitHub repository không thay đổi content schema hoặc mô hình dữ liệu.
