/**
 * GOOGLE APPS SCRIPT - HỆ THỐNG LƯU ĐIỂM TỰ ĐỘNG KHTN 9
 * Bài 22: Giới thiệu về hợp chất hữu cơ
 * Giáo viên: Lê Văn Thắng - Trường TH & THCS Phước Hưng
 *
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Mở Google Sheets mới (https://sheets.new)
 * 2. Chọn Tiện ích mở rộng (Extensions) -> Apps Script
 * 3. Xóa mã mặc định, dán toàn bộ mã này vào và nhấn Lưu (Ctrl+S)
 * 4. Nhấn Triển khai (Deploy) -> Tùy chọn triển khai mới (New deployment)
 * 5. Chọn loại: Ứng dụng web (Web app)
 *    - Thực thi dưới dạng (Execute as): Tôi (Me)
 *    - Ai có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 * 6. Nhấn Triển khai (Deploy), cấp quyền và sao chép URL Ứng dụng Web (Web App URL)
 * 7. Dán URL đó vào phần "⚙️ Google Sheet" trên Website học tập.
 */

const SHEET_NAME = 'KetQua_Bai22_KHTN9';

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

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
        .setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }

    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      payload = e.parameter;
    }

    const timestamp = new Date();
    const formattedTime = Utilities.formatDate(timestamp, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');

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
