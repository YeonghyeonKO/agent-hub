// ─────────────────────────────────────────────────────────────────────
// Simple i18n — Korean (default) / English
// ─────────────────────────────────────────────────────────────────────

const I18N = {
  ko: {
    // Nav
    nav_home: '홈', nav_mine: '내 Component / Flow', nav_ranking: '2026 랭킹',
    nav_notice: '공지사항', nav_voc: 'VoC', nav_guide: '가이드', nav_admin: '관리자',
    btn_submit: '제출', search_placeholder: 'Component · Flow · Tag 검색…',

    // Home
    home_title: '홈',
    home_tagline: '구성원이 직접 개발하여 공유한 Component·Flow를 활용하여 내 Agent를 업그레이드해보세요.',
    sort_popular: '인기순', sort_new: '최신순',
    filter_all: '전체',
    search_inline: '이름·설명·태그 검색…',
    empty_title: '검색 결과가 없습니다',
    empty_desc: '다른 키워드로 시도해보거나, 직접 만들어 제출해보세요.',
    load_more: '더 보기',
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
    tab_published: '게시됨', tab_drafts: '초안 / 심사 중', tab_deleted: '반려 / 삭제',
    col_name: '이름', col_version: '버전', col_star: 'Star',
    col_download: '다운로드', col_update: '업데이트',
    draft_reviewing: '심사 중', draft_draft: '초안', draft_continue: '이어서 작성',
    draft_preview: '미리보기', draft_cancel_submit: '제출 취소',
    deleted_notice: '관리자에 의해 반려/삭제된 항목입니다. 수정 후 다시 제출하면 심사를 받을 수 있습니다.',
    status_rejected: '반려됨', status_deleted: '삭제됨', btn_delete: '삭제', btn_resubmit: '다시 제출',
    draft_validation: '자동 검증', draft_passed: '통과',

    // Ranking
    ranking_title: '랭킹',
    ranking_eyebrow: '2026 상반기',
    ranking_subtitle: '실시간 갱신 · 자기 Star·다운로드 제외',
    ranking_formula: '점수 계산식',
    ranking_formula_hint: '실시간 갱신',
    ranking_full: '전체 순위',
    ranking_comp: 'Component 부문', ranking_flow: 'Flow 부문', ranking_empty: '등록된 항목이 없습니다',
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
    guide_external: '관련 사이트',
    guide_quickstart: '빠른 시작', guide_naming: '네이밍 규칙',
    guide_standard: '표준 인증 기준', guide_review: '심사 프로세스',
    guide_versioning: '버전 호환성', guide_faq: '자주 묻는 질문',
    guide_lf_promo_eyebrow: 'Langflow 가이드',
    guide_lf_promo_desc: '설치, 노드 구성, 디버깅, 배포까지 Langflow 사용법을 익혀보세요.',
    guide_lf_docs: 'Langflow 공식 문서',
    guide_lf_internal: 'Langflow 사내 가이드',
    guide_contact_channel: '문의 채널', guide_voc_channel: 'VoC 채널',

    // Upload
    upload_title: '새 Component / Flow 제출',
    upload_subtitle: '.py Component 또는 .json Flow를 등록하세요',
    upload_step_file: '파일', upload_step_meta: '기준 정보', upload_step_compat: '호환성·확인',
    upload_type: '유형', upload_drop: '파일을 끌어 놓거나 클릭하여 선택',
    upload_drop_hint: '.py · .json · 최대 5MB', upload_drop_replace: '다른 파일로 교체하려면 클릭하세요',
    upload_validation: '사전 검증',
    upload_field_title: '제목', upload_field_desc: '한 줄 설명',
    upload_desc_hint: '홈 카드와 검색 결과에 표시됩니다',
    upload_field_category: '카테고리', upload_field_icon: '아이콘',
    upload_field_readme: '개요 / 사용법', upload_readme_write: '작성', upload_readme_preview: '미리보기', upload_readme_hint: '상세 페이지의 설명 탭에 표시됩니다 · 이미지 붙여넣기 가능',
    upload_field_tags: '태그 (선택)', upload_tag_add: '추가', upload_tag_placeholder: '태그 입력',
    upload_compat_title: 'Langflow 호환 버전', upload_compat_hint: '동작을 확인한 버전을 명시해주세요.',
    upload_min_ver: '최소 버전', upload_max_ver: '최대 버전 (선택)', upload_tested: '동작 확인한 버전 (체크)',
    upload_no_limit: '제한 없음',
    upload_deps: '추가 의존성 (선택)', upload_deps_hint: 'requirements.txt 형식 · 쉼표로 구분',
    upload_cancel: '취소', upload_prev: '이전', upload_next: '다음',
    upload_submit: '제출하기', upload_submitting: '제출 중...',
    upload_done_title: '제출 완료', upload_done_desc: '심사 대기 상태로 등록되었습니다.',

    // Admin
    admin_pending: '심사 대기', admin_approved: '승인됨', admin_rejected: '반려됨',
    admin_users: '사용자 관리', admin_settings: '설정', admin_statistics: '통계',
    admin_dashboard: '관리자 대시보드', admin_home: '홈', admin_delete_confirm: '정말 삭제하시겠습니까?',
    score_functionality: '기능성 / 완성도', score_originality: '독창성', score_utility: '사내 활용도', score_documentation: '문서화 품질',
    admin_no_users: '등록된 사용자가 없습니다. Keycloak SSO로 로그인하면 자동 등록됩니다.',
    role_user: '일반', role_admin: '관리자', role_reviewer: '심사위원', role_member: '구성원',
    label_role: '직무', label_org: '소속',
    settings_season: '시즌 일정', settings_season_desc: '현재 시즌의 제출·심사 기간',
    settings_season_name: '시즌명', settings_submit_start: '제출 시작', settings_submit_end: '제출 마감',
    settings_review_end: '심사 마감', settings_award_day: '시상식',
    settings_criteria: '심사 항목 / 가중치', settings_criteria_desc: '항목 추가·삭제 및 가중치 조정 (합계 100% 권장)',
    settings_total: '합계', settings_new_criterion: '새 심사 항목명', settings_add_criterion: '항목 추가',
    settings_formula: '랭킹 점수 공식', settings_formula_desc: '실시간 갱신',
    settings_self_star: '자기 Star 제외', settings_self_download: '자기 다운로드 제외',
    settings_reviewers: '심사위원', settings_reviewers_count: '명',
    settings_reviewers_desc: '심사 대기건을 검토하는 구성원. 대표 심사위원은 충돌 시 결정권을 가집니다.',
    settings_primary: '대표', settings_set_primary: '대표 심사위원으로 지정', settings_remove: '제거',
    settings_emp_id: '사번', settings_name: '이름', settings_add: '추가',
    settings_contact: '문의 채널', settings_contact_desc: '사용자 문의 URL 또는 채널명', settings_contact_url: '채널 URL',
    settings_compat: '호환성 / 표준', settings_compat_desc: '업로드 시 자동 검증',
    settings_min_ver: '최소 Langflow 버전', settings_rec_ver: '권장 버전',
    settings_readme_lang: '필수 README 언어', settings_secret_scan: '비밀키 자동 스캔',

    // Footer
    footer_contact: '문의', footer_team: 'AI / Data Platform',

    // Common
    common_all: '전체',
    col_download: '다운로드',
  },
  en: {
    // Nav
    nav_home: 'Home', nav_mine: 'My Components', nav_ranking: '2026 Ranking',
    nav_notice: 'Notices', nav_voc: 'VoC', nav_guide: 'Guide', nav_admin: 'Admin',
    btn_submit: 'Submit', search_placeholder: 'Search components, flows, tags…',

    // Home
    home_title: 'Home',
    home_tagline: 'Discover and reuse Components & Flows built by your teammates to upgrade your Agent.',
    sort_popular: 'Popular', sort_new: 'Latest',
    filter_all: 'All',
    search_inline: 'Search name / description / tag…',
    empty_title: 'No results found',
    empty_desc: 'Try different keywords, or create and submit your own.',
    load_more: 'Load More',
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
    tab_published: 'Published', tab_drafts: 'Drafts / Review', tab_deleted: 'Rejected / Deleted',
    col_name: 'Name', col_version: 'Version', col_star: 'Star',
    col_download: 'Downloads', col_update: 'Updated',
    draft_reviewing: 'In Review', draft_draft: 'Draft', draft_continue: 'Continue',
    draft_preview: 'Preview', draft_cancel_submit: 'Cancel Submission',
    deleted_notice: 'These items were rejected or deleted by admin. You can edit and resubmit for review.',
    status_rejected: 'Rejected', status_deleted: 'Deleted', btn_delete: 'Delete', btn_resubmit: 'Resubmit',
    draft_validation: 'Auto Validation', draft_passed: 'passed',

    // Ranking
    ranking_title: 'Ranking',
    ranking_eyebrow: '2026 H1',
    ranking_subtitle: 'Real-time · Self-star/download excluded',
    ranking_formula: 'Score Formula',
    ranking_formula_hint: 'Real-time',
    ranking_full: 'Full Ranking',
    ranking_comp: 'Component', ranking_flow: 'Flow', ranking_empty: 'No entries registered',
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
    guide_external: 'Related Sites',
    guide_quickstart: 'Quick Start', guide_naming: 'Naming Rules',
    guide_standard: 'Standard Certification', guide_review: 'Review Process',
    guide_versioning: 'Version Compatibility', guide_faq: 'FAQ',
    guide_lf_promo_eyebrow: 'Langflow Official Guide',
    guide_lf_promo_desc: 'For Langflow usage — installation, node setup, debugging, and deployment — refer to the external guide.',
    guide_lf_docs: 'Langflow Official Docs',
    guide_lf_internal: 'Langflow Internal Guide',
    guide_contact_channel: 'Contact Channel', guide_voc_channel: 'VoC Channel',

    // Upload
    upload_title: 'Submit New Component / Flow',
    upload_subtitle: 'Register a .py Component or .json Flow',
    upload_step_file: 'File', upload_step_meta: 'Metadata', upload_step_compat: 'Compatibility',
    upload_type: 'Type', upload_drop: 'Drag & drop or click to select',
    upload_drop_hint: '.py · .json · max 5MB', upload_drop_replace: 'Click to replace file',
    upload_validation: 'Validation',
    upload_field_title: 'Title', upload_field_desc: 'Short description',
    upload_desc_hint: 'Shown on home cards and search results',
    upload_field_category: 'Category', upload_field_icon: 'Icon',
    upload_field_readme: 'Overview / Usage', upload_readme_write: 'Write', upload_readme_preview: 'Preview', upload_readme_hint: 'Shown in the detail page description tab · paste images supported',
    upload_field_tags: 'Tags (optional)', upload_tag_add: 'Add', upload_tag_placeholder: 'Enter tag',
    upload_compat_title: 'Langflow Compatibility', upload_compat_hint: 'Specify tested versions.',
    upload_min_ver: 'Min version', upload_max_ver: 'Max version (optional)', upload_tested: 'Tested versions',
    upload_no_limit: 'No limit',
    upload_deps: 'Dependencies (optional)', upload_deps_hint: 'requirements.txt format, comma separated',
    upload_cancel: 'Cancel', upload_prev: 'Previous', upload_next: 'Next',
    upload_submit: 'Submit', upload_submitting: 'Submitting...',
    upload_done_title: 'Submitted', upload_done_desc: 'Registered as pending review.',

    // Admin
    admin_pending: 'Pending', admin_approved: 'Approved', admin_rejected: 'Rejected',
    admin_users: 'User Management', admin_settings: 'Settings', admin_statistics: 'Statistics',
    admin_dashboard: 'Admin Dashboard', admin_home: 'Home', admin_delete_confirm: 'Delete this item?',
    score_functionality: 'Functionality', score_originality: 'Originality', score_utility: 'Internal Utility', score_documentation: 'Documentation',
    admin_no_users: 'No users registered. Users are auto-registered upon Keycloak SSO login.',
    role_user: 'User', role_admin: 'Admin', role_reviewer: 'Reviewer', role_member: 'Member',
    label_role: 'Role', label_org: 'Org',
    settings_season: 'Season Schedule', settings_season_desc: 'Submission and review period for the current season',
    settings_season_name: 'Season Name', settings_submit_start: 'Submit Start', settings_submit_end: 'Submit End',
    settings_review_end: 'Review End', settings_award_day: 'Award Day',
    settings_criteria: 'Review Criteria / Weights', settings_criteria_desc: 'Add/remove criteria and adjust weights (100% total recommended)',
    settings_total: 'Total', settings_new_criterion: 'New criterion name', settings_add_criterion: 'Add Criterion',
    settings_formula: 'Ranking Score Formula', settings_formula_desc: 'Real-time',
    settings_self_star: 'Exclude Self Stars', settings_self_download: 'Exclude Self Downloads',
    settings_reviewers: 'Reviewers', settings_reviewers_count: '',
    settings_reviewers_desc: 'Members who review pending submissions. The primary reviewer has the deciding vote on conflicts.',
    settings_primary: 'Primary', settings_set_primary: 'Set as primary reviewer', settings_remove: 'Remove',
    settings_emp_id: 'Employee ID', settings_name: 'Name', settings_add: 'Add',
    settings_contact: 'Contact Channel', settings_contact_desc: 'URL or channel name for user inquiries', settings_contact_url: 'Channel URL',
    settings_compat: 'Compatibility / Standards', settings_compat_desc: 'Auto-validated on upload',
    settings_min_ver: 'Min Langflow Version', settings_rec_ver: 'Recommended Version',
    settings_readme_lang: 'Required README Language', settings_secret_scan: 'Secret Key Auto-Scan',

    // Footer
    footer_contact: 'Contact', footer_team: 'AI / Data Platform',

    // Common
    common_all: 'All',
    col_download: 'Downloads',
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
