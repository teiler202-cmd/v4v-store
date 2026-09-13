/**
 * 보드의 표 정의 — 한 곳.
 *
 * 화면, 입력 폼, 목록의 열, 에이전트에게 주는 설명이 전부 이 파일에서 나옵니다.
 * 컬럼을 하나 더하려면 schema.sql 에 한 줄, 여기에 한 줄입니다.
 *
 * 노션에서는 속성을 3초 만에 더할 수 있었습니다. 여기서는 두 곳을 고쳐야 합니다 —
 * 그게 자체 제작의 값입니다. 대신 수식이 API 로 안 읽히는 일도, 뷰 종류를 못 바꾸는 일도
 * 없습니다.
 *
 * ⚠️ 이 파일은 서버·클라이언트 양쪽에서 읽습니다. 비밀이 들어가면 안 됩니다.
 */

export type FieldType =
  | 'text'        // 한 줄
  | 'longtext'    // 여러 줄
  | 'select'      // 하나 고르기
  | 'multi'       // 여럿 고르기
  | 'date'
  | 'number'
  | 'money'       // 원 단위 정수
  | 'bool'
  | 'url'
  | 'email'
  | 'phone'
  | 'ref';        // 다른 표의 행 하나

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
  /** type: 'ref' 일 때 가리키는 표 */
  ref?: TableName;
  /** 비워 둘 수 없는 칸 */
  required?: boolean;
  /** 칸 아래 작게 붙는 설명. 노션의 속성 설명을 그대로 옮겼습니다 */
  hint?: string;
  /** 목록 화면에 기본으로 보일지 */
  inList?: boolean;
};

export type TableDef = {
  name: TableName;
  /** 화면에 쓰는 이름 */
  label: string;
  /** 행 하나를 부르는 말 — "할 일 추가" 처럼 씁니다 */
  unit: string;
  /** 제목 역할을 하는 컬럼 */
  titleKey: string;
  /** 목록 기본 정렬 (SQL 조각이 아니라 컬럼명 + 방향) */
  orderBy: { key: string; dir: 'asc' | 'desc' }[];
  fields: Field[];
  /** 이 표가 무엇을 위한 것인지 — 사람과 에이전트 양쪽에게 */
  purpose: string;
};

export type TableName =
  | 'visions' | 'goals' | 'tasks' | 'products' | 'partners'
  | 'playbooks' | 'ledger' | 'qc_log' | 'supply' | 'archive';

/* ── 여러 표가 함께 쓰는 목록 ───────────────────────────────────────────── */

/** 영역 6개. 늘리지 않습니다. */
export const AREAS = ['브랜드', '제품', '생산·품질', '마케팅', '재무', '운영'] as const;

/**
 * 목표의 두 층.
 *
 * 비전은 1년짜리고 할 일은 하루짜리입니다. 그 사이를 목표 한 층이 혼자 메우면
 * '이번 달에 무엇을'과 '이번 주에 무엇을'이 같은 칸에 섞입니다.
 * 월은 비전에, 주는 월에 매답니다.
 */
export const HORIZONS = ['월', '주'] as const;
export type Horizon = (typeof HORIZONS)[number];

export const TOOLS = [
  'Notion', 'Claude', 'Shopify', 'Meta Ads', 'Instagram', 'YouTube',
  'Telegram', 'Higgsfield', 'Google Analytics', 'Make/Zapier', 'Gmail', 'Slack',
] as const;

/* ── 표 정의 ────────────────────────────────────────────────────────────── */

