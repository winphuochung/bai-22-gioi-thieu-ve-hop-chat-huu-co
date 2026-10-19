/**
 * GOOGLE APPS SCRIPT - HỆ THỐNG LƯU ĐIỂM TỰ ĐỘNG KHTN 9
 * Bài 22: Giới thiệu về hợp chất hữu cơ (Chương VII - Kết nối tri thức)
 * Giáo viên: Lê Văn Thắng - Trường TH & THCS Phước Hưng
 *
 * HƯỚNG DẪN CÀI ĐẶT TRÊN GOOGLE SHEETS:
 * 1. Mở một bảng tính Google Sheets mới (https://sheets.new)
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script
 * 3. Xóa đoạn mã mặc định trong tệp Code.gs, dán toàn bộ mã dưới đây vào và nhấn Lưu (Ctrl + S)
 * 4. Nhấn nút "Triển khai" (Deploy) ở góc trên bên phải -> "Tùy chọn triển khai mới" (New deployment)
 * 5. Nhấn biểu tượng bánh răng (Chọn loại) -> Chọn "Ứng dụng web" (Web app):
 *    - Mô tả: Lưu điểm Bài 22 KHTN 9
 *    - Thực thi dưới dạng (Execute as): Tôi (Me)
 *    - Ai có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 * 6. Nhấn "Triển khai" (Deploy) -> Cấp quyền truy cập (Authorize access -> Advanced -> Go to project)
 * 7. Sao chép đường dẫn "URL ứng dụng web" (Web App URL, có đuôi .../exec)
 * 8. Mở trang web học tập -> Nhấn nút "⚙️ Google Sheet" trên thanh công cụ -> Dán URL vào và nhấn "Lưu URL kết nối"
 */

const SHEET_NAME = 'KetQua_Bai22_KHTN9';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Chống xung đột khi cả lớp nộp bài cùng lúc

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Tự động tạo trang tính và định dạng tiêu đề nếu chưa có
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = [
        'Thời gian nộp',
        'Họ và tên học sinh',
        'Lớp',
        'Tổng điểm (/100)',
        'Xếp loại / Danh hiệu',
        'Điểm TN Nhiều lựa chọn (10 câu - /20)',
        'Điểm TN Đúng/Sai (10 câu - /20)',
        'Điểm TN Trả lời ngắn (10 câu - /20)',
        'Điểm TN Ghép cột (10 câu - /20)',
        'Điểm Tự luận (4 câu - /20)',
        'Thời gian làm bài (giây)',
        'Bài làm Tự luận (4 câu × 5đ)',
        'Chi tiết đáp án (JSON)'
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#831843')
        .setFontColor('#FFFFFF')
        .setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }

    // Đọc dữ liệu JSON gửi từ Website Bài 22
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const timestamp = new Date();
    const formattedTime = Utilities.formatDate(
      timestamp,
      'Asia/Ho_Chi_Minh',
      'dd/MM/yyyy HH:mm:ss'
    );

    const rowData = [
      formattedTime,
      payload.studentName || 'Chưa rõ',
      payload.studentClass || 'Chưa rõ',
      Number(payload.totalScore || 0),
      payload.badgeTitle || '',
      Number(payload.mcqScore || 0),
      Number(payload.tfScore || 0),
      Number(payload.shortScore || 0),
      Number(payload.matchScore || 0),
      Number(payload.essayScore || 0),
      Number(payload.durationSeconds || 0),
      payload.essaySummary || '',
      payload.detailsJson || ''
    ];

    sheet.appendRow(rowData);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Đã lưu kết quả Bài 22 KHTN 9 thành công vào Google Sheets!',
        recordedAt: formattedTime
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      service: 'Hệ thống chấm điểm KHTN 9 - Bài 22: Giới thiệu về hợp chất hữu cơ'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
