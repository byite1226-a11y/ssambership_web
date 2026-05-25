/**
 * screenshots/*.png → review_report.html
 * node scripts/generate-review-report.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "screenshots");
const OUT_HTML = path.join(OUT_DIR, "review_report.html");

const PRIMARY = "#1A56DB";

/** @type {{ category: string; items: { file: string; label: string; forceMissing?: boolean }[] }[]} */
const SECTIONS = [
  {
    category: "공개",
    items: [
      { file: "guest_landing.png", label: "랜딩" },
      { file: "guest_login.png", label: "로그인" },
      { file: "guest_signup.png", label: "회원가입" },
      { file: "guest_mentors.png", label: "멘토 찾기" },
      { file: "guest_mentor_detail.png", label: "멘토 상세" },
      { file: "student_subscribe.png", label: "구독 요금제" },
      { file: "guest_community.png", label: "커뮤니티 홈" },
      { file: "guest_community_shortform.png", label: "숏폼 목록" },
    ],
  },
  {
    category: "학생",
    items: [
      { file: "student_question_room.png", label: "질문방" },
      { file: "student_question_room_thread_detail.png", label: "질문방 스레드 상세" },
      { file: "student_mypage.png", label: "마이페이지" },
      { file: "student_wallet_charge.png", label: "캐시 충전" },
      { file: "wallet_charge_success.png", label: "충전 성공" },
      { file: "wallet_charge_fail.png", label: "충전 실패" },
      { file: "student_wallet_ledger.png", label: "캐시 사용내역" },
      { file: "subscribe_success.png", label: "구독 성공" },
      { file: "guest_custom_request.png", label: "맞춤의뢰 홈" },
      { file: "student_custom_request_new.png", label: "맞춤의뢰 등록" },
      { file: "student_cr_waiting.png", label: "지원 대기" },
      { file: "student_custom_request_select.png", label: "멘토 선택" },
      { file: "student_custom_request_order.png", label: "주문방" },
      { file: "student_custom_request_delivery.png", label: "납품 검토" },
      { file: "student_cr_complete.png", label: "주문 완료" },
      { file: "student_custom_request_posts.png", label: "내 의뢰 목록" },
    ],
  },
  {
    category: "멘토",
    items: [
      { file: "mentor_dashboard.png", label: "대시보드" },
      { file: "mentor_question_room.png", label: "질문방" },
      { file: "mentor_custom_request_dashboard.png", label: "맞춤의뢰 대시보드" },
      { file: "mentor_custom_request_posts.png", label: "새 의뢰 목록" },
      { file: "mentor_custom_request_post_detail.png", label: "의뢰 상세" },
      { file: "mentor_custom_request_apply.png", label: "지원서 작성" },
      { file: "mentor_custom_request_accepted_list.png", label: "수락된 의뢰" },
      { file: "mentor_custom_request_inprogress_list.png", label: "진행 중 의뢰" },
      { file: "mentor_custom_request_workroom.png", label: "작업방" },
      { file: "mentor_cr_files.png", label: "작업 파일" },
      { file: "mentor_cr_waiting_review.png", label: "납품 대기" },
      { file: "mentor_cr_revision.png", label: "수정 요청" },
      { file: "mentor_custom_request_done_list.png", label: "종료된 의뢰" },
      { file: "mentor_profile_edit.png", label: "프로필 수정" },
      { file: "mentor_payouts.png", label: "정산" },
      { file: "mentor_payouts_detail.png", label: "정산 상세" },
      { file: "mentor_reviews.png", label: "리뷰" },
      { file: "mentor_community_shortform_new.png", label: "숏폼 업로드" },
    ],
  },
  {
    category: "커뮤니티",
    items: [
      { file: "student_community_board.png", label: "게시판 목록" },
      { file: "community_board_detail.png", label: "게시판 상세" },
      { file: "student_community_new.png", label: "글 작성" },
      { file: "student_community_shortform.png", label: "숏폼" },
      { file: "community_shortform_detail.png", label: "숏폼 상세", forceMissing: true },
    ],
  },
  {
    category: "관리자",
    items: [
      { file: "admin_dashboard.png", label: "대시보드" },
      { file: "admin_mentor_approval.png", label: "멘토 승인" },
      { file: "admin_moderation.png", label: "콘텐츠 검수" },
      { file: "admin_reviews.png", label: "리뷰 관리" },
      { file: "admin_disputes.png", label: "분쟁" },
      { file: "admin_refunds.png", label: "환불/정산" },
      { file: "admin_logs.png", label: "활동 로그" },
      { file: "admin_notices.png", label: "공지" },
      { file: "admin_settings.png", label: "설정" },
    ],
  },
];

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cardHtml(item, hasFile) {
  const id = item.file.replace(/[^a-z0-9_-]/gi, "_");
  const src = `./${item.file}`;
  const thumb = hasFile
    ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(item.label)}" loading="lazy" />`
    : `<div class="no-shot">스크린샷 없음</div>`;

  return `
    <article class="card" data-file="${escapeHtml(item.file)}" data-label="${escapeHtml(item.label)}" id="card-${id}">
      <div class="thumb">${thumb}</div>
      <div class="meta">
        <h3 class="label">${escapeHtml(item.label)}</h3>
        <p class="fname">${escapeHtml(item.file)}</p>
        <div class="checks">
          <label><input type="radio" name="status-${id}" value="pending" class="status-radio" checked /> 미확인</label>
          <label><input type="radio" name="status-${id}" value="ok" class="status-radio" /> 이상없음</label>
          <label><input type="radio" name="status-${id}" value="issue" class="status-radio" /> 이슈있음</label>
        </div>
        <textarea class="issue-note hidden" placeholder="이슈 내용을 입력하세요" rows="2"></textarea>
      </div>
    </article>`;
}

