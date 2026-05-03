// ─────────────────────────────────────────────────────────────────────
// Simple i18n — Korean (default) / English
// ─────────────────────────────────────────────────────────────────────

const I18N = {
  ko: {
    // Nav
    nav_home: '홈', nav_mine: '내 Component / Flow', nav_ranking: '2026 랭킹',
    nav_notice: '공지사항', nav_voc: 'VoC', nav_guide: '가이드', nav_admin: '관리자',
    btn_submit: '제출', search_placeholder: 'Component · Flow · 개발자 검색…',

    // Home
    home_title: '홈',
    home_tagline: '구성원이 직접 개발하여 공유한 Component·Flow를 활용하여 내 Agent를 업그레이드해보세요.',
    sort_popular: '인기순', sort_new: '최신순',
    filter_all: '전체',
    search_inline: '이름·설명 검색…',
    empty_title: '검색 결과가 없습니다',
    empty_desc: '다른 키워드로 시도해보거나, 직접 만들어 제출해보세요.',
    pinned_label: '공지',
    type_component: 'Component', type_flow: 'Flow',
    chip_standard: '표준', chip_incompat: '호환 주의',

    // Season banner
    season_eyebrow: '2026 · 상반기',
    season_title: 'AI Agent Builder Component · Flow',
    season_deadline: '제출 마감 D-23',
    season_participants: '참여 38명 · 제출 62건',
    season_first: '2026 1위 SmartChunker',
    season_admin: '관리자',
    season_new: '새 Component / Flow',

    // Categories
    cat_rag: 'RAG / 검색', cat_doc: '문서 처리', cat_data: '데이터 / ERP',
    cat_workflow: '워크플로우', cat_agent: '에이전트', cat_util: '유틸',

    // My Assets
    mine_title: '내 Component / Flow',
    mine_desc: '내가 등록한 Component·Flow와 진행 중인 초안을 한눈에 관리하세요.',
    mine_export: 'CSV 내보내기',
    mine_new: '새 Component / Flow',
    mine_registered: '내 등록', mine_total_stars: '누적 Star',
    mine_total_dl: '누적 다운로드', mine_ranking: '2026 랭킹',
    tab_published: '게시됨', tab_drafts: '초안 / 심사 중', tab_activity: '활동',
    col_name: '이름', col_version: '버전', col_star: 'Star',
    col_download: '다운로드', col_update: '업데이트',
    draft_reviewing: '심사 중', draft_draft: '초안', draft_continue: '이어서 작성',
    draft_preview: '미리보기', draft_cancel_submit: '제출 취소',
    draft_validation: '자동 검증', draft_passed: '통과',

    // Ranking
    ranking_title: '랭킹',
    ranking_eyebrow: '2026 상반기',
    ranking_subtitle: '매일 오전 9시 갱신 · 자기 Star·다운로드 제외',
    ranking_formula: '점수 계산식',
    ranking_formula_hint: '매일 오전 9시 갱신',
    ranking_full: '전체 순위',
    ranking_h1: '상반기', ranking_month: '이번 달', ranking_week: '이번 주',
    ranking_col_rank: '#', ranking_col_component: 'Component / Flow',
    ranking_col_developer: '개발자', ranking_col_star: 'Star',
    ranking_col_download: '다운로드', ranking_col_score: '점수', ranking_col_trend: '변동',

    // Notice
    notice_title: '공지사항', notice_eyebrow: 'Announcements',
    notice_subtitle: 'AgentHub 운영 관련 공지사항을 확인하세요.',
    notice_write: '공지 작성', notice_pin: '고정', notice_unpin: '고정 해제',
    notice_delete: '삭제', notice_back: '← 목록으로', notice_publish: '게시',
    notice_form_title: '새 공지 작성', notice_field_title: '제목',
    notice_field_content: '내용', notice_pin_label: '상단 고정',

    // VoC
    voc_title: 'VoC 게시판', voc_eyebrow: 'Voice of Customer',
    voc_subtitle: 'AgentHub에 대한 제안·버그·질문을 자유롭게 남겨주세요. 운영팀이 확인하고 답변드립니다.',
    voc_write: '새 글 작성', voc_register: '등록',
    voc_preview: '미리보기', voc_edit: '편집', voc_cancel: '취소',
    voc_form_title: '새 VoC 작성', voc_field_category: '카테고리',
    voc_field_title: '제목', voc_field_content: '내용',
    voc_title_placeholder: '간결하게 한 줄로 요약해주세요',
    voc_content_placeholder: '마크다운 형식을 지원합니다. **굵게**, `코드`, - 목록 등을 사용할 수 있어요.',
    voc_md_hint: 'Markdown 형식 지원 · **굵게** · `코드` · - 목록 · [링크](url)',
    voc_back: '← VoC 목록',
    voc_comments: '댓글', voc_comment_write: '댓글 작성...',
    voc_comment_submit: '작성',
    cat_suggestion: '제안', cat_bug: '버그', cat_question: '질문', cat_other: '기타',
    status_open: '접수', status_inprogress: '검토 중', status_resolved: '반영됨', status_closed: '종료',

    // Guide
    guide_title: 'AgentHub 가이드', guide_eyebrow: 'Documentation',
    guide_subtitle: 'Langflow Component·Flow를 사내에서 안전하게 공유하기 위한 표준과 절차를 안내합니다. 처음이라면 빠른 시작부터 읽어보세요.',
    guide_external: '외부 자료',
    guide_quickstart: '빠른 시작', guide_naming: '네이밍 규칙',
    guide_standard: '표준 인증 기준', guide_review: '심사 프로세스',
    guide_versioning: '버전 호환성', guide_faq: '자주 묻는 질문',

    // Footer
    footer_contact: '문의', footer_team: 'AI / Data Platform',

    // Common
    common_all: '전체',
  },
  en: {
    // Nav
    nav_home: 'Home', nav_mine: 'My Components', nav_ranking: '2026 Ranking',
    nav_notice: 'Notices', nav_voc: 'VoC', nav_guide: 'Guide', nav_admin: 'Admin',
    btn_submit: 'Submit', search_placeholder: 'Search components, flows, developers…',

    // Home
    home_title: 'Home',
    home_tagline: 'Discover and reuse Components & Flows built by your teammates to upgrade your Agent.',
    sort_popular: 'Popular', sort_new: 'Latest',
    filter_all: 'All',
    search_inline: 'Search name / description…',
    empty_title: 'No results found',
    empty_desc: 'Try different keywords, or create and submit your own.',
    pinned_label: 'Notice',
    type_component: 'Component', type_flow: 'Flow',
    chip_standard: 'Standard', chip_incompat: 'Compat. Warning',

    // Season banner
    season_eyebrow: '2026 · H1',
    season_title: 'AI Agent Builder Component · Flow',
    season_deadline: 'Deadline D-23',
    season_participants: '38 participants · 62 submissions',
    season_first: '2026 #1 SmartChunker',
    season_admin: 'Admin',
    season_new: 'New Component / Flow',

    // Categories
    cat_rag: 'RAG / Search', cat_doc: 'Document', cat_data: 'Data / ERP',
    cat_workflow: 'Workflow', cat_agent: 'Agent', cat_util: 'Utility',

    // My Assets
    mine_title: 'My Components / Flows',
    mine_desc: 'Manage your published components, drafts, and activity in one place.',
    mine_export: 'Export CSV',
    mine_new: 'New Component / Flow',
    mine_registered: 'Published', mine_total_stars: 'Total Stars',
    mine_total_dl: 'Total Downloads', mine_ranking: '2026 Ranking',
    tab_published: 'Published', tab_drafts: 'Drafts / Review', tab_activity: 'Activity',
    col_name: 'Name', col_version: 'Version', col_star: 'Star',
    col_download: 'Downloads', col_update: 'Updated',
    draft_reviewing: 'In Review', draft_draft: 'Draft', draft_continue: 'Continue',
    draft_preview: 'Preview', draft_cancel_submit: 'Cancel Submission',
    draft_validation: 'Auto Validation', draft_passed: 'passed',

    // Ranking
    ranking_title: 'Ranking',
    ranking_eyebrow: '2026 H1',
    ranking_subtitle: 'Updated daily at 9:00 AM · Self-star/download excluded',
    ranking_formula: 'Score Formula',
    ranking_formula_hint: 'Updated daily at 9:00 AM',
    ranking_full: 'Full Ranking',
    ranking_h1: 'H1', ranking_month: 'This Month', ranking_week: 'This Week',
    ranking_col_rank: '#', ranking_col_component: 'Component / Flow',
    ranking_col_developer: 'Developer', ranking_col_star: 'Star',
    ranking_col_download: 'Downloads', ranking_col_score: 'Score', ranking_col_trend: 'Trend',

    // Notice
    notice_title: 'Notices', notice_eyebrow: 'Announcements',
    notice_subtitle: 'Check announcements about AgentHub operations.',
    notice_write: 'New Notice', notice_pin: 'Pin', notice_unpin: 'Unpin',
    notice_delete: 'Delete', notice_back: '← Back to list', notice_publish: 'Publish',
    notice_form_title: 'Write Notice', notice_field_title: 'Title',
    notice_field_content: 'Content', notice_pin_label: 'Pin to top',

    // VoC
    voc_title: 'VoC Board', voc_eyebrow: 'Voice of Customer',
    voc_subtitle: 'Share suggestions, bugs, and questions about AgentHub. Our team will review and respond.',
    voc_write: 'New Post', voc_register: 'Submit',
    voc_preview: 'Preview', voc_edit: 'Edit', voc_cancel: 'Cancel',
    voc_form_title: 'New VoC Post', voc_field_category: 'Category',
    voc_field_title: 'Title', voc_field_content: 'Content',
    voc_title_placeholder: 'Summarize in one line',
    voc_content_placeholder: 'Supports markdown. **bold**, `code`, - lists, etc.',
    voc_md_hint: 'Markdown supported · **bold** · `code` · - list · [link](url)',
    voc_back: '← Back to VoC',
    voc_comments: 'Comments', voc_comment_write: 'Write a comment...',
    voc_comment_submit: 'Post',
    cat_suggestion: 'Suggestion', cat_bug: 'Bug', cat_question: 'Question', cat_other: 'Other',
    status_open: 'Open', status_inprogress: 'In Progress', status_resolved: 'Resolved', status_closed: 'Closed',

    // Guide
    guide_title: 'AgentHub Guide', guide_eyebrow: 'Documentation',
    guide_subtitle: 'Standards and procedures for safely sharing Langflow Components & Flows. Start with Quick Start if you\'re new.',
    guide_external: 'External Resources',
    guide_quickstart: 'Quick Start', guide_naming: 'Naming Rules',
    guide_standard: 'Standard Certification', guide_review: 'Review Process',
    guide_versioning: 'Version Compatibility', guide_faq: 'FAQ',

    // Footer
    footer_contact: 'Contact', footer_team: 'AI / Data Platform',

    // Common
    common_all: 'All',
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
