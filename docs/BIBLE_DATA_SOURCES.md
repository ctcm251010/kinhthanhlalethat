# Nguồn dữ liệu Kinh Thánh và quyền sử dụng

## Kết luận hiện tại

Không scrape hoặc copy toàn văn Kinh Thánh từ `bible.com` hay `kinhthanh.httlvn.org` vào repository ở thời điểm này.

Lý do: ngày xuất bản “1925” không tự động chứng minh file chữ số hóa hiện tại là public domain. Website, bản dịch, hiệu đính, dữ liệu số và cách phân phối có thể có chủ sở hữu hoặc giấy phép riêng.

## Bible.com / YouVersion

- Trang VIE1925 trên Bible.com ghi publisher là **Bible Society Vietnam**.
- Chính sách copyright của YouVersion nói quyền thuộc về từng copyright holder; YouVersion không thể cấp cho bên khác quyền tái bản hoặc phân phối toàn bộ bản dịch.
- YouVersion Platform/API là một hướng kỹ thuật chính thức, nhưng phải đăng ký, chấp nhận thỏa thuận, tuân theo phạm vi non-commercial và attribution/giấy phép của từng Bible version. Việc có API không đồng nghĩa chắc chắn được phép tải và lưu toàn văn VIE1925 trong Git.

Nguồn tham khảo:

- `https://www.bible.com/vi/versions/193-vie1925-kinh-th%C3%A1nh-ti%E1%BA%BFng-vi%E1%BB%87t-1925`
- `https://help.youversion.com/l/en/article/o8t2xmy9q2-copyright`
- `https://help.youversion.com/l/en/article/72ghg45c41-how-to-sign-up-for-platform`
- `https://developers.youversion.com/sdks/javascript/guides/copyright-and-attribution`

## kinhthanh.httlvn.org

Trang reader ghi bản dịch phát hành năm 1925 nhưng đồng thời hiển thị dòng bản quyền `©1998 Thánh Kinh Hội giữ bản quyền và cấp phép sử dụng`. Vì vậy không xem đây là nguồn được phép sao chép hàng loạt nếu chưa có văn bản cấp phép.

Nguồn tham khảo:

- `https://kinhthanh.httlvn.org/?v=VI1934`

## Hướng được khuyến nghị

1. Liên hệ Bible Society Vietnam/Thánh Kinh Hội để xin giấy phép bằng văn bản và file dữ liệu gốc có cấu trúc. Đây là phương án tốt nhất nếu muốn host toàn văn lâu dài.
2. Hoặc đăng ký YouVersion Platform, đọc kỹ agreement và xác nhận VIE1925 có trong catalog được cấp cho ứng dụng này. Nếu chỉ được render qua API, không tải/commit dữ liệu vào Git ngoài phạm vi cache được cho phép.
3. Trong lúc chờ, chỉ dùng dữ liệu minh họa hiện tại, link người đọc sang nguồn chính thức hoặc trích dẫn ngắn có attribution theo đúng điều khoản.

Khi có quyền sử dụng, trước khi import cần lưu: tên bản dịch, chủ sở hữu, văn bản giấy phép, yêu cầu attribution, ngày nhận source, checksum file gốc và vài chương/câu mẫu để đối chiếu độc lập. Không dùng AI để tự sinh, dịch lại hoặc “điền” câu còn thiếu.