export const TABLES: Record<TableName, TableDef> = {
  visions: {
    name: 'visions',
    label: '비전',
    unit: '비전',
    titleKey: 'title',
    orderBy: [{ key: 'sort', dir: 'asc' }],
    purpose: '최상위. 2–3개를 넘기지 않는다. 모든 목표는 이 중 하나를 향한다.',
    fields: [
      { key: 'title', label: '비전', type: 'text', required: true, inList: true },
      { key: 'one_liner', label: '한 줄', type: 'longtext', hint: '이 비전이 이뤄진 상태를 한 문장으로', inList: true },
      { key: 'metric', label: '지표', type: 'text', hint: '무엇으로 도달했는지 판단하는가' },
      { key: 'target', label: '목표값', type: 'text' },
      { key: 'current', label: '현재', type: 'text', inList: true },
      { key: 'due', label: '기한', type: 'date', inList: true },
      { key: 'status', label: '상태', type: 'select', options: ['초안', '확정', '달성'], inList: true },
    ],
  },

  goals: {
    name: 'goals',
    label: '목표',
    unit: '목표',
    titleKey: 'title',
    orderBy: [{ key: 'due', dir: 'asc' }],
    purpose: '두 층이다 — 달 단위 목표와, 그것을 떠받치는 주 단위 목표. 반드시 완료 조건 한 문장이 있다.',
    fields: [
      { key: 'title', label: '목표', type: 'text', required: true, inList: true },
      { key: 'done_when', label: '완료 조건', type: 'longtext', required: true,
        hint: '이 목표가 끝났다고 말할 수 있는 상태를 한 문장으로', inList: true },
      { key: 'horizon', label: '단위', type: 'select', options: HORIZONS, required: true, inList: true,
        hint: '이번 달에 이룰 것이면 월, 그 달을 이루려고 이번 주에 할 것이면 주' },
      { key: 'vision_id', label: '비전', type: 'ref', ref: 'visions', inList: true },
      { key: 'parent_id', label: '상위 목표', type: 'ref', ref: 'goals',
        hint: '주 단위일 때만 — 이 주가 떠받치는 달 단위 목표' },
      { key: 'area', label: '영역', type: 'select', options: AREAS, inList: true },
      { key: 'status', label: '상태', type: 'select', options: ['대기', '진행중', '완료', '보류'], inList: true },
      { key: 'priority', label: '우선순위', type: 'select', options: ['지금', '이번 분기', '언젠가'], inList: true },
      { key: 'due', label: '기한', type: 'date', inList: true },
      { key: 'done_on', label: '완료일', type: 'date' },
      { key: 'result', label: '결과', type: 'longtext',
        hint: '끝난 뒤에 채운다. 무엇을 얻었고 무엇을 다시 안 하겠는가' },
      { key: 'owner_id', label: '담당', type: 'ref', ref: 'members' as TableName },
      { key: 'note', label: '메모', type: 'longtext' },
    ],
  },

  tasks: {
    name: 'tasks',
    label: '할 일',
    unit: '할 일',
    titleKey: 'title',
    orderBy: [{ key: 'due', dir: 'asc' }],
    purpose: '반드시 목표에 연결한다. 연결할 목표가 없으면 만들기 전에 사람에게 묻는다.',
    fields: [
      { key: 'title', label: '할 일', type: 'text', required: true, inList: true },
      { key: 'goal_id', label: '목표', type: 'ref', ref: 'goals', required: true, inList: true },
      { key: 'status', label: '상태', type: 'select', options: ['예정', '진행중', '대기', '완료', '보류'], inList: true },
      { key: 'due', label: '마감일', type: 'date', inList: true },
      { key: 'field', label: '분야', type: 'select',
        options: ['디자인', '생산', '콘텐츠', '마케팅', '재무', '운영', '브랜딩'], inList: true },
      { key: 'priority', label: '우선순위', type: 'select', options: ['높음', '보통', '낮음'], inList: true },
      { key: 'hours', label: '소요 시간(h)', type: 'number' },
      { key: 'product_id', label: '관련 스타일', type: 'ref', ref: 'products' },
      { key: 'partner_id', label: '관련 거래처', type: 'ref', ref: 'partners' },
      { key: 'owner_id', label: '담당', type: 'ref', ref: 'members' as TableName },
      { key: 'note', label: '메모', type: 'longtext' },
    ],
  },

  products: {
    name: 'products',
    label: '스타일',
    unit: '스타일',
    titleKey: 'name',
    orderBy: [{ key: 'sku', dir: 'asc' }],
    purpose: 'Shopify 핸들이 두 시스템을 잇는 유일한 고리다. 판매중으로 올릴 때 반드시 채운다.',
    fields: [
      { key: 'name', label: '스타일명', type: 'text', required: true, inList: true },
      { key: 'line', label: '라인', type: 'select', options: ['Midbar', 'Eden', '미정'], inList: true },
      { key: 'kind', label: '품목', type: 'select', options: ['상의', '하의', '아우터', '액세서리'], inList: true },
      { key: 'stage', label: '단계', type: 'select',
        options: ['기획', '디자인', '생산', '입고', '판매중', '종료'], inList: true },
      { key: 'cost', label: '원가', type: 'money', inList: true },
      { key: 'price', label: '판매가', type: 'money', inList: true },
      { key: 'launch_on', label: '출시 예정일', type: 'date', inList: true },
      { key: 'shopify_handle', label: 'Shopify 핸들', type: 'text' },
      { key: 'note', label: '메모', type: 'longtext' },
    ],
  },

  partners: {
    name: 'partners',
    label: '거래처',
    unit: '거래처',
    titleKey: 'name',
    orderBy: [{ key: 'last_contact', dir: 'desc' }],
    purpose: '공장을 모르면 단가 협상도 품질 책임추궁도 못 한다. 최근 컨택을 비워 두지 않는다.',
    fields: [
      { key: 'name', label: '업체명', type: 'text', required: true, inList: true },
      { key: 'kinds', label: '구분', type: 'multi',
        options: ['원단', '봉제', '프린팅', '부자재', '촬영', '모델', '물류', '기타'], inList: true },
      { key: 'status', label: '관계 상태', type: 'select',
        options: ['탐색중', '견적 대기', '거래중', '보류', '중단'], inList: true },
      { key: 'last_contact', label: '최근 컨택', type: 'date', inList: true },
      { key: 'contact_name', label: '담당자', type: 'text', inList: true },
      { key: 'phone', label: '연락처', type: 'phone' },
      { key: 'email', label: '이메일', type: 'email' },
      { key: 'link', label: '링크', type: 'url' },
      { key: 'moq', label: '최소 수량', type: 'number' },
      { key: 'price_note', label: '단가 메모', type: 'longtext' },
    ],
  },

  playbooks: {
    name: 'playbooks',
    label: '플레이북',
    unit: '플레이북',
    titleKey: 'title',
    orderBy: [{ key: 'title', dir: 'asc' }],
    purpose: '반복 절차서. 사람 승인 지점이 AI가 멈추는 경계다.',
    fields: [
      { key: 'title', label: '플레이북', type: 'text', required: true, inList: true },
      { key: 'area', label: '영역', type: 'select', options: AREAS, inList: true },
      { key: 'status', label: '상태', type: 'select', options: ['아이디어', '준비', '시험', '가동'], inList: true },
      { key: 'actor', label: '실행 주체', type: 'select', options: ['수식', 'AI', '사람'], inList: true },
      { key: 'cadence', label: '주기', type: 'select', options: ['매일', '매주', '매월', '이벤트', '요청 시'], inList: true },
      { key: 'tools', label: '도구', type: 'multi', options: TOOLS },
      { key: 'trigger_when', label: '트리거', type: 'longtext', hint: '무엇이 이 일을 시작시키는가' },
      { key: 'input', label: '입력', type: 'longtext', hint: '돌기 전에 준비돼 있어야 하는 것' },
      { key: 'output', label: '출력', type: 'longtext', hint: '끝나면 어디에 무엇이 남는가' },
      { key: 'approval', label: '사람 승인 지점', type: 'longtext', hint: 'AI가 멈추고 사람이 결정하는 곳' },
      { key: 'procedure', label: '절차', type: 'longtext', hint: 'AI에게 그대로 건네는 본문' },
      { key: 'last_run', label: '마지막 실행', type: 'date', inList: true },
    ],
  },

  ledger: {
    name: 'ledger',
    label: '지출',
    unit: '지출',
    titleKey: 'title',
    orderBy: [{ key: 'spent_on', dir: 'desc' }],
    purpose: '지출만 담는다. 매출의 원본은 Shopify다 — 여기에 매출 행을 만들지 않는다.',
    fields: [
      { key: 'title', label: '내역', type: 'text', required: true, inList: true },
      { key: 'amount', label: '금액', type: 'money', required: true, inList: true },
      { key: 'spent_on', label: '날짜', type: 'date', required: true, inList: true },
      { key: 'scope', label: '구분', type: 'select', options: ['사업', '개인'], required: true, inList: true },
      { key: 'account', label: '계정 항목', type: 'select', inList: true, options: [
        '원단/부자재', '봉제/생산', '촬영/콘텐츠', '광고/마케팅', '툴/구독',
        '배송/물류', '사무/장비', '세금/수수료', '식비', '교통', '주거', '여가', '기타'] },
      { key: 'nature', label: '성격', type: 'select', options: ['필요', '낭비', '투자'], inList: true },
      { key: 'recurring', label: '고정비', type: 'bool', inList: true },
      { key: 'product_id', label: '관련 스타일', type: 'ref', ref: 'products' },
      { key: 'partner_id', label: '거래처', type: 'ref', ref: 'partners' },
      { key: 'note', label: '메모', type: 'longtext' },
    ],
  },

  qc_log: {
    name: 'qc_log',
    label: '검수',
    unit: '검수 기록',
    titleKey: 'title',
    orderBy: [{ key: 'checked_on', dir: 'desc' }],
    purpose: '판정은 사람만 내린다. 끝난 행을 지우지 않는다 — 지난 불량률이 다음 시즌의 유일한 근거다.',
    fields: [
      { key: 'title', label: '검수명', type: 'text', required: true, inList: true },
      { key: 'kind', label: '유형', type: 'select', options: ['샘플 검수', '입고 검수', '고객 클레임'], inList: true },
      { key: 'verdict', label: '판정', type: 'select', options: ['합격', '조건부', '불합격'], inList: true },
      { key: 'round', label: '차수', type: 'number', hint: '샘플 1차, 2차 구분', inList: true },
      { key: 'qty_checked', label: '검수 수량', type: 'number', inList: true },
      { key: 'qty_defect', label: '불량 수량', type: 'number', inList: true },
      { key: 'checked_on', label: '검수일', type: 'date', inList: true },
      { key: 'product_id', label: '관련 스타일', type: 'ref', ref: 'products', inList: true },
      { key: 'partner_id', label: '거래처', type: 'ref', ref: 'partners' },
      { key: 'issue', label: '주요 이슈', type: 'longtext' },
      { key: 'action', label: '조치', type: 'longtext' },
    ],
  },

  supply: {
    name: 'supply',
    label: '살 것',
    unit: '품목',
    titleKey: 'title',
    orderBy: [{ key: 'created_at', dir: 'desc' }],
    purpose: '사고 싶은 것을 적어 두는 곳. 실제로 산 돈은 지출로 간다.',
    fields: [
      { key: 'title', label: '품목', type: 'text', required: true, inList: true },
      { key: 'purpose', label: '용도', type: 'select',
        options: ['촬영 장비', '작업 도구', '소프트웨어', '포장/패키징', '사무', '기타'], inList: true },
      { key: 'status', label: '상태', type: 'select',
        options: ['검토중', '구매 예정', '구매 완료', '보류'], inList: true },
      { key: 'priority', label: '우선순위', type: 'select', options: ['지금 필요', '이번 분기', '언젠가'], inList: true },
      { key: 'est_amount', label: '예상 금액', type: 'money', inList: true },
      { key: 'reason', label: '필요한 이유', type: 'longtext' },
      { key: 'link', label: '구매 링크', type: 'url' },
    ],
  },

  archive: {
    name: 'archive',
    label: '작업물',
    unit: '작업물',
    titleKey: 'title',
    orderBy: [{ key: 'created_at', dir: 'desc' }],
    purpose: '파일이 사는 유일한 곳. 영수증과 검수 사진처럼 제 자리가 있는 파일은 여기 중복해 넣지 않는다.',
    fields: [
      { key: 'title', label: '제목', type: 'text', required: true, inList: true },
      { key: 'one_liner', label: '한 줄', type: 'longtext', required: true,
        hint: '이게 무엇이고 왜 남기는가. 반년 뒤의 나에게 쓴다', inList: true },
      { key: 'kind', label: '유형', type: 'select', inList: true, options: [
        '사양서', '촬영본', '디자인', '견적서', '계약서', '리포트', '문서', '이미지', '영상', '기타'] },
      { key: 'dated_on', label: '날짜', type: 'date', inList: true },
      { key: 'goal_id', label: '관련 목표', type: 'ref', ref: 'goals', inList: true },
      { key: 'product_id', label: '관련 스타일', type: 'ref', ref: 'products' },
      { key: 'partner_id', label: '관련 거래처', type: 'ref', ref: 'partners' },
      { key: 'task_id', label: '관련 할 일', type: 'ref', ref: 'tasks' },
      { key: 'link', label: '링크', type: 'url' },
    ],
  },
};

/** 사이드바에 이 순서로 놓습니다 — 자주 여는 것부터 */
export const TABLE_ORDER: TableName[] = [
  'tasks', 'goals', 'visions', 'products', 'partners',
  'ledger', 'qc_log', 'archive', 'playbooks', 'supply',
];

export function tableOf(name: string): TableDef | null {
  return (TABLES as Record<string, TableDef>)[name] ?? null;
}
