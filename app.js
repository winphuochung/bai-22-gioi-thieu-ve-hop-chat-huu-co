/* ==========================================================================
   APP.JS - LOGIC HỌC LIỆU SỐ TƯƠNG TÁC KHTN 9
   Bài 22: Giới thiệu về hợp chất hữu cơ (Chương VII - Kết nối tri thức)
   ========================================================================== */

const STORAGE_KEYS = {
  STUDENT: 'khtn9_bai22_student',
  GAS_URL: 'khtn9_bai22_gas_url',
  PROGRESS: 'khtn9_bai22_progress',
  EXAM_DRAFT: 'khtn9_bai22_exam_draft'
};

// Mặc định URL Google Apps Script (Giáo viên có thể cập nhật trực tiếp tại đây hoặc qua nút ⚙️ Google Sheet)
const DEFAULT_GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxWPgjCoHP3EMGuhPSGGz2hGazho0kurPczJq-du3khRafjnGHfc8HXVmTwUUkuY4EVAw/exec';

const state = {
  studentName: '',
  studentClass: '',
  xp: 0,
  completedMilestones: new Set(),
  examStartTime: Date.now(),
  isExamSubmitted: false,
  act1Solved: new Set(),
  act2Solved: new Set(),
  act3Solved: new Set()
};

/* ==========================================================================
   TIỆN ÍCH ĐỊNH DẠNG CÔNG THỨC HÓA HỌC
   ========================================================================== */
function formatChemHTML(str) {
  if (!str) return '';
  return str;
}

function normalizeVietnameseText(str) {
  return (str || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/* ==========================================================================
   QUẢN LÝ TIẾN ĐỘ HỌC TẬP (0% -> 100%) & ĐIỂM XP
   ========================================================================== */
const TOTAL_MILESTONES = 10;
// Các mốc tiến độ:
// 1. login_done
// 2. warmup_fig22
// 3. warmup_quiz
// 4. mod1_quick
// 5. mod2_condensed
// 6. mod3_na_lab
// 7. act1_done
// 8. act2_done
// 9. act3_done
// 10. exam_submitted / lesson_completed

function markMilestone(key, xpReward = 10) {
  if (!state.completedMilestones.has(key)) {
    state.completedMilestones.add(key);
    state.xp += xpReward;
    updateHudProgress();
  }
}

function updateHudProgress() {
  const count = state.completedMilestones.size;
  const percent = Math.min(100, Math.round((count / TOTAL_MILESTONES) * 100));
  const percentText = document.getElementById('progress-percent-text');
  const barFill = document.getElementById('progress-bar-fill');
  const xpCounter = document.getElementById('xp-counter');

  if (percentText) percentText.textContent = `${percent}%`;
  if (barFill) barFill.style.width = `${percent}%`;
  if (xpCounter) xpCounter.textContent = state.xp;
}

/* ==========================================================================
   1. CỔNG ĐĂNG NHẬP HỌC SINH (LOGIN GATE)
   ========================================================================== */
function initLoginSystem() {
  const loginScreen = document.getElementById('login-screen');
  const mainApp = document.getElementById('main-app');
  const loginForm = document.getElementById('login-form');
  const nameInput = document.getElementById('student-name-input');
  const classInput = document.getElementById('student-class-input');
  const errorMsg = document.getElementById('login-error-msg');
  const logoutBtn = document.getElementById('logout-btn');

  // Nút chọn nhanh lớp 9A1 -> 9A5
  document.querySelectorAll('.class-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.class-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      classInput.value = chip.getAttribute('data-class') || '';
    });
  });

  // Kiểm tra phiên đăng nhập đã lưu
  const saved = localStorage.getItem(STORAGE_KEYS.STUDENT);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.studentName && parsed.studentClass) {
        enterMainApp(parsed.studentName, parsed.studentClass);
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEYS.STUDENT);
    }
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const sName = nameInput.value.trim();
    const sClass = classInput.value.trim().toUpperCase();

    if (!sName || !sClass) {
      errorMsg.classList.remove('hidden');
      return;
    }

    errorMsg.classList.add('hidden');
    localStorage.setItem(
      STORAGE_KEYS.STUDENT,
      JSON.stringify({ studentName: sName, studentClass: sClass })
    );
    enterMainApp(sName, sClass);
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.STUDENT);
    mainApp.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    nameInput.value = '';
    classInput.value = '';
  });

  function enterMainApp(sName, sClass) {
    state.studentName = sName;
    state.studentClass = sClass;
    state.examStartTime = Date.now();

    document.getElementById('display-student-name').textContent = sName;
    document.getElementById('display-student-class').textContent = sClass;
    document.getElementById('exam-student-name').textContent = sName;
    document.getElementById('exam-student-class').textContent = sClass;

    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    markMilestone('login_done', 10);
  }
}

/* ==========================================================================
   2. SECTION 1: KHỞI ĐỘNG (WARM-UP) - HÌNH 22.1 SGK
   ========================================================================== */
function initWarmupSection() {
  const figCards = document.querySelectorAll('.fig22-card');
  const revealAllBtn = document.getElementById('reveal-all-fig22-btn');

  const detailsMap = {
    butane: '✅ Phân tử Butane (C<sub>4</sub>H<sub>10</sub>) gồm 2 nguyên tố: Carbon (C) và Hydrogen (H). Có mặt nguyên tố CARBON!',
    alcohol: '✅ Phân tử Ethylic alcohol (C<sub>2</sub>H<sub>5</sub>OH) gồm 3 nguyên tố: Carbon (C), Hydrogen (H), Oxygen (O). Có mặt nguyên tố CARBON!',
    acetic: '✅ Phân tử Acetic acid (CH<sub>3</sub>COOH) gồm 3 nguyên tố: Carbon (C), Hydrogen (H), Oxygen (O). Có mặt nguyên tố CARBON!',
    urea: '✅ Phân tử Urea (CO(NH<sub>2</sub>)<sub>2</sub>) gồm 4 nguyên tố: Carbon (C), Oxygen (O), Nitrogen (N), Hydrogen (H). Có mặt nguyên tố CARBON!'
  };

  figCards.forEach((card) => {
    card.addEventListener('click', () => {
      const mol = card.getAttribute('data-mol');
      card.classList.add('revealed');
      const secretEl = card.querySelector('.fig22-secret');
      if (secretEl && detailsMap[mol]) {
        secretEl.style.color = '#065F46';
        secretEl.innerHTML = detailsMap[mol];
      }
      markMilestone('warmup_fig22', 10);
    });
  });

  if (revealAllBtn) {
    revealAllBtn.addEventListener('click', () => {
      figCards.forEach((c) => c.click());
    });
  }

  // Câu hỏi trắc nghiệm Khởi động
  const warmupBtns = document.querySelectorAll('.warmup-option-btn');
  const warmupFb = document.getElementById('warmup-quiz-feedback');

  warmupBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const isCorrect = btn.getAttribute('data-correct') === 'true';
      if (isCorrect) {
        warmupFb.className = 'feedback-box show correct';
        warmupFb.innerHTML = '🌟 <strong>Chính xác! Bạn thật giỏi! (+15 XP)</strong> Điểm chung của tất cả các phân tử hợp chất hữu cơ (C<sub>4</sub>H<sub>10</sub>, C<sub>2</sub>H<sub>5</sub>OH, CH<sub>3</sub>COOH, CO(NH<sub>2</sub>)<sub>2</sub>) là <strong>đều chứa nguyên tố Carbon (C)</strong>!';
        markMilestone('warmup_quiz', 15);
      } else {
        warmupFb.className = 'feedback-box show wrong';
        warmupFb.innerHTML = '💡 <strong>Chưa đúng rồi!</strong> Hãy nhìn vào chữ cái màu đỏ nổi bật trong cả 4 công thức C<sub>4</sub>H<sub>10</sub>, C<sub>2</sub>H<sub>5</sub>OH, CH<sub>3</sub>COOH, CO(NH<sub>2</sub>)<sub>2</sub> nhé (C<sub>4</sub>H<sub>10</sub> không có O hay N nhưng luôn có <strong>Carbon - C</strong>!). Thử lại nào!';
      }
    });
  });
}

/* ==========================================================================
   3. SECTION 2: KHÁM PHÁ KIẾN THỨC (4 MODULES)
   ========================================================================== */
function initKnowledgeModules() {
  const tabBtns = document.querySelectorAll('.module-tab-btn');
  const panels = document.querySelectorAll('.knowledge-module-panel');
  const showAllBtn = document.getElementById('show-all-modules-btn');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-mod');
      panels.forEach((panel) => {
        panel.classList.toggle('hidden', panel.id !== targetId);
      });
    });
  });

  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      panels.forEach((p) => p.classList.remove('hidden'));
      tabBtns.forEach((b) => b.classList.add('active'));
    });
  }

  // Module 1 Quick Check (CaCO3)
  document.querySelectorAll('.mod1-quick-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const fb = document.getElementById('mod1-quick-fb');
      const isCorrect = btn.getAttribute('data-correct') === 'true';
      if (isCorrect) {
        fb.className = 'feedback-box show correct';
        fb.innerHTML = '🌟 <strong>Chính xác! (+10 XP)</strong> Tuy CaCO<sub>3</sub> có chứa nguyên tố C nhưng đây là <strong>muối carbonate</strong> nên thuộc nhóm <strong>hợp chất vô cơ</strong> (ngoại lệ chuẩn SGK)!';
        markMilestone('mod1_quick', 10);
      } else {
        fb.className = 'feedback-box show wrong';
        fb.innerHTML = '💡 <strong>Cẩn thận bẫy nhé!</strong> Hợp chất của carbon là hợp chất hữu cơ, <strong>TRỪ</strong> CO, CO<sub>2</sub>, H<sub>2</sub>CO<sub>3</sub> và các muối carbonate (như CaCO<sub>3</sub>)!';
      }
    });
  });

  // Module 2: Hiện/Ẩn CTCT thu gọn Hình 22.2
  const toggleCondensedBtn = document.getElementById('toggle-fig22-2-condensed-btn');
  if (toggleCondensedBtn) {
    toggleCondensedBtn.addEventListener('click', () => {
      document.querySelectorAll('.condensed-reveal').forEach((el) => {
        el.classList.toggle('hidden');
      });
      markMilestone('mod2_condensed', 10);
    });
  }

  // Module 3: Phòng Thí Nghiệm Ảo Bảng 22.1 SGK (3 Ống nghiệm trực quan)
  initVirtualLabTable22();
}

