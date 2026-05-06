// Shared data + icons + utilities for AgentHub

const Icons = {
  Search: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Star: ({size = 14, filled}) => <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Download: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Copy: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Comment: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Eye: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  Plus: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Check: ({size = 12}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Warn: ({size = 12}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Upload: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  File: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Folder: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  Filter: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Sort: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M11 18h2"/></svg>,
  Trophy: ({size = 12}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  ArrowRight: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  ChevronRight: ({size = 12}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevronDown: ({size = 12}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Maximize: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>,
  Clock: ({size = 12}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Users: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Code: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  Sparkle: ({size = 12}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.94 14.34A2 2 0 0 1 11 16h2a2 2 0 0 1 1.06-1.66M12 2v2"/><path d="m4.93 4.93 1.41 1.41M2 12h2M4.93 19.07l1.41-1.41M12 22v-2M19.07 19.07l-1.41-1.41M22 12h-2M19.07 4.93l-1.41 1.41"/><circle cx="12" cy="12" r="4"/></svg>,
  Zap: ({size = 12}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Settings: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Bell: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  Reset: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  Layers: ({size = 14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Box: ({size = 18}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Workflow: ({size = 18}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M21 11V8a2 2 0 0 0-2-2h-6"/><path d="M3 13v3a2 2 0 0 0 2 2h6"/></svg>,
  Scissors: ({size = 24}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>,
  Database: ({size = 24}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Plug: ({size = 24}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2v6"/><path d="M15 2v6"/><path d="M12 17v5"/><path d="M5 8h14"/><path d="M6 8v3a6 6 0 0 0 12 0V8"/></svg>,
  Ticket: ({size = 24}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 0 0 4v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 0 0-4z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>,
  FileText: ({size = 24}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Layers2: ({size = 24}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Globe: ({size = 22}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
};

// Sample components data
const COMPONENTS = [
  {
    id: 'smart-chunker',
    type: 'py',
    typeLabel: '.py Component',
    title: 'SmartChunker',
    desc: '의미 단위로 자동 분할하는 한국어 특화 청커',
    category: 'RAG / 검색',
    author: { name: '고영현', id: '2074795', initial: '고' },
    version: 'v1.2.0',
    versions: 3,
    minLF: '1.8.0', maxLF: '1.9.1',
    testedVersions: ['1.9.1', '1.9.0', '1.8.3'],
    standard: true,
    rank: 1,
    stars: 142, downloads: 387, copies: 91, comments: 23,
    icon: 'Scissors',
    iconBg: '#fef3c7', iconFg: '#92400e',
    updatedAgo: '3일 전',
    season: 'S1',
  },
  {
    id: 'wiki-rag',
    type: 'json',
    typeLabel: 'JSON Flow',
    title: '사내 위키 RAG',
    desc: 'Confluence 연동 + 출처 표기 RAG 풀스택 Flow',
    category: 'RAG / 검색',
    author: { name: '김정호', id: '2074814', initial: '김' },
    version: 'v1.0.0',
    versions: 1,
    minLF: '1.9.0', maxLF: '1.9.1',
    testedVersions: ['1.9.1', '1.9.0'],
    standard: true,
    rank: 2,
    stars: 118, downloads: 502, copies: 64, comments: 14,
    nodes: 9,
    icon: 'Database',
    iconBg: '#e0f2fe', iconFg: '#075985',
    updatedAgo: '1주 전',
    season: 'S2',
  },
  {
    id: 'korean-reranker',
    type: 'py',
    typeLabel: '.py Component',
    title: 'KoreanReranker',
    desc: 'Cross-encoder 기반 한국어 재순위 모델',
    category: 'RAG / 검색',
    author: { name: '고영현', id: '2074795', initial: '고' },
    version: 'v0.9.1',
    versions: 2,
    minLF: '1.7.0', maxLF: '1.9.1',
    testedVersions: ['1.9.1', '1.8.3'],
    standard: true,
    stars: 64, downloads: 198, copies: 38, comments: 7,
    icon: 'Layers2',
    updatedAgo: '2주 전',
  },
  {
    id: 'sap-connector',
    type: 'py',
    typeLabel: '.py Component',
    title: 'SAP Connector',
    desc: '사내 SAP ERP 데이터 조회 노드',
    category: '데이터 / ERP',
    author: { name: '이창수', id: '2068420', initial: '이' },
    version: 'v0.4.2',
    versions: 4,
    minLF: '1.3.0', maxLF: '1.3.0',
    testedVersions: [],
    standard: false,
    incompat: true,
    stars: 87, downloads: 244, copies: 52, comments: 11,
    icon: 'Plug',
    updatedAgo: '1개월 전',
  },
  {
    id: 'jira-ticket',
    type: 'py',
    typeLabel: '.py Component',
    title: 'JiraTicketCreator',
    desc: 'Flow 결과를 Jira 이슈로 자동 생성',
    category: '워크플로우',
    author: { name: '박지원', id: '2074821', initial: '박' },
    version: 'v1.0.0',
    versions: 1,
    minLF: '1.9.0', maxLF: '1.9.1',
    testedVersions: ['1.9.1', '1.9.0'],
    standard: true,
    stars: 41, downloads: 128, copies: 24, comments: 5,
    icon: 'Ticket',
    updatedAgo: '4일 전',
  },
  {
    id: 'pdf-layout',
    type: 'py',
    typeLabel: '.py Component',
    title: 'PDF Layout Parser',
    desc: '표·다단 레이아웃 보존 PDF 파서',
    category: '문서 처리',
    author: { name: '고영현', id: '2074795', initial: '고' },
    version: 'v1.5.2',
    versions: 5,
    minLF: '1.8.0', maxLF: '1.9.1',
    testedVersions: ['1.9.1', '1.9.0', '1.8.3'],
    standard: true,
    stars: 31, downloads: 87, copies: 19, comments: 4,
    icon: 'FileText',
    updatedAgo: '2일 전',
  },
  {
    id: 'meeting-summarizer',
    type: 'json',
    typeLabel: 'JSON Flow',
    title: '회의록 요약 Flow',
    desc: 'Zoom 녹취 → 화자 분리 → 액션 아이템 추출',
    category: '문서 처리',
    author: { name: '최서연', id: '2074803', initial: '최' },
    version: 'v0.7.0',
    versions: 2,
    minLF: '1.8.0', maxLF: '1.9.1',
    testedVersions: ['1.9.1', '1.8.3'],
    standard: true,
    stars: 22, downloads: 71, copies: 14, comments: 3,
    nodes: 12,
    icon: 'FileText',
    updatedAgo: '5일 전',
  },
];

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'rag', label: 'RAG / 검색' },
  { id: 'doc', label: '문서 처리' },
  { id: 'data', label: '데이터 / ERP' },
  { id: 'workflow', label: '워크플로우' },
  { id: 'agent', label: '에이전트' },
  { id: 'utility', label: '유틸' },
];

// Submissions for admin dashboard (some pending)
const SUBMISSIONS = [
  {
    id: 'sub-1',
    type: 'py', title: 'SmartChunker', author: '고영현', authorId: '2074795', authorInitial: '고',
    version: 'v1.2.0',
    minLF: '1.8.0', maxLF: '1.9.1',
    submittedAgo: '2시간 전',
    status: 'pending',
    flagged: false,
  },
  {
    id: 'sub-2',
    type: 'json', title: '사내 위키 RAG', author: '김정호', authorId: '2074814', authorInitial: '김',
    version: 'v1.0.0',
    minLF: '1.9.0', maxLF: '1.9.1',
    submittedAgo: '5시간 전',
    status: 'pending',
    flagged: false,
  },
  {
    id: 'sub-3',
    type: 'py', title: 'SAP Connector', author: '이창수', authorId: '2068420', authorInitial: '이',
    version: 'v0.4.2',
    minLF: '1.3.0', maxLF: null, legacy: true,
    submittedAgo: '1일 전',
    status: 'flagged',
    flagged: true,
  },
  {
    id: 'sub-4',
    type: 'py', title: 'JiraTicketCreator', author: '박지원', authorId: '2074821', authorInitial: '박',
    version: 'v1.0.0',
    minLF: '1.9.0', maxLF: '1.9.1',
    submittedAgo: '1일 전',
    status: 'pending',
    flagged: false,
  },
];

// helper
function pythonHighlight(code) {
  // Very small tokenizer for display purposes
  const lines = code.split('\n');
  const KW = new Set(['from', 'import', 'class', 'def', 'return', 'self', 'None', 'True', 'False', 'if', 'else', 'in', 'for', 'as']);
  return lines.map((line, lineIdx) => {
    const tokens = [];
    const re = /(#[^\n]*|"[^"]*"|'[^']*'|\b\d+\b|\b[A-Za-z_][A-Za-z0-9_]*\b|\s+|.)/g;
    let m;
    let key = 0;
    while ((m = re.exec(line)) !== null) {
      const t = m[0];
      if (t.startsWith('#')) tokens.push(<span key={key++} className="tok-com">{t}</span>);
      else if (t.startsWith('"') || t.startsWith("'")) tokens.push(<span key={key++} className="tok-str">{t}</span>);
      else if (/^\d+$/.test(t)) tokens.push(<span key={key++} className="tok-num">{t}</span>);
      else if (KW.has(t)) tokens.push(<span key={key++} className="tok-kw">{t}</span>);
      else if (/^[A-Z]/.test(t)) tokens.push(<span key={key++} className="tok-cls">{t}</span>);
      else tokens.push(<span key={key++}>{t}</span>);
    }
    return <div key={lineIdx}>{tokens.length ? tokens : '\u00A0'}</div>;
  });
}

// Reviewers (심사위원)
const REVIEWERS = [
  { id: '2068122', name: '정승현', initial: '정', role: 'AI Platform Lead', org: 'AI플랫폼팀', avatarBg: '#dbeafe', avatarFg: '#1e40af', primary: true },
  { id: '2071003', name: '한미경', initial: '한', role: 'Principal Architect', org: 'AI플랫폼팀', avatarBg: '#fce7f3', avatarFg: '#9d174d' },
  { id: '2069447', name: '오세훈', initial: '오', role: 'Senior MLOps', org: 'DevX팀', avatarBg: '#dcfce7', avatarFg: '#166534' },
];

// People directory — keyed by 사번
const PEOPLE = {
  '2074795': { id: '2074795', name: '고영현', initial: '고', role: 'AI Engineer', org: '수율분석팀', avatarBg: 'var(--bg-muted)', avatarFg: 'var(--text-2)' },
  '2074814': { id: '2074814', name: '김정호', initial: '김', role: 'Backend Engineer', org: '제조DX팀', avatarBg: '#fef3c7', avatarFg: '#92400e' },
  '2068420': { id: '2068420', name: '이창수', initial: '이', role: 'Data Engineer', org: 'ERP운영팀', avatarBg: '#e0e7ff', avatarFg: '#3730a3' },
  '2074821': { id: '2074821', name: '박지원', initial: '박', role: 'Frontend Engineer', org: '협업툴팀', avatarBg: '#ffe4e6', avatarFg: '#9f1239' },
  '2071550': { id: '2071550', name: '최서연', initial: '최', role: 'AI Engineer', org: 'AI플랫폼팀', avatarBg: '#cffafe', avatarFg: '#0e7490' },
  '2068122': { id: '2068122', name: '정승현', initial: '정', role: 'AI Platform Lead', org: 'AI플랫폼팀', avatarBg: '#dbeafe', avatarFg: '#1e40af' },
  '2071003': { id: '2071003', name: '한미경', initial: '한', role: 'Principal Architect', org: 'AI플랫폼팀', avatarBg: '#fce7f3', avatarFg: '#9d174d' },
  '2069447': { id: '2069447', name: '오세훈', initial: '오', role: 'Senior MLOps', org: 'DevX팀', avatarBg: '#dcfce7', avatarFg: '#166534' },
};

// Notices (shared between home + boards page)
const MOCK_NOTICES = [
  { id: 'n1', title: 'AgentHub v0.1.0 정식 오픈 안내', content: '2026년 상반기 AgentHub가 정식 오픈되었습니다. 모든 구성원은 본인이 개발한 Langflow Component·Flow를 자유롭게 등록할 수 있습니다.\n\n**주요 기능:**\n- Component/Flow 업로드 및 자동 검증\n- 심사위원 리뷰 시스템\n- 2026 랭킹 (Star × 2 + 다운로드 × 1)\n- Keycloak SSO 연동\n\n문의: AI/Data Platform 고영현TL', author: { name: '고영현', id: '2074795', initial: '고' }, is_pinned: true, created_at: '2026-04-28' },
  { id: 'n2', title: '2026 상반기 심사 기준 변경 공지', content: '심사 항목 가중치가 아래와 같이 조정되었습니다:\n\n| 항목 | 기존 | 변경 |\n|------|------|------|\n| 기능성/완성도 | 40% | **35%** |\n| 독창성 | 20% | 20% |\n| 사내 활용도 | 25% | **30%** |\n| 문서화 품질 | 15% | 15% |\n\n적용일: 2026-05-01', author: { name: '정승현', id: '2068122', initial: '정' }, is_pinned: true, created_at: '2026-04-25' },
  { id: 'n3', title: '시스템 점검 안내 (5/10 토요일 02:00~06:00)', content: 'PostgreSQL 및 인프라 점검으로 인해 5월 10일(토) 02:00~06:00 동안 서비스가 일시 중단됩니다.', author: { name: '오세훈', id: '2069447', initial: '오' }, is_pinned: false, created_at: '2026-05-01' },
  { id: 'n4', title: 'Langflow 1.9.1 호환성 테스트 완료', content: 'Langflow 1.9.1에 대한 사내 호환성 테스트가 완료되었습니다. 기존 1.9.0 기준 Component는 모두 정상 동작합니다.', author: { name: '한미경', id: '2071003', initial: '한' }, is_pinned: false, created_at: '2026-04-20' },
];

function LoadingIndicator() {
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 12}}>
      <div className="loading-flow">
        <div className="loading-dot" style={{animationDelay: '0s'}}/>
        <div className="loading-line"/>
        <div className="loading-dot" style={{animationDelay: '0.2s'}}/>
        <div className="loading-line"/>
        <div className="loading-dot" style={{animationDelay: '0.4s'}}/>
      </div>
      <div className="muted-sm" style={{fontSize: 12}}>Loading...</div>
    </div>
  );
}

Object.assign(window, {
  Icons,
  COMPONENTS,
  CATEGORIES,
  SUBMISSIONS,
  REVIEWERS,
  PEOPLE,
  MOCK_NOTICES,
  pythonHighlight,
  LoadingIndicator,
});
