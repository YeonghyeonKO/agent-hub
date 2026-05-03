// ─────────────────────────────────────────────────────────────────────
// Simple i18n — Korean (default) / English
// ─────────────────────────────────────────────────────────────────────

const I18N = {
  ko: {
    nav_home: '홈',
    nav_mine: '내 Component / Flow',
    nav_ranking: '2026 랭킹',
    nav_notice: '공지사항',
    nav_voc: 'VoC',
    nav_guide: '가이드',
    nav_admin: '관리자',
    btn_submit: '제출',
    search_placeholder: 'Component · Flow · 개발자 검색…',
    home_title: '홈',
    home_tagline: '구성원이 직접 개발하여 공유한 Component·Flow를 활용하여 내 Agent를 업그레이드해보세요.',
    sort_popular: '인기순',
    sort_new: '최신순',
    filter_all: '전체',
    ranking_title: '랭킹',
    ranking_subtitle: '매일 오전 9시 갱신 · 자기 Star·다운로드 제외',
    ranking_formula: '점수 계산식',
    ranking_full: '전체 순위',
    notice_title: '공지사항',
    notice_subtitle: 'AgentHub 운영 관련 공지사항을 확인하세요.',
    notice_write: '공지 작성',
    notice_pin: '고정',
    notice_unpin: '고정 해제',
    notice_delete: '삭제',
    notice_back: '← 목록으로',
    notice_publish: '게시',
    voc_title: 'VoC 게시판',
    voc_subtitle: 'AgentHub에 대한 제안·버그·질문을 자유롭게 남겨주세요. 운영팀이 확인하고 답변드립니다.',
    voc_write: '새 글 작성',
    voc_register: '등록',
    voc_preview: '미리보기',
    voc_edit: '편집',
    voc_cancel: '취소',
    cat_suggestion: '제안',
    cat_bug: '버그',
    cat_question: '질문',
    cat_other: '기타',
    status_open: '접수',
    status_inprogress: '검토 중',
    status_resolved: '반영됨',
    status_closed: '종료',
    guide_title: 'AgentHub 가이드',
    guide_subtitle: 'Langflow Component·Flow를 사내에서 안전하게 공유하기 위한 표준과 절차를 안내합니다.',
    mine_title: '내 Component / Flow',
  },
  en: {
    nav_home: 'Home',
    nav_mine: 'My Components',
    nav_ranking: '2026 Ranking',
    nav_notice: 'Notices',
    nav_voc: 'VoC',
    nav_guide: 'Guide',
    nav_admin: 'Admin',
    btn_submit: 'Submit',
    search_placeholder: 'Search components, flows, developers…',
    home_title: 'Home',
    home_tagline: 'Discover and reuse Components & Flows built by your teammates to upgrade your Agent.',
    sort_popular: 'Popular',
    sort_new: 'Latest',
    filter_all: 'All',
    ranking_title: 'Ranking',
    ranking_subtitle: 'Updated daily at 9:00 AM · Self-star/download excluded',
    ranking_formula: 'Score Formula',
    ranking_full: 'Full Ranking',
    notice_title: 'Notices',
    notice_subtitle: 'Check announcements about AgentHub operations.',
    notice_write: 'New Notice',
    notice_pin: 'Pin',
    notice_unpin: 'Unpin',
    notice_delete: 'Delete',
    notice_back: '← Back to list',
    notice_publish: 'Publish',
    voc_title: 'VoC Board',
    voc_subtitle: 'Share suggestions, bugs, and questions about AgentHub. Our team will review and respond.',
    voc_write: 'New Post',
    voc_register: 'Submit',
    voc_preview: 'Preview',
    voc_edit: 'Edit',
    voc_cancel: 'Cancel',
    cat_suggestion: 'Suggestion',
    cat_bug: 'Bug',
    cat_question: 'Question',
    cat_other: 'Other',
    status_open: 'Open',
    status_inprogress: 'In Progress',
    status_resolved: 'Resolved',
    status_closed: 'Closed',
    guide_title: 'AgentHub Guide',
    guide_subtitle: 'Standards and procedures for safely sharing Langflow Components & Flows within the organization.',
    mine_title: 'My Components / Flows',
  },
};

// Global lang state + event-driven reactivity
window.__agenthub_lang = 'ko';

function useI18n() {
  const [lang, setLang] = React.useState(window.__agenthub_lang || 'ko');

  React.useEffect(() => {
    const handler = () => setLang(window.__agenthub_lang);
    window.addEventListener('langchange', handler);
    return () => window.removeEventListener('langchange', handler);
  }, []);

  const t = (key) => (I18N[lang] && I18N[lang][key]) || (I18N.ko[key]) || key;
  return { lang, t };
}

Object.assign(window, { I18N, useI18n });