function initVirtualLabTable22() {
  const btnNaAlcohol = document.getElementById('btn-sim-na-alcohol');
  const btnNaEther = document.getElementById('btn-sim-na-ether');
  const btnNaAll = document.getElementById('btn-sim-na-all');
  const btnFlameH2 = document.getElementById('btn-sim-flame-h2');
  const btnReset = document.getElementById('btn-sim-reset');
  const modeNaBtn = document.getElementById('vlab-mode-na-btn');
  const modeWaterBtn = document.getElementById('vlab-mode-water-btn');
  const microscopePanel = document.getElementById('vlab-microscope-panel');
  const naFeedback = document.getElementById('na-lab-feedback');

  const station1 = document.getElementById('station-tube-1');
  const station2 = document.getElementById('station-tube-2');
  const station3 = document.getElementById('station-tube-3');

  const pellet1 = document.getElementById('na-pellet-1');
  const pellet2 = document.getElementById('na-pellet-2');
  const pellet3 = document.getElementById('na-pellet-3');

  const bubbles2 = document.getElementById('bubbles-tube-2');
  const flame2 = document.getElementById('flame-tube-2');

  const status1 = document.getElementById('status-tube-1');
  const status2 = document.getElementById('status-tube-2');
  const status3 = document.getElementById('status-tube-3');

  const liquid1 = document.getElementById('liquid-tube-1');
  const liquid2 = document.getElementById('liquid-tube-2');
  const liquid3 = document.getElementById('liquid-tube-3');

  let tube2HasReacted = false;

  function dropSodiumIntoTube(tubeNum) {
    markMilestone('mod3_na_lab', 15);

    if (tubeNum === 1) {
      station1.classList.remove('active-reaction');
      station1.classList.add('no-reaction');
      pellet1.classList.remove('dropped-reacting');
      pellet1.classList.add('dropped-idle');
      status1.className = 'vlab-status-pill status-none';
      status1.textContent = '❌ Không phản ứng (0 bọt khí)';

      microscopePanel.innerHTML = `
        <strong>🔎 Kính hiển vi Ống 1 – Methyl chloride (CH<sub>3</sub>&ndash;Cl):</strong><br/>
        • <strong>Hiện tượng:</strong> Mẩu kim loại Natri (Na) chìm xuống và nằm yên, không có bọt khí thoát ra.<br/>
        • <strong>Giải thích cấu tạo:</strong> Trong phân tử <strong>CH<sub>3</sub>&ndash;Cl</strong>, cả 3 nguyên tử H đều liên kết chặt với nguyên tử C (không có nhóm <strong>&ndash;OH</strong>), nên <strong>không tác dụng với Natri</strong>.
      `;
      naFeedback.className = 'feedback-box show wrong';
      naFeedback.innerHTML = '🧪 <strong>Ống 1 (Methyl chloride – CH<sub>3</sub>Cl):</strong> Không xảy ra phản ứng với kim loại Natri (Na).';
    }

    if (tubeNum === 2) {
      tube2HasReacted = true;
      station2.classList.remove('no-reaction');
      station2.classList.add('active-reaction');
      pellet2.classList.remove('dropped-idle');
      pellet2.classList.add('dropped-reacting');
      bubbles2.classList.add('bubbling');
      status2.className = 'vlab-status-pill status-ok';
      status2.innerHTML = '✅ Sủi bọt khí H<sub>2</sub> mạnh mẽ!';

      microscopePanel.innerHTML = `
        <strong>🔎 Kính hiển vi Ống 2 – Ethylic alcohol (CH<sub>3</sub>&ndash;CH<sub>2</sub>&ndash;OH):</strong><br/>
        • <strong>Hiện tượng:</strong> Mẩu Natri (Na) nóng chảy thành giọt tròn chạy trên mặt chất lỏng, tan dần và <strong>sủi bọt khí Hydrogen (H<sub>2</sub>) không màu</strong> liên tục!<br/>
        • <strong>Phương trình hóa học:</strong> <strong>2CH<sub>3</sub>&ndash;CH<sub>2</sub>&ndash;OH + 2Na &rarr; 2CH<sub>3</sub>&ndash;CH<sub>2</sub>&ndash;ONa + H<sub>2</sub>&uarr;</strong><br/>
        • <strong>Giải thích cấu tạo:</strong> Do phân tử có nguyên tử H liên kết với O tạo thành nhóm <strong>&ndash;OH</strong> linh động nên Na đẩy được H ra khỏi nhóm &ndash;OH tạo khí H<sub>2</sub>.
      `;
      naFeedback.className = 'feedback-box show correct';
      naFeedback.innerHTML = '🫧 <strong>Ống 2 (Ethylic alcohol – CH<sub>3</sub>&ndash;CH<sub>2</sub>&ndash;OH): Sủi bọt khí H<sub>2</sub> mạnh mẽ! (+15 XP)</strong> Hãy bấm thêm nút <strong>"🔥 Đưa que đóm thử khí H<sub>2</sub>"</strong> để kiểm chứng khí thoát ra nhé!';
    }

    if (tubeNum === 3) {
      station3.classList.remove('active-reaction');
      station3.classList.add('no-reaction');
      pellet3.classList.remove('dropped-reacting');
      pellet3.classList.add('dropped-idle');
      status3.className = 'vlab-status-pill status-none';
      status3.textContent = '❌ Không phản ứng (0 bọt khí)';

      microscopePanel.innerHTML = `
        <strong>🔎 Kính hiển vi Ống 3 – Dimethyl ether (CH<sub>3</sub>&ndash;O&ndash;CH<sub>3</sub>):</strong><br/>
        • <strong>Hiện tượng:</strong> Mẩu Natri (Na) nằm yên hoàn toàn, <strong>không có bọt khí thoát ra</strong>.<br/>
        • <strong>Giải thích cấu tạo:</strong> Tuy có cùng công thức phân tử <strong>C<sub>2</sub>H<sub>6</sub>O</strong> với Ethylic alcohol (Ống 2), nhưng ở Dimethyl ether nguyên tử O nằm giữa 2 nguyên tử C (<strong>CH<sub>3</sub>&ndash;O&ndash;CH<sub>3</sub></strong>, không có nhóm <strong>&ndash;OH</strong>) nên <strong>không tác dụng với Natri</strong>!
      `;
      naFeedback.className = 'feedback-box show wrong';
      naFeedback.innerHTML = '🔍 <strong>Ống 3 (Dimethyl ether – CH<sub>3</sub>&ndash;O&ndash;CH<sub>3</sub>): Không có phản ứng xảy ra!</strong> Cùng CTPT C<sub>2</sub>H<sub>6</sub>O nhưng khác CTCT (không có nhóm &ndash;OH) nên tính chất hóa học khác hẳn Ethylic alcohol!';
    }
  }

  // Sự kiện nút trên từng ống nghiệm
  document.querySelectorAll('.vlab-drop-single-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tube = Number(btn.getAttribute('data-tube'));
      dropSodiumIntoTube(tube);
    });
  });

  if (btnNaAlcohol) {
    btnNaAlcohol.addEventListener('click', () => dropSodiumIntoTube(2));
  }

  if (btnNaEther) {
    btnNaEther.addEventListener('click', () => dropSodiumIntoTube(3));
  }

  if (btnNaAll) {
    btnNaAll.addEventListener('click', () => {
      dropSodiumIntoTube(1);
      dropSodiumIntoTube(3);
      dropSodiumIntoTube(2);

      microscopePanel.innerHTML = `
        <strong>⚖️ Kết luận Đối chứng cả 3 Ống nghiệm (Bảng 22.1 SGK):</strong><br/>
        • <strong>Ống 1 (CH<sub>3</sub>&ndash;Cl) &amp; Ống 3 (CH<sub>3</sub>&ndash;O&ndash;CH<sub>3</sub>):</strong> Đều <strong>không phản ứng</strong> với Na vì không có nhóm &ndash;OH.<br/>
        • <strong>Ống 2 (CH<sub>3</sub>&ndash;CH<sub>2</sub>&ndash;OH):</strong> <strong>Tác dụng với Na sủi bọt khí H<sub>2</sub></strong> vì có nhóm <strong>&ndash;OH</strong>.<br/>
        &rArr; <strong>Bài học cốt lõi:</strong> Tính chất của hợp chất hữu cơ phụ thuộc đồng thời vào <strong>thành phần phân tử</strong> và <strong>cấu tạo hóa học</strong> của chúng!
      `;
      naFeedback.className = 'feedback-box show correct';
      naFeedback.innerHTML = '⚡ <strong>Đã thả Natri (Na) đồng loạt vào cả 3 ống nghiệm!</strong> Hãy quan sát: chỉ duy nhất <strong>Ống 2 (Ethylic alcohol)</strong> sủi bọt khí H<sub>2</sub>!';
    });
  }

  if (btnFlameH2) {
    btnFlameH2.addEventListener('click', () => {
      if (!tube2HasReacted) {
        dropSodiumIntoTube(2);
      }
      flame2.classList.add('ignited');
      status2.innerHTML = '🔥 Khí H<sub>2</sub> cháy với ngọn lửa xanh!';
      naFeedback.className = 'feedback-box show correct';
      naFeedback.innerHTML = '🔥 <strong>Thử khí thoát ra ở Ống 2:</strong> Tiếng nổ "bụp" nhẹ và ngọn lửa xanh nhạt xuất hiện ở miệng ống nghiệm, chứng minh khí sinh ra khi Ethylic alcohol tác dụng với Na chính là <strong>khí Hydrogen (H<sub>2</sub>)</strong>!';
    });
  }

  function resetVirtualLab() {
    tube2HasReacted = false;
    [station1, station2, station3].forEach((st) => {
      st.classList.remove('active-reaction', 'no-reaction');
    });
    [pellet1, pellet2, pellet3].forEach((p) => {
      p.classList.remove('dropped-idle', 'dropped-reacting');
    });
    bubbles2.classList.remove('bubbling');
    flame2.classList.remove('ignited');

    liquid1.setAttribute('fill', 'rgba(148, 163, 184, 0.28)');
    liquid2.setAttribute('fill', 'rgba(56, 189, 248, 0.35)');
    liquid3.setAttribute('fill', 'rgba(244, 114, 182, 0.24)');

    status1.className = 'vlab-status-pill';
    status1.textContent = 'Trạng thái: Sẵn sàng thử nghiệm';
    status2.className = 'vlab-status-pill';
    status2.textContent = 'Trạng thái: Chất lỏng không màu';
    status3.className = 'vlab-status-pill';
    status3.textContent = 'Trạng thái: Sẵn sàng thử nghiệm';

    microscopePanel.innerHTML = '<strong>🔎 Góc nhìn Kính hiển vi Phân tử:</strong> Đã làm mới bàn thí nghiệm! Hãy bấm các nút thả <strong>Natri (Na)</strong> hoặc chuyển sang <strong>Thí nghiệm 2 (Độ tan trong nước)</strong> để thực hành lại.';
    naFeedback.className = 'feedback-box';
  }

  if (btnReset) {
    btnReset.addEventListener('click', resetVirtualLab);
  }

  if (modeNaBtn && modeWaterBtn) {
    modeNaBtn.addEventListener('click', () => {
      modeNaBtn.classList.add('active');
      modeWaterBtn.classList.remove('active');
      resetVirtualLab();
    });

    modeWaterBtn.addEventListener('click', () => {
      modeWaterBtn.classList.add('active');
      modeNaBtn.classList.remove('active');
      resetVirtualLab();
      markMilestone('mod3_na_lab', 15);

      liquid1.setAttribute('fill', 'rgba(56, 189, 248, 0.18)');
      liquid2.setAttribute('fill', 'rgba(16, 185, 129, 0.48)');
      liquid3.setAttribute('fill', 'rgba(56, 189, 248, 0.18)');

      station1.classList.add('no-reaction');
      station2.classList.add('active-reaction');
      station3.classList.add('no-reaction');

      status1.className = 'vlab-status-pill status-none';
      status1.textContent = '💧 Chất khí • Tan rất ít trong nước';
      status2.className = 'vlab-status-pill status-ok';
      status2.textContent = '💧 Chất lỏng • Tan vô hạn trong nước';
      status3.className = 'vlab-status-pill status-none';
      status3.textContent = '💧 Chất khí • Tan ít trong nước';

      microscopePanel.innerHTML = `
        <strong>💧 Kết quả Thí nghiệm 2 – Trạng thái &amp; Độ tan trong nước ở điều kiện thường (Bảng 22.1 SGK):</strong><br/>
        • <strong>Ống 1 (Methyl chloride – CH<sub>3</sub>Cl):</strong> Là <strong>chất khí</strong>, <strong>tan rất ít trong nước</strong>.<br/>
        • <strong>Ống 2 (Ethylic alcohol – CH<sub>3</sub>CH<sub>2</sub>OH):</strong> Là <strong>chất lỏng</strong>, <strong>tan vô hạn trong nước</strong> (hòa tan vào nước theo bất kì tỉ lệ nào nhờ nhóm &ndash;OH phân cực).<br/>
        • <strong>Ống 3 (Dimethyl ether – CH<sub>3</sub>OCH<sub>3</sub>):</strong> Là <strong>chất khí</strong>, <strong>tan ít trong nước</strong>.
      `;
      naFeedback.className = 'feedback-box show correct';
      naFeedback.innerHTML = '💧 <strong>Thí nghiệm Tính chất vật lí:</strong> Mặc dù Ethylic alcohol và Dimethyl ether có cùng CTPT C<sub>2</sub>H<sub>6</sub>O, nhưng ở điều kiện thường Ethylic alcohol là <strong>chất lỏng tan vô hạn trong nước</strong>, còn Dimethyl ether là <strong>chất khí tan ít trong nước</strong>!';
    });
  }
}

/* ==========================================================================
   4. SECTION 3: LUYỆN TẬP TƯƠNG TÁC (3 HOẠT ĐỘNG BẮT BUỘC)
   ========================================================================== */

// DỮ LIỆU HOẠT ĐỘNG 1: 11 HỢP CHẤT TRANG 103 SGK
const ACT1_COMPOUNDS = [
  { id: 'c1', formula: 'C<sub>6</sub>H<sub>6</sub>', raw: 'C6H6', group: 'organic', note: 'Benzene — Hợp chất của C và H nên là hợp chất hữu cơ.' },
  { id: 'c2', formula: 'H<sub>2</sub>SO<sub>4</sub>', raw: 'H2SO4', group: 'inorganic', note: 'Sulfuric acid — Không chứa nguyên tố Carbon (C) nên là hợp chất vô cơ.' },
  { id: 'c3', formula: 'C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>', raw: 'C6H12O6', group: 'organic', note: 'Glucose — Hợp chất hữu cơ chứa C, H, O.' },
  { id: 'c4', formula: 'H<sub>2</sub>CO<sub>3</sub>', raw: 'H2CO3', group: 'inorganic', note: 'Carbonic acid — Thuộc nhóm ngoại lệ vô cơ của Carbon!' },
  { id: 'c5', formula: 'CaCO<sub>3</sub>', raw: 'CaCO3', group: 'inorganic', note: 'Calcium carbonate (đá vôi) — Là muối carbonate nên là hợp chất vô cơ!' },
  { id: 'c6', formula: 'KNO<sub>3</sub>', raw: 'KNO3', group: 'inorganic', note: 'Potassium nitrate — Không chứa nguyên tố Carbon nên là hợp chất vô cơ.' },
  { id: 'c7', formula: 'C<sub>2</sub>H<sub>4</sub>', raw: 'C2H4', group: 'organic', note: 'Ethylene — Hợp chất của C và H nên là hợp chất hữu cơ.' },
  { id: 'c8', formula: 'NaOH', raw: 'NaOH', group: 'inorganic', note: 'Sodium hydroxide — Không chứa nguyên tố Carbon nên là hợp chất vô cơ.' },
  { id: 'c9', formula: 'Al<sub>2</sub>O<sub>3</sub>', raw: 'Al2O3', group: 'inorganic', note: 'Aluminium oxide — Không chứa nguyên tố Carbon nên là hợp chất vô cơ.' },
  { id: 'c10', formula: 'CH<sub>3</sub>Cl', raw: 'CH3Cl', group: 'organic', note: 'Methyl chloride — Hợp chất hữu cơ (dẫn xuất chứa C, H, Cl).' },
  { id: 'c11', formula: 'CH<sub>3</sub>OH', raw: 'CH3OH', group: 'organic', note: 'Metylic alcohol — Hợp chất hữu cơ (dẫn xuất chứa C, H, O).' }
];