function buildHtml() {
  const allItems = SECTIONS.flatMap((s) => s.items);
  const total = allItems.length;
  const generatedAt = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  const sectionsHtml = SECTIONS.map((section) => {
    const cards = section.items
      .map((item) => {
        const hasFile = !item.forceMissing && fs.existsSync(path.join(OUT_DIR, item.file));
        return cardHtml(item, hasFile);
      })
      .join("\n");
    return `
      <section class="section">
        <h2 class="section-title">${escapeHtml(section.category)}</h2>
        <div class="grid">${cards}</div>
      </section>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>쌤버십 화면 검토 보고서</title>
  <style>
    :root { --primary: ${PRIMARY}; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif; background: #f3f4f6; color: #111827; }
    .summary-bar {
      position: fixed; top: 0; right: 0; z-index: 50;
      background: white; border: 1px solid #e5e7eb; border-radius: 0 0 0 12px;
      padding: 12px 16px; box-shadow: 0 4px 12px rgba(0,0,0,.08);
      font-size: 13px; font-weight: 700; min-width: 140px;
    }
    .summary-bar span { display: block; margin: 2px 0; }
    .summary-bar .ok { color: #059669; }
    .summary-bar .issue { color: #dc2626; }
    .summary-bar .pending { color: #6b7280; }
    header.page-header {
      background: linear-gradient(135deg, var(--primary), #3F83F8);
      color: white; padding: 32px 24px 28px; margin-bottom: 24px;
    }
    header.page-header h1 { margin: 0 0 8px; font-size: 28px; }
    header.page-header p { margin: 4px 0; opacity: .95; font-size: 14px; }
    main { max-width: 1200px; margin: 0 auto; padding: 0 20px 80px; padding-top: 8px; }
    .section { margin-bottom: 40px; }
    .section-title {
      font-size: 20px; font-weight: 900; color: var(--primary);
      border-bottom: 3px solid var(--primary); padding-bottom: 8px; margin-bottom: 16px;
    }
    .grid {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;
    }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
    .card {
      background: white; border: 1px solid #e5e7eb; border-radius: 12px;
      overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.06);
    }
    .card.issue-active { border-color: #fecaca; box-shadow: 0 0 0 2px #fee2e2; }
    .card.ok-active { border-color: #bbf7d0; }
    .thumb img { width: 100%; display: block; border-bottom: 1px solid #f3f4f6; }
    .no-shot {
      height: 200px; display: flex; align-items: center; justify-content: center;
      background: #f3f4f6; color: #9ca3af; font-weight: 700; font-size: 14px;
      border-bottom: 1px solid #e5e7eb;
    }
    .meta { padding: 12px 14px 14px; }
    .label { margin: 0 0 4px; font-size: 15px; font-weight: 800; }
    .fname { margin: 0 0 10px; font-size: 11px; color: #6b7280; word-break: break-all; }
    .checks { display: flex; flex-wrap: wrap; gap: 8px 12px; font-size: 13px; font-weight: 600; }
    .issue-note {
      width: 100%; margin-top: 8px; padding: 8px; border: 1px solid #fca5a5;
      border-radius: 8px; font-size: 13px; resize: vertical;
    }
    .issue-note.hidden { display: none; }
    footer.actions {
      position: sticky; bottom: 0; background: white; border-top: 1px solid #e5e7eb;
      padding: 16px; text-align: center; margin-top: 24px;
    }
    footer.actions button {
      background: var(--primary); color: white; border: none; border-radius: 10px;
      padding: 12px 24px; font-size: 15px; font-weight: 800; cursor: pointer;
    }
    footer.actions button:hover { background: #1648c0; }
    #issue-report {
      display: block; max-width: 800px; margin: 16px auto 0; padding: 16px;
      background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px;
      text-align: left; font-size: 14px; line-height: 1.6;
    }
    #issue-report.empty { color: #6b7280; }
    #issue-report.has-issues { background: #fef2f2; border-color: #fecaca; }
    #issue-report .issue-item { margin: 0 0 12px; padding-bottom: 12px; border-bottom: 1px solid #fecaca; }
    #issue-report .issue-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
    #issue-report .issue-item strong { color: #991b1b; }
    #issue-report .issue-item .note { margin: 4px 0 0; color: #374151; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="summary-bar" id="summary-bar">
    <span>전체 <strong id="sum-total">${total}</strong>개</span>
    <span class="ok">확인 <strong id="sum-ok">0</strong>개</span>
    <span class="issue">이슈 <strong id="sum-issue">0</strong>개</span>
    <span class="pending">미확인 <strong id="sum-pending">${total}</strong>개</span>
  </div>
  <header class="page-header">
    <h1>쌤버십 화면 검토 보고서</h1>
    <p>생성일시: ${escapeHtml(generatedAt)}</p>
    <p>총 화면 수: ${total}개</p>
  </header>
  <main>
    ${sectionsHtml}
    <footer class="actions">
      <button type="button" id="btn-export">이슈 목록 출력</button>
      <div id="issue-report" class="empty">이슈 목록을 출력하려면 버튼을 누르세요.</div>
    </footer>
  </main>
  <script>
    function getStatus(card) {
      const checked = card.querySelector('.status-radio:checked');
      return checked ? checked.value : 'pending';
    }

    function updateSummary() {
      const cards = document.querySelectorAll('.card');
      let ok = 0, issue = 0, pending = 0;
      cards.forEach((card) => {
        const status = getStatus(card);
        if (status === 'issue') issue++;
        else if (status === 'ok') ok++;
        else pending++;
      });
      document.getElementById('sum-ok').textContent = String(ok);
      document.getElementById('sum-issue').textContent = String(issue);
      document.getElementById('sum-pending').textContent = String(pending);
    }

    function syncCardState(card) {
      const status = getStatus(card);
      const note = card.querySelector('.issue-note');
      const isIssue = status === 'issue';
      note.classList.toggle('hidden', !isIssue);
      card.classList.toggle('issue-active', isIssue);
      card.classList.toggle('ok-active', status === 'ok');
    }

    document.querySelectorAll('.status-radio').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        syncCardState(e.target.closest('.card'));
        updateSummary();
      });
    });

    document.querySelectorAll('.card').forEach(syncCardState);
    updateSummary();

    document.getElementById('btn-export').addEventListener('click', () => {
      const items = [];
      document.querySelectorAll('.card').forEach((card) => {
        if (getStatus(card) !== 'issue') return;
        const label = card.dataset.label || '';
        const file = card.dataset.file || '';
        const note = card.querySelector('.issue-note')?.value?.trim() ?? '';
        items.push({ label, file, note });
      });

      const box = document.getElementById('issue-report');
      box.classList.remove('empty', 'has-issues');
      box.innerHTML = '';

      if (!items.length) {
        box.classList.add('empty');
        box.textContent = '이슈로 표시된 화면이 없습니다.';
        return;
      }

      box.classList.add('has-issues');
      const title = document.createElement('p');
      title.style.fontWeight = '800';
      title.style.marginBottom = '12px';
      title.textContent = '이슈 목록 (' + items.length + '건)';
      box.appendChild(title);

      items.forEach(({ label, file, note }) => {
        const el = document.createElement('div');
        el.className = 'issue-item';
        const head = document.createElement('div');
        head.innerHTML = '<strong>' + label + '</strong> <span style="color:#6b7280">(' + file + ')</span>';
        el.appendChild(head);
        if (note) {
          const p = document.createElement('p');
          p.className = 'note';
          p.textContent = note;
          el.appendChild(p);
        }
        box.appendChild(el);
      });

      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  </script>
</body>
</html>`;
}

const html = buildHtml();
fs.writeFileSync(OUT_HTML, html, "utf8");
const pngCount = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".png")).length;
console.log(`Wrote ${OUT_HTML}`);
console.log(`PNG files in screenshots/: ${pngCount}`);