// DỮ LIỆU HOẠT ĐỘNG 2: GHÉP CẶP CTPT - CTCT & ĐẶC ĐIỂM CẤU TẠO
const ACT2_PAIRS = [
  {
    id: 'm1',
    leftTitle: '1. Ethane (CTPT: C<sub>2</sub>H<sub>6</sub>)',
    ans: 'CH3-CH3 (Liên kết đơn C-C, mạch hở)',
    options: [
      'CH3-CH3 (Liên kết đơn C-C, mạch hở)',
      'CH2=CH2 (Có 1 liên kết đôi C=C)',
      'CH3-CH2-OH (Có nhóm -OH, tác dụng với Na)',
      'CH3-O-CH3 (Không có nhóm -OH, không tác dụng với Na)',
      'CH3-CH(CH3)-CH3 (Mạch hở, phân nhánh - Hình 22.3b)'
    ],
    exp: 'Ethane C<sub>2</sub>H<sub>6</sub> có công thức cấu tạo thu gọn là CH<sub>3</sub>&ndash;CH<sub>3</sub> (chỉ gồm các liên kết đơn).'
  },
  {
    id: 'm2',
    leftTitle: '2. Ethylene (CTPT: C<sub>2</sub>H<sub>4</sub>)',
    ans: 'CH2=CH2 (Có 1 liên kết đôi C=C)',
    options: [
      'CH3-CH3 (Liên kết đơn C-C, mạch hở)',
      'CH2=CH2 (Có 1 liên kết đôi C=C)',
      'CH3-CH2-OH (Có nhóm -OH, tác dụng với Na)',
      'CH3-O-CH3 (Không có nhóm -OH, không tác dụng với Na)',
      'CH3-CH(CH3)-CH3 (Mạch hở, phân nhánh - Hình 22.3b)'
    ],
    exp: 'Ethylene C<sub>2</sub>H<sub>4</sub> có hai nguyên tử C liên kết đôi với nhau: CH<sub>2</sub>=CH<sub>2</sub>.'
  },
  {
    id: 'm3',
    leftTitle: '3. Ethylic alcohol (CTPT: C<sub>2</sub>H<sub>6</sub>O - Công thức (5) Hình 22.2)',
    ans: 'CH3-CH2-OH (Có nhóm -OH, tác dụng với Na)',
    options: [
      'CH3-CH3 (Liên kết đơn C-C, mạch hở)',
      'CH2=CH2 (Có 1 liên kết đôi C=C)',
      'CH3-CH2-OH (Có nhóm -OH, tác dụng với Na)',
      'CH3-O-CH3 (Không có nhóm -OH, không tác dụng với Na)',
      'CH3-CH(CH3)-CH3 (Mạch hở, phân nhánh - Hình 22.3b)'
    ],
    exp: 'Ethylic alcohol có CTCT thu gọn là CH<sub>3</sub>&ndash;CH<sub>2</sub>&ndash;OH (chất lỏng, tan vô hạn trong nước, tác dụng với Na).'
  },
  {
    id: 'm4',
    leftTitle: '4. Dimethyl ether (CTPT: C<sub>2</sub>H<sub>6</sub>O - Công thức (6) Hình 22.2)',
    ans: 'CH3-O-CH3 (Không có nhóm -OH, không tác dụng với Na)',
    options: [
      'CH3-CH3 (Liên kết đơn C-C, mạch hở)',
      'CH2=CH2 (Có 1 liên kết đôi C=C)',
      'CH3-CH2-OH (Có nhóm -OH, tác dụng với Na)',
      'CH3-O-CH3 (Không có nhóm -OH, không tác dụng với Na)',
      'CH3-CH(CH3)-CH3 (Mạch hở, phân nhánh - Hình 22.3b)'
    ],
    exp: 'Dimethyl ether có CTCT thu gọn là CH<sub>3</sub>&ndash;O&ndash;CH<sub>3</sub> (cùng CTPT C<sub>2</sub>H<sub>6</sub>O với ethylic alcohol nhưng khác CTCT).'
  },
  {
    id: 'm5',
    leftTitle: '5. Isobutane (CTPT: C<sub>4</sub>H<sub>10</sub> - Công thức (3) Hình 22.2)',
    ans: 'CH3-CH(CH3)-CH3 (Mạch hở, phân nhánh - Hình 22.3b)',
    options: [
      'CH3-CH3 (Liên kết đơn C-C, mạch hở)',
      'CH2=CH2 (Có 1 liên kết đôi C=C)',
      'CH3-CH2-OH (Có nhóm -OH, tác dụng với Na)',
      'CH3-O-CH3 (Không có nhóm -OH, không tác dụng với Na)',
      'CH3-CH(CH3)-CH3 (Mạch hở, phân nhánh - Hình 22.3b)'
    ],
    exp: 'Công thức (3) trong Hình 22.2 có mạch carbon phân nhánh: CH<sub>3</sub>&ndash;CH(CH<sub>3</sub>)&ndash;CH<sub>3</sub>.'
  }
];

// DỮ LIỆU HOẠT ĐỘNG 3: 9 HỢP CHẤT HỮU CƠ TRANG 104 SGK
const ACT3_COMPOUNDS = [
  { id: 'h1', formula: 'CH<sub>4</sub>', type: 'hc', note: 'Chỉ chứa 2 nguyên tố C và H &rarr; Hydrocarbon.' },
  { id: 'h2', formula: 'CH<sub>3</sub>Cl', type: 'deriv', note: 'Ngoài C, H còn có nguyên tố Chlorine (Cl) &rarr; Dẫn xuất của hydrocarbon.' },
  { id: 'h3', formula: 'CH<sub>2</sub>=CH<sub>2</sub>', type: 'hc', note: 'Chỉ chứa 2 nguyên tố C và H &rarr; Hydrocarbon.' },
  { id: 'h4', formula: 'CH<sub>3</sub>CH<sub>2</sub>OH', type: 'deriv', note: 'Ngoài C, H còn có nguyên tố Oxygen (O) &rarr; Dẫn xuất của hydrocarbon.' },
  { id: 'h5', formula: 'CH<sub>3</sub>COOH', type: 'deriv', note: 'Ngoài C, H còn có nguyên tố Oxygen (O) &rarr; Dẫn xuất của hydrocarbon.' },
  { id: 'h6', formula: 'CH<sub>3</sub>NH<sub>2</sub>', type: 'deriv', note: 'Ngoài C, H còn có nguyên tố Nitrogen (N) &rarr; Dẫn xuất của hydrocarbon.' },
  { id: 'h7', formula: 'CH<sub>3</sub>CH<sub>2</sub>CH<sub>3</sub>', type: 'hc', note: 'Chỉ chứa 2 nguyên tố C và H &rarr; Hydrocarbon.' },
  { id: 'h8', formula: 'CH<sub>3</sub>CH=CH<sub>2</sub>', type: 'hc', note: 'Chỉ chứa 2 nguyên tố C và H &rarr; Hydrocarbon.' },
  { id: 'h9', formula: 'CH<sub>3</sub>COOCH<sub>2</sub>CH<sub>3</sub>', type: 'deriv', note: 'Ngoài C, H còn có nguyên tố Oxygen (O) &rarr; Dẫn xuất của hydrocarbon.' }
];

function initPracticeActivities() {
  initActivity1();
  initActivity2();
  initActivity3();
}

function initActivity1() {
  const pool = document.getElementById('act1-chip-pool');
  const cardsGrid = document.getElementById('act1-cards-grid');
  const fb = document.getElementById('act1-instant-feedback');
  const itemsOrganic = document.getElementById('items-organic');
  const itemsInorganic = document.getElementById('items-inorganic');

  if (!pool || !cardsGrid) return;

  // Render Drag Chips
  pool.innerHTML = ACT1_COMPOUNDS.map((c) => `
    <div class="chem-drag-chip" draggable="true" id="drag-${c.id}" data-id="${c.id}">
      🧪 ${c.formula}
    </div>
  `).join('');

  // Render Click Cards
  cardsGrid.innerHTML = ACT1_COMPOUNDS.map((c) => `
    <div class="sort-item" id="act1-card-${c.id}">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:1.15rem; font-weight:900; color:var(--primary-plum);">${c.formula}</span>
        <span id="act1-badge-${c.id}" style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">Chưa phân loại</span>
      </div>
      <div class="sort-btn-group">
        <button type="button" class="sort-btn" data-id="${c.id}" data-choice="organic">🌿 Hữu cơ</button>
        <button type="button" class="sort-btn" data-id="${c.id}" data-choice="inorganic">🪨 Vô cơ</button>
      </div>
    </div>
  `).join('');

  function handleClassifyAct1(compId, chosenGroup) {
    const comp = ACT1_COMPOUNDS.find((x) => x.id === compId);
    if (!comp) return;

    const card = document.getElementById(`act1-card-${compId}`);
    const badge = document.getElementById(`act1-badge-${compId}`);
    const chip = document.getElementById(`drag-${compId}`);
    const isCorrect = comp.group === chosenGroup;

    // Highlight button
    card.querySelectorAll('.sort-btn').forEach((b) => {
      b.classList.toggle('selected', b.getAttribute('data-choice') === chosenGroup);
    });

    if (isCorrect) {
      card.classList.remove('wrong-item');
      card.classList.add('correct-item');
      badge.style.color = '#059669';
      badge.textContent = chosenGroup === 'organic' ? '✅ Hữu cơ' : '✅ Vô cơ';

      if (chip) {
        if (chosenGroup === 'organic') {
          itemsOrganic.appendChild(chip);
        } else {
          itemsInorganic.appendChild(chip);
        }
      }

      state.act1Solved.add(compId);
      updateBucketCounts();

      fb.className = 'feedback-box show correct';
      fb.innerHTML = `🌟 <strong>Chính xác! Bạn thật giỏi!</strong> Phân tử <strong>${comp.formula}</strong>: ${comp.note} (Đã hoàn thành đúng <strong>${state.act1Solved.size}/11</strong> chất)`;

      if (state.act1Solved.size === ACT1_COMPOUNDS.length) {
        markMilestone('act1_done', 20);
        fb.innerHTML += '<br/>🎉 <strong>Xuất sắc! Em đã phân loại đúng toàn bộ 11/11 chất trong SGK Trang 103 (+20 XP)!</strong>';
      }
    } else {
      card.classList.remove('correct-item');
      card.classList.add('wrong-item');
      badge.style.color = '#DC2626';
      badge.textContent = '❌ Xem gợi ý';

      fb.className = 'feedback-box show wrong';
      fb.innerHTML = `💡 <strong>Chưa đúng rồi, thử lại nào!</strong> Với <strong>${comp.formula}</strong>: ${comp.note}`;
    }
  }

  function updateBucketCounts() {
    const orgCount = itemsOrganic.querySelectorAll('.chem-drag-chip').length;
    const inorgCount = itemsInorganic.querySelectorAll('.chem-drag-chip').length;
    document.getElementById('count-organic').textContent = `${orgCount} / 5`;
    document.getElementById('count-inorganic').textContent = `${inorgCount} / 6`;
  }

  // Click events on buttons
  cardsGrid.querySelectorAll('.sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      handleClassifyAct1(btn.getAttribute('data-id'), btn.getAttribute('data-choice'));
    });
  });

  // Drag & Drop + Mobile Tap events
  document.querySelectorAll('#act1-chip-pool .chem-drag-chip').forEach((chip) => {
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', chip.getAttribute('data-id'));
    });
    chip.addEventListener('click', () => {
      const compId = chip.getAttribute('data-id');
      const card = document.getElementById(`act1-card-${compId}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.boxShadow = '0 0 0 4px rgba(190, 24, 93, 0.35)';
        setTimeout(() => {
          card.style.boxShadow = '';
        }, 1200);
      }
    });
  });

  document.querySelectorAll('.drop-bucket').forEach((bucket) => {
    bucket.addEventListener('dragover', (e) => {
      e.preventDefault();
      bucket.classList.add('drag-over');
    });
    bucket.addEventListener('dragleave', () => {
      bucket.classList.remove('drag-over');
    });
    bucket.addEventListener('drop', (e) => {
      e.preventDefault();
      bucket.classList.remove('drag-over');
      const compId = e.dataTransfer.getData('text/plain');
      const targetGroup = bucket.getAttribute('data-bucket');
      if (compId && targetGroup) {
        handleClassifyAct1(compId, targetGroup);
      }
    });
  });
}

function initActivity2() {
  const container = document.getElementById('act2-matching-container');
  const fb = document.getElementById('act2-instant-feedback');
  if (!container) return;

  container.innerHTML = ACT2_PAIRS.map((pair) => `
    <div class="matching-row" id="act2-row-${pair.id}">
      <div style="font-weight:800; color:var(--primary-plum);">
        ${pair.leftTitle}
      </div>
      <div>
        <select class="matching-select" data-id="${pair.id}">
          <option value="">-- Chọn công thức cấu tạo tương ứng --</option>
          ${pair.options.map((opt) => `<option value="${opt}">${opt}</option>`).join('')}
        </select>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.matching-select').forEach((sel) => {
    sel.addEventListener('change', () => {
      const pairId = sel.getAttribute('data-id');
      const pair = ACT2_PAIRS.find((p) => p.id === pairId);
      const row = document.getElementById(`act2-row-${pairId}`);
      if (!pair) return;

      if (sel.value === pair.ans) {
        row.style.borderColor = '#059669';
        row.style.background = '#ECFDF5';
        state.act2Solved.add(pairId);

        fb.className = 'feedback-box show correct';
        fb.innerHTML = `🌟 <strong>Chính xác! Bạn thật giỏi!</strong> ${pair.exp} (Đã ghép đúng <strong>${state.act2Solved.size}/${ACT2_PAIRS.length}</strong> cặp)`;

        if (state.act2Solved.size === ACT2_PAIRS.length) {
          markMilestone('act2_done', 20);
          fb.innerHTML += '<br/>🎉 <strong>Tuyệt vời! Bạn đã hoàn thành xuất sắc Hoạt động 2 (+20 XP)!</strong>';
        }
      } else {
        row.style.borderColor = '#DC2626';
        row.style.background = '#FEF2F2';
        fb.className = 'feedback-box show wrong';
        fb.innerHTML = `💡 <strong>Chưa đúng rồi!</strong> Hãy nhớ rằng Carbon luôn có hóa trị IV và đối chiếu lại Hình 22.2 SGK nhé!`;
      }
    });
  });
}

function initActivity3() {
  const grid = document.getElementById('act3-cards-grid');
  const fb = document.getElementById('act3-instant-feedback');
  if (!grid) return;

  grid.innerHTML = ACT3_COMPOUNDS.map((item) => `
    <div class="sort-item" id="act3-card-${item.id}">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:1.1rem; font-weight:900; color:var(--primary-blue-deep);">${item.formula}</span>
        <span id="act3-badge-${item.id}" style="font-size:0.78rem; font-weight:700; color:var(--text-muted);">Chọn nhóm</span>
      </div>
      <div class="sort-btn-group">
        <button type="button" class="sort-btn" data-id="${item.id}" data-type="hc">🔵 Hydrocarbon</button>
        <button type="button" class="sort-btn" data-id="${item.id}" data-type="deriv">🟣 Dẫn xuất HC</button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-id');
      const chosenType = btn.getAttribute('data-type');
      const item = ACT3_COMPOUNDS.find((x) => x.id === itemId);
      if (!item) return;

      const card = document.getElementById(`act3-card-${itemId}`);
      const badge = document.getElementById(`act3-badge-${itemId}`);

      card.querySelectorAll('.sort-btn').forEach((b) => {
        b.classList.toggle('selected', b.getAttribute('data-type') === chosenType);
      });

      if (chosenType === item.type) {
        card.classList.remove('wrong-item');
        card.classList.add('correct-item');
        badge.style.color = '#059669';
        badge.textContent = chosenType === 'hc' ? '✅ Hydrocarbon' : '✅ Dẫn xuất';
        state.act3Solved.add(itemId);

        fb.className = 'feedback-box show correct';
        fb.innerHTML = `🌟 <strong>Chính xác!</strong> Phân tử <strong>${item.formula}</strong>: ${item.note} (Đã hoàn thành <strong>${state.act3Solved.size}/9</strong> chất)`;

        if (state.act3Solved.size === ACT3_COMPOUNDS.length) {
          markMilestone('act3_done', 20);
          fb.innerHTML += '<br/>🎉 <strong>Hoàn hảo! Em đã phân loại đúng cả 9/9 chất trong SGK Trang 104 (+20 XP)!</strong>';
        }
      } else {
        card.classList.remove('correct-item');
        card.classList.add('wrong-item');
        badge.style.color = '#DC2626';
        badge.textContent = '❌ Thử lại';

        fb.className = 'feedback-box show wrong';
        fb.innerHTML = `💡 <strong>Chưa đúng rồi!</strong> Hãy kiểm tra xem trong phân tử <strong>${item.formula}</strong> chỉ có C và H hay có thêm nguyên tố khác (O, N, Cl) nhé!`;
      }
    });
  });
}

/* ==========================================================================
   5. SECTION 4: NGÂN HÀNG ĐỀ KIỂM TRA 100 ĐIỂM (BÁM SÁT SGK BÀI 22 KHTN 9)
   - Phần I: 10 câu Nhiều lựa chọn × 2đ = 20đ
   - Phần II: 10 câu Đúng/Sai × 2đ = 20đ
   - Phần III: 10 câu Trả lời ngắn × 2đ = 20đ
   - Phần IV: 10 câu Ghép cột × 2đ = 20đ
   - Phần V: 4 câu Tự luận × 5đ = 20đ
   Tổng cộng: 44 câu = 100 điểm
   ========================================================================== */

// PHẦN I: 10 CÂU TRẮC NGHIỆM NHIỀU LỰA CHỌN (20 ĐIỂM)
const EXAM_MCQ = [
  {
    id: 'mcq1',
    q: 'Câu 1: Thành phần phân tử của tất cả các hợp chất hữu cơ nhất thiết phải chứa nguyên tố nào sau đây?',
    options: ['A. Carbon (C)', 'B. Oxygen (O)', 'C. Nitrogen (N)', 'D. Chlorine (Cl)'],
    ans: 0,
    exp: 'Theo SGK trang 102 - 103, hợp chất của carbon là hợp chất hữu cơ, nên phân tử hợp chất hữu cơ nhất thiết phải chứa nguyên tố carbon (C).'
  },
  {
    id: 'mcq2',
    q: 'Câu 2: Chất nào sau đây là hợp chất hữu cơ?',
    options: ['A. CO<sub>2</sub>', 'B. CaCO<sub>3</sub>', 'C. C<sub>4</sub>H<sub>10</sub> (Butane)', 'D. H<sub>2</sub>CO<sub>3</sub>'],
    ans: 2,
    exp: 'C<sub>4</sub>H<sub>10</sub> (Butane) là hợp chất hữu cơ. CO<sub>2</sub>, CaCO<sub>3</sub> và H<sub>2</sub>CO<sub>3</sub> là các hợp chất vô cơ của carbon.'
  },
  {
    id: 'mcq3',
    q: 'Câu 3: Dãy các chất nào sau đây đều là hợp chất vô cơ (dù có chứa nguyên tố carbon)?',
    options: [
      'A. CH<sub>4</sub>, C<sub>2</sub>H<sub>4</sub>, C<sub>6</sub>H<sub>6</sub>',
      'B. CO, CO<sub>2</sub>, CaCO<sub>3</sub>, H<sub>2</sub>CO<sub>3</sub>',
      'C. C<sub>2</sub>H<sub>5</sub>OH, CH<sub>3</sub>COOH, CH<sub>3</sub>Cl',
      'D. C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>, CO(NH<sub>2</sub>)<sub>2</sub>, CH<sub>3</sub>OH'
    ],
    ans: 1,
    exp: 'Hợp chất của carbon là hợp chất hữu cơ, trừ carbon monoxide (CO), carbon dioxide (CO<sub>2</sub>), carbonic acid (H<sub>2</sub>CO<sub>3</sub>) và các muối carbonate (CaCO<sub>3</sub>,...).'
  },
  {
    id: 'mcq4',
    q: 'Câu 4: Trong các hợp chất hữu cơ ở Hình 22.1 SGK, chất nào có trong thành phần của các loại giấm ăn?',
    options: [
      'A. Butane (C<sub>4</sub>H<sub>10</sub>)',
      'B. Ethylic alcohol (C<sub>2</sub>H<sub>5</sub>OH)',
      'C. Acetic acid (CH<sub>3</sub>COOH)',
      'D. Urea (CO(NH<sub>2</sub>)<sub>2</sub>)'
    ],
    ans: 2,
    exp: 'Theo Hình 22.1 SGK trang 102, Acetic acid (CH<sub>3</sub>COOH) có trong thành phần của các loại giấm.'
  },
  {
    id: 'mcq5',
    q: 'Câu 5: Trong phân tử hợp chất hữu cơ, nguyên tố Carbon (C) luôn có hóa trị bằng bao nhiêu?',
    options: ['A. Hóa trị I', 'B. Hóa trị II', 'C. Hóa trị III', 'D. Hóa trị IV'],
    ans: 3,
    exp: 'Theo SGK trang 103, trong phân tử hợp chất hữu cơ, carbon luôn có hóa trị IV.'
  },
  {
    id: 'mcq6',
    q: 'Câu 6: Liên kết hóa học chủ yếu trong phân tử các hợp chất hữu cơ là loại liên kết nào?',
    options: [
      'A. Liên kết cộng hóa trị',
      'B. Liên kết ion',
      'C. Liên kết kim loại',
      'D. Liên kết hạt nhân'
    ],
    ans: 0,
    exp: 'Các hợp chất hữu cơ được tạo thành chủ yếu từ các nguyên tố phi kim, vì vậy liên kết hóa học chủ yếu trong các hợp chất này là liên kết cộng hóa trị.'
  },
  {
    id: 'mcq7',
    q: 'Câu 7: Công thức nào sau đây cho biết trật tự liên kết và cách thức liên kết giữa các nguyên tử trong phân tử?',
    options: [
      'A. Công thức phân tử',
      'B. Công thức cấu tạo',
      'C. Công thức đơn giản nhất',
      'D. Kí hiệu hóa học'
    ],
    ans: 1,
    exp: 'Công thức cấu tạo là công thức cho biết trật tự liên kết và cách thức liên kết giữa các nguyên tử trong phân tử (SGK trang 103).'
  },
  {
    id: 'mcq8',
    q: 'Câu 8: Hợp chất hữu cơ mà thành phần phân tử chỉ chứa hai nguyên tố carbon và hydrogen được gọi là gì?',
    options: [
      'A. Dẫn xuất của hydrocarbon',
      'B. Hydrocarbon',
      'C. Muối carbonate',
      'D. Hợp chất vô cơ'
    ],
    ans: 1,
    exp: 'Hydrocarbon là loại hợp chất hữu cơ mà thành phần phân tử chỉ chứa các nguyên tố carbon và hydrogen (SGK trang 104).'
  },
  {
    id: 'mcq9',
    q: 'Câu 9: Dãy chất nào sau đây chỉ gồm các dẫn xuất của hydrocarbon?',
    options: [
      'A. CH<sub>4</sub>, C<sub>2</sub>H<sub>4</sub>, C<sub>3</sub>H<sub>8</sub>',
      'B. CH<sub>3</sub>Cl, CH<sub>3</sub>CH<sub>2</sub>OH, CH<sub>3</sub>COOH, CH<sub>3</sub>NH<sub>2</sub>',
      'C. CH<sub>4</sub>, CH<sub>3</sub>Cl, CH<sub>2</sub>=CH<sub>2</sub>',
      'D. C<sub>6</sub>H<sub>6</sub>, C<sub>4</sub>H<sub>10</sub>, CH<sub>3</sub>CH=CH<sub>2</sub>'
    ],
    ans: 1,
    exp: 'CH<sub>3</sub>Cl, CH<sub>3</sub>CH<sub>2</sub>OH, CH<sub>3</sub>COOH, CH<sub>3</sub>NH<sub>2</sub> đều chứa thêm nguyên tố khác (Cl, O, N) ngoài C và H nên đều là dẫn xuất của hydrocarbon.'
  },
  {
    id: 'mcq10',
    q: 'Câu 10: Theo Bảng 22.1 SGK, hai chất nào có cùng công thức phân tử C<sub>2</sub>H<sub>6</sub>O nhưng có công thức cấu tạo và tính chất khác nhau?',
    options: [
      'A. Ethylic alcohol (CH<sub>3</sub>&ndash;CH<sub>2</sub>&ndash;OH) và Dimethyl ether (CH<sub>3</sub>&ndash;O&ndash;CH<sub>3</sub>)',
      'B. Methyl chloride (CH<sub>3</sub>Cl) và Ethylic alcohol (C<sub>2</sub>H<sub>5</sub>OH)',
      'C. Ethane (C<sub>2</sub>H<sub>6</sub>) và Ethylene (C<sub>2</sub>H<sub>4</sub>)',
      'D. Butane (C<sub>4</sub>H<sub>10</sub>) và Urea (CO(NH<sub>2</sub>)<sub>2</sub>)'
    ],
    ans: 0,
    exp: 'Ethylic alcohol (CH<sub>3</sub>&ndash;CH<sub>2</sub>&ndash;OH) và Dimethyl ether (CH<sub>3</sub>&ndash;O&ndash;CH<sub>3</sub>) có cùng CTPT C<sub>2</sub>H<sub>6</sub>O nhưng khác cấu tạo hóa học nên khác nhau về tính chất.'
  }
];

// PHẦN II: 10 CÂU TRẮC NGHIỆM ĐÚNG / SAI (20 ĐIỂM)
const EXAM_TF = [
  {
    id: 'tf1',
    q: 'Câu 1: Tất cả các hợp chất có chứa nguyên tố carbon (như CO, CO<sub>2</sub>, CaCO<sub>3</sub>) đều là hợp chất hữu cơ.',
    ans: false,
    exp: 'Sai. Hợp chất của carbon là hợp chất hữu cơ TRỪ CO, CO<sub>2</sub>, H<sub>2</sub>CO<sub>3</sub>, các muối carbonate,...'
  },
  {
    id: 'tf2',
    q: 'Câu 2: Ngành khoa học chuyên nghiên cứu về các hợp chất hữu cơ được gọi là chuyên ngành Hóa học hữu cơ.',
    ans: true,
    exp: 'Đúng theo định nghĩa SGK trang 102.'
  },
  {
    id: 'tf3',
    q: 'Câu 3: Năm 1828, nhà hóa học người Đức Friedrich Wöhler đã tổng hợp thành công chất hữu cơ urea từ chất vô cơ.',
    ans: true,
    exp: 'Đúng theo mục Mở rộng SGK trang 103.'
  },
  {
    id: 'tf4',
    q: 'Câu 4: Công thức phân tử cho biết trật tự liên kết và cách thức liên kết giữa các nguyên tử trong phân tử.',
    ans: false,
    exp: 'Sai. Công thức CẤU TẠO mới cho biết trật tự và cách thức liên kết; còn công thức phân tử chỉ cho biết thành phần nguyên tố và số lượng nguyên tử.'
  },
  {
    id: 'tf5',
    q: 'Câu 5: Trong công thức cấu tạo, liên kết đơn được biểu diễn bằng một gạch nối (&ndash;) và liên kết đôi được biểu diễn bằng hai gạch nối (=).',
    ans: true,
    exp: 'Đúng theo SGK trang 103.'
  },
  {
    id: 'tf6',
    q: 'Câu 6: Trong các hợp chất hữu cơ, các nguyên tử carbon có thể liên kết trực tiếp với nhau tạo thành mạch carbon (mạch hở không phân nhánh, mạch hở phân nhánh, mạch vòng).',
    ans: true,
    exp: 'Đúng theo Hình 22.3 SGK trang 103.'
  },
  {
    id: 'tf7',
    q: 'Câu 7: Ở điều kiện thường, cả Ethylic alcohol (CH<sub>3</sub>&ndash;CH<sub>2</sub>&ndash;OH) và Dimethyl ether (CH<sub>3</sub>&ndash;O&ndash;CH<sub>3</sub>) đều tác dụng mạnh với kim loại natri (Na).',
    ans: false,
    exp: 'Sai. Theo Bảng 22.1 SGK trang 104, chỉ có Ethylic alcohol tác dụng với natri, còn Dimethyl ether không tác dụng với natri.'
  },
  {
    id: 'tf8',
    q: 'Câu 8: Hợp chất C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> (glucose) và CH<sub>3</sub>COOH (acetic acid) đều thuộc nhóm dẫn xuất của hydrocarbon.',
    ans: true,
    exp: 'Đúng. Vì ngoài C và H, trong phân tử của chúng còn có nguyên tố Oxygen (O).'
  },
  {
    id: 'tf9',
    q: 'Câu 9: Hợp chất CH<sub>2</sub>=CH<sub>2</sub> và CH<sub>3</sub>CH<sub>2</sub>CH<sub>3</sub> đều là các hydrocarbon.',
    ans: true,
    exp: 'Đúng. Vì phân tử của chúng chỉ chứa hai nguyên tố là Carbon (C) và Hydrogen (H).'
  },
  {
    id: 'tf10',
    q: 'Câu 10: Công thức cấu tạo thu gọn CH<sub>3</sub>&ndash;CH<sub>3</sub> tương ứng với công thức phân tử C<sub>2</sub>H<sub>4</sub>.',
    ans: false,
    exp: 'Sai. CH<sub>3</sub>&ndash;CH<sub>3</sub> có 2 nguyên tử C và 6 nguyên tử H nên ứng với công thức phân tử C<sub>2</sub>H<sub>6</sub> (còn C<sub>2</sub>H<sub>4</sub> là CH<sub>2</sub>=CH<sub>2</sub>).'
  }
];

// PHẦN III: 10 CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN (20 ĐIỂM)
const EXAM_SHORT = [
  {
    id: 'sh1',
    q: 'Câu 1: Kí hiệu hóa học của nguyên tố nhất thiết phải có trong mọi phân tử hợp chất hữu cơ là gì?',
    accepted: ['c', 'carbon', 'cacbon', 'nguyên tố c'],
    displayAns: 'C (Carbon)',
    exp: 'Thành phần phân tử hợp chất hữu cơ nhất thiết phải chứa nguyên tố Carbon (C).'
  },
  {
    id: 'sh2',
    q: 'Câu 2: Trong phân tử hợp chất hữu cơ, nguyên tố carbon luôn có hóa trị bằng bao nhiêu (ghi bằng số tự nhiên hoặc số La Mã)?',
    accepted: ['4', 'iv', 'bốn', 'hóa trị 4', 'hóa trị iv'],
    displayAns: '4 (hoặc IV)',
    exp: 'Trong phân tử hợp chất hữu cơ, carbon luôn có hóa trị IV (4).'
  },
  {
    id: 'sh3',
    q: 'Câu 3: Trong phân tử Butane (C<sub>4</sub>H<sub>10</sub>), tổng số nguyên tử của các nguyên tố trong một phân tử là bao nhiêu?',
    accepted: ['14', '14 nguyên tử'],
    displayAns: '14',
    exp: 'Phân tử C<sub>4</sub>H<sub>10</sub> có 4 nguyên tử C + 10 nguyên tử H = 14 nguyên tử.'
  },
  {
    id: 'sh4',
    q: 'Câu 4: Trong danh sách 11 chất ở trang 103 SGK (C<sub>6</sub>H<sub>6</sub>, H<sub>2</sub>SO<sub>4</sub>, C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>, H<sub>2</sub>CO<sub>3</sub>, CaCO<sub>3</sub>, KNO<sub>3</sub>, C<sub>2</sub>H<sub>4</sub>, NaOH, Al<sub>2</sub>O<sub>3</sub>, CH<sub>3</sub>Cl, CH<sub>3</sub>OH), có bao nhiêu chất là hợp chất hữu cơ?',
    accepted: ['5', '5 chất', 'năm'],
    displayAns: '5',
    exp: 'Có 5 hợp chất hữu cơ là: C<sub>6</sub>H<sub>6</sub>, C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>, C<sub>2</sub>H<sub>4</sub>, CH<sub>3</sub>Cl, CH<sub>3</sub>OH.'
  },
  {
    id: 'sh5',
    q: 'Câu 5: Trong 6 công thức từ (1) đến (6) ở Hình 22.2 SGK, có bao nhiêu công thức là công thức cấu tạo (CTCT)?',
    accepted: ['4', '4 công thức', 'bốn'],
    displayAns: '4',
    exp: 'Có 4 công thức cấu tạo là (2), (3), (5), (6); còn (1) và (4) là công thức phân tử.'
  },
  {
    id: 'sh6',
    q: 'Câu 6: Công thức phân tử của hai hợp chất (5) Ethylic alcohol (CH<sub>3</sub>&ndash;CH<sub>2</sub>&ndash;OH) và (6) Dimethyl ether (CH<sub>3</sub>&ndash;O&ndash;CH<sub>3</sub>) trong Hình 22.2 là gì?',
    accepted: ['c2h6o', 'c2h6o '],
    displayAns: 'C2H6O',
    exp: 'Cả hai chất (5) và (6) đều có 2 nguyên tử C, 6 nguyên tử H và 1 nguyên tử O nên có cùng CTPT là C<sub>2</sub>H<sub>6</sub>O.'
  },
  {
    id: 'sh7',
    q: 'Câu 7: Trong công thức cấu tạo của Ethylene (CH<sub>2</sub>=CH<sub>2</sub>), liên kết đôi giữa hai nguyên tử carbon được tạo bởi mấy cặp electron dùng chung?',
    accepted: ['2', '2 cặp', 'hai', 'hai cặp'],
    displayAns: '2',
    exp: 'Theo SGK trang 103, liên kết cộng hóa trị giữa hai nguyên tử bằng hai cặp electron dùng chung được gọi là liên kết đôi (=).'
  },
  {
    id: 'sh8',
    q: 'Câu 8: Theo Hình 22.3 SGK, mạch carbon được chia thành mấy dạng cơ bản (mạch hở không phân nhánh, mạch hở phân nhánh, mạch vòng)?',
    accepted: ['3', '3 dạng', 'ba'],
    displayAns: '3',
    exp: 'Hình 22.3 giới thiệu 3 dạng mạch carbon: a) mạch hở không phân nhánh; b) mạch hở phân nhánh; c) mạch vòng.'
  },
  {
    id: 'sh9',
    q: 'Câu 9: Trong 9 chất hữu cơ ở câu hỏi trang 104 SGK (CH<sub>4</sub>, CH<sub>3</sub>Cl, CH<sub>2</sub>=CH<sub>2</sub>, CH<sub>3</sub>CH<sub>2</sub>OH, CH<sub>3</sub>COOH, CH<sub>3</sub>NH<sub>2</sub>, CH<sub>3</sub>CH<sub>2</sub>CH<sub>3</sub>, CH<sub>3</sub>CH=CH<sub>2</sub>, CH<sub>3</sub>COOCH<sub>2</sub>CH<sub>3</sub>), có bao nhiêu chất thuộc nhóm Hydrocarbon?',
    accepted: ['4', '4 chất', 'bốn'],
    displayAns: '4',
    exp: 'Có 4 hydrocarbon (chỉ chứa C và H) là: CH<sub>4</sub>, CH<sub>2</sub>=CH<sub>2</sub>, CH<sub>3</sub>CH<sub>2</sub>CH<sub>3</sub>, CH<sub>3</sub>CH=CH<sub>2</sub>.'
  },
  {
    id: 'sh10',
    q: 'Câu 10: Trong 9 chất hữu cơ ở câu hỏi trang 104 SGK nói trên, có bao nhiêu chất thuộc nhóm Dẫn xuất của hydrocarbon?',
    accepted: ['5', '5 chất', 'năm'],
    displayAns: '5',
    exp: 'Có 5 dẫn xuất của hydrocarbon là: CH<sub>3</sub>Cl, CH<sub>3</sub>CH<sub>2</sub>OH, CH<sub>3</sub>COOH, CH<sub>3</sub>NH<sub>2</sub>, CH<sub>3</sub>COOCH<sub>2</sub>CH<sub>3</sub>.'
  }
];

// PHẦN IV: 10 CÂU TRẮC NGHIỆM GHÉP CỘT (20 ĐIỂM)
const MATCH_OPTIONS_POOL = [
  'Khí hóa lỏng dùng làm nhiên liệu bếp gas (Hình 22.1)',
  'Hợp chất hữu cơ có trong đồ uống có cồn, tác dụng với Na',
  'Hợp chất hữu cơ có trong các loại giấm ăn',
  'Hợp chất hữu cơ dùng làm phân đạm (Wöhler tổng hợp năm 1828)',
  'Hợp chất vô cơ (muối carbonate ngoại lệ của carbon)',
  'Cho biết thành phần nguyên tố và số lượng nguyên tử mỗi nguyên tố',
  'Cho biết trật tự liên kết và cách thức liên kết giữa các nguyên tử',
  'Hợp chất hữu cơ chỉ chứa hai nguyên tố Carbon và Hydrogen',
  'Hợp chất hữu cơ ngoài C còn có O, N, Cl,... và thường có H',
  'Cùng CTPT C2H6O với ethylic alcohol nhưng là chất khí, không tác dụng với Na'
];

const EXAM_MATCH = [
  {
    id: 'mat1',
    left: '1. Butane (C<sub>4</sub>H<sub>10</sub>)',
    ans: 'Khí hóa lỏng dùng làm nhiên liệu bếp gas (Hình 22.1)',
    exp: 'Butane C<sub>4</sub>H<sub>10</sub> là khí hóa lỏng dùng làm nhiên liệu.'
  },
  {
    id: 'mat2',
    left: '2. Ethylic alcohol (C<sub>2</sub>H<sub>5</sub>OH)',
    ans: 'Hợp chất hữu cơ có trong đồ uống có cồn, tác dụng với Na',
    exp: 'Ethylic alcohol có trong đồ uống có cồn, chất lỏng tan vô hạn trong nước và tác dụng với Na.'
  },
  {
    id: 'mat3',
    left: '3. Acetic acid (CH<sub>3</sub>COOH)',
    ans: 'Hợp chất hữu cơ có trong các loại giấm ăn',
    exp: 'Acetic acid là thành phần tạo vị chua trong các loại giấm ăn.'
  },
  {
    id: 'mat4',
    left: '4. Urea – CO(NH<sub>2</sub>)<sub>2</sub>',
    ans: 'Hợp chất hữu cơ dùng làm phân đạm (Wöhler tổng hợp năm 1828)',
    exp: 'Urea là phân đạm phổ biến, được Friedrich Wöhler tổng hợp năm 1828.'
  },
  {
    id: 'mat5',
    left: '5. Calcium carbonate (CaCO<sub>3</sub>)',
    ans: 'Hợp chất vô cơ (muối carbonate ngoại lệ của carbon)',
    exp: 'Các muối carbonate như CaCO<sub>3</sub> là hợp chất vô cơ.'
  },
  {
    id: 'mat6',
    left: '6. Công thức phân tử (CTPT)',
    ans: 'Cho biết thành phần nguyên tố và số lượng nguyên tử mỗi nguyên tố',
    exp: 'Định nghĩa CTPT trang 103 SGK.'
  },
  {
    id: 'mat7',
    left: '7. Công thức cấu tạo (CTCT)',
    ans: 'Cho biết trật tự liên kết và cách thức liên kết giữa các nguyên tử',
    exp: 'Định nghĩa CTCT trang 103 SGK.'
  },
  {
    id: 'mat8',
    left: '8. Hydrocarbon',
    ans: 'Hợp chất hữu cơ chỉ chứa hai nguyên tố Carbon và Hydrogen',
    exp: 'Định nghĩa Hydrocarbon trang 104 SGK.'
  },
  {
    id: 'mat9',
    left: '9. Dẫn xuất của hydrocarbon',
    ans: 'Hợp chất hữu cơ ngoài C còn có O, N, Cl,... và thường có H',
    exp: 'Định nghĩa Dẫn xuất của hydrocarbon trang 104 SGK.'
  },
  {
    id: 'mat10',
    left: '10. Dimethyl ether (CH<sub>3</sub>&ndash;O&ndash;CH<sub>3</sub>)',
    ans: 'Cùng CTPT C2H6O với ethylic alcohol nhưng là chất khí, không tác dụng với Na',
    exp: 'Theo Bảng 22.1 SGK trang 104.'
  }
];

// PHẦN V: 4 CÂU TỰ LUẬN × 5 ĐIỂM = 20 ĐIỂM (MỖI CÂU CÓ 5 TIÊU CHÍ × 1 ĐIỂM)
const EXAM_ESSAY = [
  {
    id: 'ess1',
    q: 'Câu 1 (5 điểm): Nêu khái niệm hợp chất hữu cơ và hóa học hữu cơ. Trong các chất: C<sub>6</sub>H<sub>6</sub>, CaCO<sub>3</sub>, C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>, CO<sub>2</sub>, CH<sub>3</sub>OH, chất nào là hợp chất hữu cơ, chất nào là hợp chất vô cơ? Giải thích.',
    placeholder: 'Nhập câu trả lời của em (nêu khái niệm HCHC, các chất ngoại lệ, khái niệm Hóa học hữu cơ và phân loại 5 chất)...',
    rubrics: [
      { desc: 'Nêu được hợp chất của carbon là hợp chất hữu cơ', keywords: ['hợp chất của carbon', 'hop chat cua carbon', 'chứa carbon', 'chứa nguyên tố carbon'] },
      { desc: 'Nêu được các ngoại lệ vô cơ (trừ CO, CO2, H2CO3, muối carbonate...)', keywords: ['trừ', 'co2', 'carbonate', 'cacbonat', 'h2co3'] },
      { desc: 'Nêu được Hóa học hữu cơ là chuyên ngành nghiên cứu hợp chất hữu cơ', keywords: ['nghiên cứu', 'chuyên ngành', 'hóa học hữu cơ', 'hoa hoc huu co'] },
      { desc: 'Xác định đúng các chất hữu cơ: C6H6, C6H12O6, CH3OH', keywords: ['c6h6', 'c6h12o6', 'ch3oh'] },
      { desc: 'Xác định đúng các chất vô cơ: CaCO3, CO2', keywords: ['caco3', 'co2'] }
    ],
    modelAnswer: '• Hợp chất của carbon là hợp chất hữu cơ, trừ CO, CO<sub>2</sub>, H<sub>2</sub>CO<sub>3</sub>, các muối carbonate,...<br/>• Hóa học hữu cơ là chuyên ngành hóa học nghiên cứu về các hợp chất hữu cơ.<br/>• Chất hữu cơ: <strong>C<sub>6</sub>H<sub>6</sub>, C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>, CH<sub>3</sub>OH</strong>.<br/>• Chất vô cơ: <strong>CaCO<sub>3</sub>, CO<sub>2</sub></strong> (vì là oxide của carbon và muối carbonate ngoại lệ).'
  },
  {
    id: 'ess2',
    q: 'Câu 2 (5 điểm): Phân biệt ý nghĩa của Công thức phân tử (CTPT) và Công thức cấu tạo (CTCT). Hãy viết công thức cấu tạo thu gọn của hai chất có cùng CTPT C<sub>2</sub>H<sub>6</sub>O (ở Hình 22.2 SGK) và giải thích vì sao hai chất này có tính chất hóa học khác nhau (Bảng 22.1).',
    placeholder: 'Nhập câu trả lời của em (ý nghĩa CTPT, ý nghĩa CTCT, 2 CTCT thu gọn của C2H6O và giải thích sự khác nhau về tính chất)...',
    rubrics: [
      { desc: 'Nêu đúng ý nghĩa CTPT (thành phần nguyên tố và số lượng nguyên tử)', keywords: ['thành phần nguyên tố', 'số lượng nguyên tử', 'so luong nguyen tu'] },
      { desc: 'Nêu đúng ý nghĩa CTCT (trật tự liên kết và cách thức liên kết)', keywords: ['trật tự liên kết', 'cách thức liên kết', 'trat tu lien ket'] },
      { desc: 'Viết được CTCT thu gọn của Ethylic alcohol: CH3-CH2-OH (hoặc C2H5OH)', keywords: ['ch3-ch2-oh', 'ch3ch2oh', 'c2h5oh'] },
      { desc: 'Viết được CTCT thu gọn của Dimethyl ether: CH3-O-CH3', keywords: ['ch3-o-ch3', 'ch3och3'] },
      { desc: 'Giải thích do cấu tạo hóa học (trật tự liên kết / nhóm -OH) khác nhau nên tính chất khác nhau (alcohol tác dụng với Na, ether không tác dụng)', keywords: ['cấu tạo', 'nhóm -oh', 'natri', 'tác dụng với na', 'khác nhau'] }
    ],
    modelAnswer: '• <strong>CTPT</strong> cho biết thành phần nguyên tố và số lượng nguyên tử của mỗi nguyên tố trong phân tử.<br/>• <strong>CTCT</strong> cho biết trật tự liên kết và cách thức liên kết giữa các nguyên tử.<br/>• Hai chất ứng với CTPT C<sub>2</sub>H<sub>6</sub>O là: <strong>CH<sub>3</sub>&ndash;CH<sub>2</sub>&ndash;OH</strong> (Ethylic alcohol) và <strong>CH<sub>3</sub>&ndash;O&ndash;CH<sub>3</sub></strong> (Dimethyl ether).<br/>• Hai chất này có tính chất khác nhau (Ethylic alcohol là chất lỏng, tác dụng với Na; Dimethyl ether là chất khí, không tác dụng với Na) vì chúng có <strong>trật tự liên kết (cấu tạo hóa học) khác nhau</strong>.'
  },
  {
    id: 'ess3',
    q: 'Câu 3 (5 điểm): Trình bày các đặc điểm cấu tạo cơ bản của hợp chất hữu cơ (hóa trị của carbon, loại liên kết chủ yếu, các dạng mạch carbon) và viết công thức cấu tạo thu gọn của 2 mạch carbon hở ứng với công thức phân tử C<sub>4</sub>H<sub>10</sub>.',
    placeholder: 'Nhập câu trả lời của em (hóa trị IV của C, liên kết cộng hóa trị, 3 dạng mạch carbon và 2 CTCT của C4H10)...',
    rubrics: [
      { desc: 'Nêu được Carbon luôn có hóa trị IV (4) trong hợp chất hữu cơ', keywords: ['hóa trị iv', 'hóa trị 4', 'hoa tri 4', 'hoa tri iv'] },
      { desc: 'Nêu được liên kết chủ yếu là liên kết cộng hóa trị', keywords: ['cộng hóa trị', 'cong hoa tri'] },
      { desc: 'Kể đủ 3 dạng mạch carbon: mạch hở không phân nhánh (mạch thẳng), mạch hở phân nhánh, mạch vòng', keywords: ['không phân nhánh', 'phân nhánh', 'mạch vòng', 'mach vong'] },
      { desc: 'Viết được CTCT mạch thẳng của C4H10: CH3-CH2-CH2-CH3', keywords: ['ch3-ch2-ch2-ch3', 'ch3ch2ch2ch3'] },
      { desc: 'Viết được CTCT mạch nhánh của C4H10: CH3-CH(CH3)-CH3', keywords: ['ch3-ch(ch3)-ch3', 'ch3ch(ch3)ch3'] }
    ],
    modelAnswer: '• Trong hợp chất hữu cơ, <strong>carbon luôn có hóa trị IV</strong>; liên kết hóa học chủ yếu là <strong>liên kết cộng hóa trị</strong>.<br/>• Các nguyên tử C liên kết với nhau tạo thành <strong>3 dạng mạch carbon</strong>: mạch hở không phân nhánh, mạch hở phân nhánh và mạch vòng.<br/>• Hai công thức cấu tạo mạch hở ứng với C<sub>4</sub>H<sub>10</sub> là:<br/>1) Mạch không phân nhánh: <strong>CH<sub>3</sub>&ndash;CH<sub>2</sub>&ndash;CH<sub>2</sub>&ndash;CH<sub>3</sub></strong><br/>2) Mạch phân nhánh: <strong>CH<sub>3</sub>&ndash;CH(CH<sub>3</sub>)&ndash;CH<sub>3</sub></strong>.'
  },
  {
    id: 'ess4',
    q: 'Câu 4 (5 điểm): Dựa trên thành phần nguyên tố, hợp chất hữu cơ được phân thành mấy loại? Nêu định nghĩa và phân loại 6 chất sau vào đúng nhóm: CH<sub>4</sub>, CH<sub>3</sub>Cl, CH<sub>2</sub>=CH<sub>2</sub>, CH<sub>3</sub>CH<sub>2</sub>OH, CH<sub>3</sub>COOH, CH<sub>3</sub>CH<sub>2</sub>CH<sub>3</sub>.',
    placeholder: 'Nhập câu trả lời của em (2 loại hợp chất hữu cơ, định nghĩa Hydrocarbon, Dẫn xuất của hydrocarbon và phân loại 6 chất)...',
    rubrics: [
      { desc: 'Nêu được 2 loại: Hydrocarbon và Dẫn xuất của hydrocarbon', keywords: ['hydrocarbon', 'dẫn xuất', 'dan xuat'] },
      { desc: 'Định nghĩa đúng Hydrocarbon (chỉ chứa 2 nguyên tố C và H)', keywords: ['chỉ chứa', 'carbon và hydrogen', 'c và h'] },
      { desc: 'Định nghĩa đúng Dẫn xuất của hydrocarbon (ngoài C còn có nguyên tố khác như O, N, Cl...)', keywords: ['ngoài', 'oxygen', 'chlorine', 'nguyên tố khác'] },
      { desc: 'Phân loại đúng nhóm Hydrocarbon: CH4, CH2=CH2, CH3CH2CH3', keywords: ['ch4', 'ch2=ch2', 'ch3ch2ch3'] },
      { desc: 'Phân loại đúng nhóm Dẫn xuất: CH3Cl, CH3CH2OH, CH3COOH', keywords: ['ch3cl', 'ch3ch2oh', 'ch3cooh'] }
    ],
    modelAnswer: '• Hợp chất hữu cơ được chia làm <strong>2 loại</strong>:<br/>1) <strong>Hydrocarbon:</strong> chỉ chứa hai nguyên tố carbon (C) và hydrogen (H). Gồm: <strong>CH<sub>4</sub>, CH<sub>2</sub>=CH<sub>2</sub>, CH<sub>3</sub>CH<sub>2</sub>CH<sub>3</sub></strong>.<br/>2) <strong>Dẫn xuất của hydrocarbon:</strong> ngoài nguyên tố C còn có nguyên tố khác như O, N, Cl,... và thường có H. Gồm: <strong>CH<sub>3</sub>Cl, CH<sub>3</sub>CH<sub>2</sub>OH, CH<sub>3</sub>COOH</strong>.'
  }
];

function renderExamQuestions() {
  // 1. Render Phần I: Nhiều lựa chọn (10 câu × 2đ)
  const mcqList = document.getElementById('mcq-questions-list');
  mcqList.innerHTML = EXAM_MCQ.map((item, idx) => `
    <div class="question-card" id="card-${item.id}">
      <div class="q-header">
        <span class="q-number">Phần I • Câu ${idx + 1}/10</span>
        <span class="q-points">2 điểm</span>
      </div>
      <div class="q-text">${item.q}</div>
      <div class="options-grid">
        ${item.options.map((opt, optIdx) => `
          <label class="option-label">
            <input type="radio" name="${item.id}" value="${optIdx}" class="exam-input" />
            <span>${opt}</span>
          </label>
        `).join('')}
      </div>
      <div id="fb-${item.id}" class="feedback-box" role="status"></div>
    </div>
  `).join('');

  // 2. Render Phần II: Đúng / Sai (10 câu × 2đ)
  const tfList = document.getElementById('tf-questions-list');
  tfList.innerHTML = EXAM_TF.map((item, idx) => `
    <div class="question-card" id="card-${item.id}">
      <div class="q-header">
        <span class="q-number">Phần II • Câu ${idx + 1}/10</span>
        <span class="q-points">2 điểm</span>
      </div>
      <div class="q-text">${item.q}</div>
      <div class="options-grid" style="max-width: 440px;">
        <label class="option-label">
          <input type="radio" name="${item.id}" value="true" class="exam-input" />
          <span>✅ Đúng</span>
        </label>
        <label class="option-label">
          <input type="radio" name="${item.id}" value="false" class="exam-input" />
          <span>❌ Sai</span>
        </label>
      </div>
      <div id="fb-${item.id}" class="feedback-box" role="status"></div>
    </div>
  `).join('');

  // 3. Render Phần III: Trả lời ngắn (10 câu × 2đ)
  const shortList = document.getElementById('short-questions-list');
  shortList.innerHTML = EXAM_SHORT.map((item, idx) => `
    <div class="question-card" id="card-${item.id}">
      <div class="q-header">
        <span class="q-number">Phần III • Câu ${idx + 1}/10</span>
        <span class="q-points">2 điểm</span>
      </div>
      <div class="q-text">${item.q}</div>
      <input
        type="text"
        id="input-${item.id}"
        class="form-input exam-input"
        placeholder="Nhập câu trả lời ngắn..."
        style="max-width: 380px;"
      />
      <div id="fb-${item.id}" class="feedback-box" role="status"></div>
    </div>
  `).join('');

  // 4. Render Phần IV: Ghép cột (10 câu × 2đ)
  const matchList = document.getElementById('match-questions-list');
  matchList.innerHTML = EXAM_MATCH.map((item, idx) => `
    <div class="question-card" id="card-${item.id}">
      <div class="q-header">
        <span class="q-number">Phần IV • Ghép cột ${idx + 1}/10</span>
        <span class="q-points">2 điểm</span>
      </div>
      <div class="matching-row" style="border:none; padding:0; margin:0;">
        <div class="q-text" style="margin-bottom:0;">${item.left}</div>
        <div>
          <select id="select-${item.id}" class="matching-select exam-input">
            <option value="">-- Chọn mô tả tương ứng ở Cột B --</option>
            ${MATCH_OPTIONS_POOL.map((opt) => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="fb-${item.id}" class="feedback-box" role="status"></div>
    </div>
  `).join('');

  // 5. Render Phần V: Tự luận (4 câu × 5đ = 20đ)
  const essayList = document.getElementById('essay-questions-list');
  essayList.innerHTML = EXAM_ESSAY.map((item, idx) => `
    <div class="question-card" id="card-${item.id}">
      <div class="q-header">
        <span class="q-number">Phần V • Tự luận ${idx + 1}/4</span>
        <span class="q-points">5 điểm</span>
      </div>
      <div class="q-text">${item.q}</div>
      <textarea
        id="textarea-${item.id}"
        class="essay-textarea exam-input"
        placeholder="${item.placeholder}"
      ></textarea>
      <div id="fb-${item.id}" class="feedback-box" role="status"></div>
    </div>
  `).join('');

  // Khôi phục bản nháp bài làm nếu học sinh lỡ tải lại trang trên điện thoại / máy tính
  restoreExamDraft();

  // Lắng nghe thay đổi để đếm số câu đã làm & tự động lưu nháp
  document.querySelectorAll('.exam-input').forEach((el) => {
    el.addEventListener('change', () => {
      updateAnsweredCounter();
      saveExamDraft();
    });
    el.addEventListener('input', () => {
      updateAnsweredCounter();
      saveExamDraft();
    });
  });

  updateAnsweredCounter();
}

function saveExamDraft() {
  try {
    const draft = { mcq: {}, tf: {}, short: {}, match: {}, essay: {} };
    EXAM_MCQ.forEach((item) => {
      const checked = document.querySelector(`input[name="${item.id}"]:checked`);
      if (checked) draft.mcq[item.id] = checked.value;
    });
    EXAM_TF.forEach((item) => {
      const checked = document.querySelector(`input[name="${item.id}"]:checked`);
      if (checked) draft.tf[item.id] = checked.value;
    });
    EXAM_SHORT.forEach((item) => {
      const inp = document.getElementById(`input-${item.id}`);
      if (inp && inp.value) draft.short[item.id] = inp.value;
    });
    EXAM_MATCH.forEach((item) => {
      const sel = document.getElementById(`select-${item.id}`);
      if (sel && sel.value) draft.match[item.id] = sel.value;
    });
    EXAM_ESSAY.forEach((item) => {
      const ta = document.getElementById(`textarea-${item.id}`);
      if (ta && ta.value) draft.essay[item.id] = ta.value;
    });
    localStorage.setItem(STORAGE_KEYS.EXAM_DRAFT, JSON.stringify(draft));
  } catch (e) {
    // Ignore storage quota errors
  }
}

function restoreExamDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAM_DRAFT);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (!draft) return;

    if (draft.mcq) {
      Object.entries(draft.mcq).forEach(([id, val]) => {
        const r = document.querySelector(`input[name="${id}"][value="${val}"]`);
        if (r) r.checked = true;
      });
    }
    if (draft.tf) {
      Object.entries(draft.tf).forEach(([id, val]) => {
        const r = document.querySelector(`input[name="${id}"][value="${val}"]`);
        if (r) r.checked = true;
      });
    }
    if (draft.short) {
      Object.entries(draft.short).forEach(([id, val]) => {
        const inp = document.getElementById(`input-${id}`);
        if (inp) inp.value = val;
      });
    }
    if (draft.match) {
      Object.entries(draft.match).forEach(([id, val]) => {
        const sel = document.getElementById(`select-${id}`);
        if (sel) sel.value = val;
      });
    }
    if (draft.essay) {
      Object.entries(draft.essay).forEach(([id, val]) => {
        const ta = document.getElementById(`textarea-${id}`);
        if (ta) ta.value = val;
      });
    }
  } catch (e) {
    // Ignore malformed draft
  }
}

function updateAnsweredCounter() {
  let count = 0;

  EXAM_MCQ.forEach((item) => {
    const checked = document.querySelector(`input[name="${item.id}"]:checked`);
    const card = document.getElementById(`card-${item.id}`);
    if (checked) {
      count++;
      card.classList.add('answered');
    } else {
      card.classList.remove('answered');
    }
  });

  EXAM_TF.forEach((item) => {
    const checked = document.querySelector(`input[name="${item.id}"]:checked`);
    const card = document.getElementById(`card-${item.id}`);
    if (checked) {
      count++;
      card.classList.add('answered');
    } else {
      card.classList.remove('answered');
    }
  });

  EXAM_SHORT.forEach((item) => {
    const inp = document.getElementById(`input-${item.id}`);
    const card = document.getElementById(`card-${item.id}`);
    if (inp && inp.value.trim() !== '') {
      count++;
      card.classList.add('answered');
    } else {
      card.classList.remove('answered');
    }
  });

  EXAM_MATCH.forEach((item) => {
    const sel = document.getElementById(`select-${item.id}`);
    const card = document.getElementById(`card-${item.id}`);
    if (sel && sel.value.trim() !== '') {
      count++;
      card.classList.add('answered');
    } else {
      card.classList.remove('answered');
    }
  });

  EXAM_ESSAY.forEach((item) => {
    const ta = document.getElementById(`textarea-${item.id}`);
    const card = document.getElementById(`card-${item.id}`);
    if (ta && ta.value.trim() !== '') {
      count++;
      card.classList.add('answered');
    } else {
      card.classList.remove('answered');
    }
  });

  const counterEl = document.getElementById('answered-count-text');
  if (counterEl) counterEl.textContent = `${count} / 44`;
}

function initExamTabsAndActions() {
  const partTabs = document.querySelectorAll('.exam-part-tab');
  const panels = document.querySelectorAll('.exam-part-panel');

  partTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      partTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-part');

      if (target === 'part-all') {
        panels.forEach((p) => p.classList.remove('hidden'));
      } else {
        panels.forEach((p) => p.classList.toggle('hidden', p.id !== target));
      }
    });
  });

  const scrollBtn = document.getElementById('scroll-to-submit-btn');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      document.getElementById('submit-exam-zone').scrollIntoView({ behavior: 'smooth' });
    });
  }

  const submitBtn = document.getElementById('submit-exam-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', gradeAndSubmitExam);
  }

  const retryBtn = document.getElementById('retry-exam-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      document.querySelectorAll('input[type="radio"].exam-input').forEach((r) => (r.checked = false));
      document.querySelectorAll('input[type="text"].exam-input, textarea.exam-input, select.exam-input').forEach((i) => (i.value = ''));
      document.querySelectorAll('#sec-challenge .feedback-box').forEach((fb) => {
        fb.className = 'feedback-box';
        fb.innerHTML = '';
      });
      localStorage.removeItem(STORAGE_KEYS.EXAM_DRAFT);
      document.getElementById('exam-result-panel').classList.add('hidden');
      retryBtn.classList.add('hidden');
      document.getElementById('gas-sync-status').textContent = '';
      state.examStartTime = Date.now();
      updateAnsweredCounter();
      document.getElementById('sec-challenge').scrollIntoView({ behavior: 'smooth' });
    });
  }
}

function gradeAndSubmitExam() {
  let mcqScore = 0;
  let tfScore = 0;
  let shortScore = 0;
  let matchScore = 0;
  let essayScore = 0;
  let correctObjectiveCount = 0;

  const detailsRecord = {};
  const essaySummaries = [];

  // Mở toàn bộ 5 phần để học sinh đối chiếu kết quả
  document.querySelectorAll('.exam-part-panel').forEach((p) => p.classList.remove('hidden'));
  document.querySelectorAll('.exam-part-tab').forEach((t) => {
    t.classList.toggle('active', t.getAttribute('data-part') === 'part-all');
  });

  // 1. Chấm Phần I: Nhiều lựa chọn (10 câu × 2đ = 20đ)
  EXAM_MCQ.forEach((item) => {
    const checked = document.querySelector(`input[name="${item.id}"]:checked`);
    const fb = document.getElementById(`fb-${item.id}`);
    const userVal = checked ? Number(checked.value) : -1;
    const isCorrect = userVal === item.ans;

    if (isCorrect) {
      mcqScore += 2;
      correctObjectiveCount++;
      fb.className = 'feedback-box show correct';
      fb.innerHTML = `🌟 <strong>Chính xác! (+2 điểm)</strong> — ${item.exp}`;
    } else {
      fb.className = 'feedback-box show wrong';
      fb.innerHTML = `💡 <strong>Chưa đúng! (0 điểm)</strong> Đáp án đúng là: <strong>${item.options[item.ans]}</strong>.<br/><em>Giải thích: ${item.exp}</em>`;
    }
    detailsRecord[item.id] = { user: userVal, score: isCorrect ? 2 : 0 };
  });

  // 2. Chấm Phần II: Đúng / Sai (10 câu × 2đ = 20đ)
  EXAM_TF.forEach((item) => {
    const checked = document.querySelector(`input[name="${item.id}"]:checked`);
    const fb = document.getElementById(`fb-${item.id}`);
    const userBool = checked ? checked.value === 'true' : null;
    const isCorrect = userBool === item.ans;

    if (isCorrect) {
      tfScore += 2;
      correctObjectiveCount++;
      fb.className = 'feedback-box show correct';
      fb.innerHTML = `🌟 <strong>Chính xác! (+2 điểm)</strong> — ${item.exp}`;
    } else {
      fb.className = 'feedback-box show wrong';
      fb.innerHTML = `💡 <strong>Chưa đúng! (0 điểm)</strong> Đáp án chuẩn là: <strong>${item.ans ? 'Đúng' : 'Sai'}</strong>.<br/><em>Giải thích: ${item.exp}</em>`;
    }
    detailsRecord[item.id] = { user: userBool, score: isCorrect ? 2 : 0 };
  });

  // 3. Chấm Phần III: Trả lời ngắn (10 câu × 2đ = 20đ)
  EXAM_SHORT.forEach((item) => {
    const inp = document.getElementById(`input-${item.id}`);
    const fb = document.getElementById(`fb-${item.id}`);
    const rawVal = inp ? inp.value.trim() : '';
    const normVal = normalizeVietnameseText(rawVal);
    const isCorrect = item.accepted.some((acc) => normalizeVietnameseText(acc) === normVal);

    if (isCorrect) {
      shortScore += 2;
      correctObjectiveCount++;
      fb.className = 'feedback-box show correct';
      fb.innerHTML = `🌟 <strong>Chính xác! (+2 điểm)</strong> Đáp án chuẩn: <strong>${item.displayAns}</strong> — ${item.exp}`;
    } else {
      fb.className = 'feedback-box show wrong';
      fb.innerHTML = `💡 <strong>Chưa đúng! (0 điểm)</strong> Đáp án chuẩn là: <strong>${item.displayAns}</strong>.<br/><em>Giải thích: ${item.exp}</em>`;
    }
    detailsRecord[item.id] = { user: rawVal, score: isCorrect ? 2 : 0 };
  });

  // 4. Chấm Phần IV: Ghép cột (10 câu × 2đ = 20đ)
  EXAM_MATCH.forEach((item) => {
    const sel = document.getElementById(`select-${item.id}`);
    const fb = document.getElementById(`fb-${item.id}`);
    const userChoice = sel ? sel.value : '';
    const isCorrect = userChoice === item.ans;

    if (isCorrect) {
      matchScore += 2;
      correctObjectiveCount++;
      fb.className = 'feedback-box show correct';
      fb.innerHTML = `🌟 <strong>Chính xác! (+2 điểm)</strong> — ${item.exp}`;
    } else {
      fb.className = 'feedback-box show wrong';
      fb.innerHTML = `💡 <strong>Chưa đúng! (0 điểm)</strong> Ghép đúng phải là: <strong>"${item.ans}"</strong>.<br/><em>Giải thích: ${item.exp}</em>`;
    }
    detailsRecord[item.id] = { user: userChoice, score: isCorrect ? 2 : 0 };
  });

  // 5. Chấm Phần V: Tự luận (4 câu × 5 điểm = 20 điểm)
  EXAM_ESSAY.forEach((item, idx) => {
    const ta = document.getElementById(`textarea-${item.id}`);
    const fb = document.getElementById(`fb-${item.id}`);
    const rawEssay = ta ? ta.value.trim() : '';
    const normEssay = normalizeVietnameseText(rawEssay);

    let qPoints = 0;
    const matchedCriteria = [];
    const missedCriteria = [];

    if (normEssay.length >= 6) {
      item.rubrics.forEach((rubric) => {
        const hit = rubric.keywords.some((kw) => normEssay.includes(normalizeVietnameseText(kw)));
        if (hit) {
          qPoints += 1;
          matchedCriteria.push(rubric.desc);
        } else {
          missedCriteria.push(rubric.desc);
        }
      });
    } else {
      item.rubrics.forEach((r) => missedCriteria.push(r.desc));
    }

    essayScore += qPoints;
    essaySummaries.push(`Câu ${idx + 1} (${qPoints}/5đ): ${rawEssay || '[Trống]'}`);
    detailsRecord[item.id] = { user: rawEssay, score: qPoints };

    const isGood = qPoints >= 3;
    fb.className = `feedback-box show ${isGood ? 'correct' : 'wrong'}`;
    fb.innerHTML = `
      <div><strong>${qPoints === 5 ? '🌟 Tuyệt vời!' : '📝 Kết quả chấm Tự luận:'} Đạt ${qPoints} / 5 điểm</strong></div>
      ${matchedCriteria.length ? `<div style="margin-top:4px;">✅ <strong>Ý đúng đã nêu được:</strong> ${matchedCriteria.join('; ')}.</div>` : ''}
      ${missedCriteria.length ? `<div style="margin-top:4px;">💡 <strong>Ý cần bổ sung:</strong> ${missedCriteria.join('; ')}.</div>` : ''}
      <div style="margin-top:8px; padding-top:6px; border-top:1px dashed currentColor;">
        <strong>📘 Đáp án chuẩn SGK:</strong><br/>${item.modelAnswer}
      </div>
    `;
  });

  const totalScore = mcqScore + tfScore + shortScore + matchScore + essayScore;
  const durationSeconds = Math.round((Date.now() - state.examStartTime) / 1000);

  let badgeTitle = '🌱 NHÀ HÓA HỌC TRẺ ĐẦY NỖ LỰC!';
  let encouragement = 'Em hãy xem kỹ lời giải chi tiết ở từng câu phía trên và thử sức lại để chinh phục điểm tối đa 100/100 nhé!';

  if (totalScore >= 90) {
    badgeTitle = '🏆 BẬC THẦY HÓA HỌC HỮU CƠ XUẤT SẮC!';
    encouragement = 'Quá đỉnh! Em đã nắm vững toàn diện Bài 22 từ khái niệm hợp chất hữu cơ, công thức cấu tạo, mạch carbon đến phân loại hydrocarbon!';
  } else if (totalScore >= 75) {
    badgeTitle = '🥇 CHUYÊN GIA PHÂN TỬ CARBON!';
    encouragement = 'Rất đáng khen! Kiến thức Bài 22 của em rất chắc chắn, chỉ cần lưu ý thêm vài chi tiết nhỏ là đạt tuyệt đối 100 điểm!';
  } else if (totalScore >= 50) {
    badgeTitle = '🥈 NHÀ THÁM HIỂM HỮU CƠ TIỀM NĂNG!';
    encouragement = 'Em đã nắm được nền tảng cơ bản! Hãy ôn lại các chất ngoại lệ vô cơ và cách phân loại Hydrocarbon để bứt phá hơn nhé!';
  }

  // Hiển thị kết quả
  document.getElementById('result-badge-title').textContent = badgeTitle;
  document.getElementById('result-student-info').textContent = `Học sinh: ${state.studentName} | Lớp: ${state.studentClass} | Thời gian hoàn thành: ${durationSeconds} giây`;
  document.getElementById('result-total-score').textContent = totalScore;
  document.getElementById('result-correct-summary').textContent = `📊 Trắc nghiệm đúng: ${correctObjectiveCount} / 40 câu (${mcqScore + tfScore + shortScore + matchScore}/80 điểm) | Tự luận: ${essayScore}/20 điểm`;

  document.getElementById('score-part1').textContent = `${mcqScore} / 20`;
  document.getElementById('score-part2').textContent = `${tfScore} / 20`;
  document.getElementById('score-part3').textContent = `${shortScore} / 20`;
  document.getElementById('score-part4').textContent = `${matchScore} / 20`;
  document.getElementById('score-part5').textContent = `${essayScore} / 20`;
  document.getElementById('result-encouragement').textContent = encouragement;

  const resultPanel = document.getElementById('exam-result-panel');
  resultPanel.classList.remove('hidden');
  document.getElementById('retry-exam-btn').classList.remove('hidden');
  resultPanel.scrollIntoView({ behavior: 'smooth' });

  markMilestone('exam_submitted', 25);

  // Tự động gửi dữ liệu lên Google Apps Script
  sendResultsToGoogleSheets({
    studentName: state.studentName,
    studentClass: state.studentClass,
    totalScore,
    badgeTitle,
    mcqScore,
    tfScore,
    shortScore,
    matchScore,
    essayScore,
    durationSeconds,
    essaySummary: essaySummaries.join(' | '),
    detailsJson: JSON.stringify(detailsRecord)
  });
}

/* ==========================================================================
   6. ĐỒNG BỘ DỮ LIỆU GOOGLE APPS SCRIPT (GOOGLE SHEETS)
   ========================================================================== */
async function sendResultsToGoogleSheets(payload) {
  const statusEl = document.getElementById('gas-sync-status');
  const gasUrl = (localStorage.getItem(STORAGE_KEYS.GAS_URL) || DEFAULT_GAS_WEB_APP_URL).trim();

  if (!gasUrl) {
    statusEl.style.color = '#B45309';
    statusEl.innerHTML = 'ℹ️ Đã chấm điểm tự động! (Để gửi bảng điểm lên Google Sheets, hãy nhấn nút <strong>"⚙️ Google Sheet"</strong> trên thanh công cụ để dán Web App URL).';
    return;
  }

  statusEl.style.color = '#0284C7';
  statusEl.textContent = '⏳ Đang gửi điểm số và bài làm lên Google Sheets của Giáo viên...';

  try {
    await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    statusEl.style.color = '#059669';
    statusEl.innerHTML = `✅ Đã đồng bộ kết quả (<strong>${payload.totalScore}/100 điểm</strong>) của học sinh <strong>${payload.studentName} (${payload.studentClass})</strong> lên Google Sheets thành công!`;
  } catch (err) {
    statusEl.style.color = '#DC2626';
    statusEl.innerHTML = '⚠️ Không thể kết nối tới Google Apps Script URL. Vui lòng kiểm tra lại cấu hình trong mục "⚙️ Google Sheet".';
  }
}

function initGasModal() {
  const modal = document.getElementById('gas-modal');
  const openBtn = document.getElementById('open-gas-modal-btn');
  const closeBtn = document.getElementById('close-gas-modal-btn');
  const saveBtn = document.getElementById('save-gas-url-btn');
  const copyCodeBtn = document.getElementById('copy-gas-code-btn');
  const urlInput = document.getElementById('gas-url-input');
  const feedback = document.getElementById('gas-save-feedback');

  if (!modal || !openBtn) return;

  urlInput.value = localStorage.getItem(STORAGE_KEYS.GAS_URL) || DEFAULT_GAS_WEB_APP_URL;

  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  saveBtn.addEventListener('click', () => {
    const val = urlInput.value.trim();
    localStorage.setItem(STORAGE_KEYS.GAS_URL, val);
    feedback.className = 'feedback-box show correct';
    feedback.textContent = val
      ? '✅ Đã lưu đường dẫn Google Apps Script Web App URL thành công!'
      : 'ℹ️ Đã xóa URL kết nối Google Apps Script.';
  });

  copyCodeBtn.addEventListener('click', async () => {
    const sampleGasCode = `const SHEET_NAME = 'KetQua_Bai22_KHTN9';
function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Thời gian nộp','Họ và tên học sinh','Lớp','Tổng điểm (/100)','Danh hiệu','Điểm TN Nhiều lựa chọn (/20)','Điểm TN Đúng/Sai (/20)','Điểm TN Trả lời ngắn (/20)','Điểm TN Ghép cột (/20)','Điểm Tự luận (/20)','Thời gian làm (giây)','Bài làm Tự luận (4 câu)']);
  }
  const data = JSON.parse(e.postData.contents);
  const time = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
  sheet.appendRow([time, data.studentName, data.studentClass, data.totalScore, data.badgeTitle, data.mcqScore, data.tfScore, data.shortScore, data.matchScore, data.essayScore, data.durationSeconds, data.essaySummary]);
  return ContentService.createTextOutput(JSON.stringify({status:'success'})).setMimeType(ContentService.MimeType.JSON);
}`;
    try {
      await navigator.clipboard.writeText(sampleGasCode);
      feedback.className = 'feedback-box show correct';
      feedback.textContent = '📋 Đã sao chép mã nguồn Google Apps Script (Code.gs) vào bộ nhớ tạm!';
    } catch (e) {
      feedback.className = 'feedback-box show wrong';
      feedback.textContent = 'Bạn có thể mở trực tiếp tệp google-apps-script/Code.gs trong thư mục dự án để sao chép.';
    }
  });
}

/* ==========================================================================
   7. ĐIỀU HƯỚNG & HOÀN THÀNH BÀI HỌC
   ========================================================================== */
function initNavigationAndSummary() {
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      navTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const secId = tab.getAttribute('data-sec');
      const sec = secId ? document.getElementById(secId) : null;
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Tự động đánh dấu tab mục đang xem khi cuộn trang trên điện thoại / máy tính
  if ('IntersectionObserver' in window) {
    const sections = document.querySelectorAll('.lesson-section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const activeId = entry.target.id;
            navTabs.forEach((t) => {
              const isMatch = t.getAttribute('data-sec') === activeId;
              t.classList.toggle('active', isMatch);
            });
          }
        });
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0.05 }
    );
    sections.forEach((sec) => observer.observe(sec));
  }

  const completeBtn = document.getElementById('complete-lesson-btn');
  const completeBanner = document.getElementById('lesson-complete-banner');
  if (completeBtn && completeBanner) {
    completeBtn.addEventListener('click', () => {
      // Đánh dấu hoàn thành tất cả các mốc để đạt 100%
      [
        'login_done',
        'warmup_fig22',
        'warmup_quiz',
        'mod1_quick',
        'mod2_condensed',
        'mod3_na_lab',
        'act1_done',
        'act2_done',
        'act3_done',
        'exam_submitted'
      ].forEach((m) => markMilestone(m, 5));
      completeBanner.classList.add('show');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initLoginSystem();
  initWarmupSection();
  initKnowledgeModules();
  initPracticeActivities();
  renderExamQuestions();
  initExamTabsAndActions();
  initGasModal();
  initNavigationAndSummary();
});
