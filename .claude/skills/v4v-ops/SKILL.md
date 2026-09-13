---
name: v4v-ops
description: V4V(VISION FOR VISIONARY) 운영 보드를 읽고 쓰는 정해진 절차. 주간 정리, 월 결산, 지출 받아쓰기, 작업물 보관, 목표 회고, Shopify 대조, 플레이북 실행을 수행한다. "이번 주 정리", "월 결산", "지출 넣어줘", "작업물에 넣어줘", "보드 업데이트", "V4V 운영", "플레이북" 같은 요청과, 보드의 비전/목표/할 일/작업물/플레이북/스타일/거래처/지출/살 것/검수를 건드리는 모든 작업에 사용한다.
---

# V4V 운영

보드는 이제 **이 저장소 안에** 있습니다. `/ops` 주소로 열고, 데이터는 Supabase Postgres에 있습니다.
노션이 아닙니다 — 2026-09-12에 옮겼습니다. 원본 노션 보드는 읽기 전용 보관소로 남아 있습니다.

## 어디에 무엇이 있는가

| | 어디 |
|---|---|
| 화면 | `app/ops/` — 보드 `/ops`, 표 `/ops/<표>`, 행 `/ops/<표>/<id>`, 문서 `/ops/docs` |
| 표 정의 (컬럼·선택지·라벨) | `lib/ops/schema.ts` — **컬럼을 더하려면 여기와 `ops-migration/schema.sql` 둘 다** |
| 계산식 (신호·진행률·마진·불량률·흐름) | `lib/ops/signals.ts` — 한 곳뿐입니다 |
| 첫 화면 '흐름' (비전→달→주→오늘 나무) | `lib/ops/cascade.ts` (계산) · `app/ops/(board)/Cascade.tsx` (화면) |
| 조회 (브리핑·보드) | `lib/ops/queries.ts` |
| 쓰기 (서버 액션) | `app/ops/actions.ts` |
| 산문 (브랜드 정의·톤앤매너·검수 기준) | `content/ops/*.md` — **사람 소유. 요청 없이 고치지 않는다** |
| 데이터베이스 스키마 | `ops-migration/schema.sql` |
| 옮겨 온 원본 | `ops-migration/notion/*.json` (깃에 올리지 않음) |

## 데이터를 읽고 쓰는 법

```bash
npm run ops:q -- "select title, due, status from tasks where status <> '완료' order by due"
npm run ops:q -- --json "select * from goals where status = '진행중'"
npm run ops:q -- --write "update tasks set status = '완료' where id = '...'"
```

쓰는 명령에는 `--write` 가 필요합니다. `drop`·`truncate`·`alter table` 은 막혀 있습니다.

**표 모양을 바꿀 때**는 명령줄이 아니라 파일로 합니다 — 깃에 남고, 다시 돌려도 같은 결과가
나옵니다(`if not exists`). `ops-migration/` 에 `.sql` 을 하나 만들고:

```bash
npm run ops:migrate -- ops-migration/002-cascade.sql
```

한 트랜잭션으로 돕니다. 중간에 실패하면 아무것도 바뀌지 않습니다.
바꾼 내용은 `ops-migration/schema.sql`(처음부터 새로 만들 때 쓰는 원본)과
`lib/ops/schema.ts`(화면·폼·에이전트가 읽는 정의)에도 **함께** 반영합니다.

**노션 때와 달라진 것:** 수식 값이 `formulaResult://` 로 오지 않습니다. 상대 날짜 필터도
그냥 SQL 입니다. 한 번의 질의로 답이 나옵니다 — 여러 번 왕복하지 않습니다.

## 구조 — 한 줄기로 흐르는 다섯 층

    철학 ── 비전(年) ── 달 목표(月) ── 주 목표(週) ── 할 일(日)

맨 위가 **철학**입니다. `settings` 표의 `philosophy` 키이고 보드 맨 위에 뜹니다.
데이터가 아니라 기준입니다. 사용자가 직접 말할 때만 고칩니다.

- **비전 `visions`** 연 단위. 2–3개. 최상위. 늘리지 않습니다.
- **달 목표 `goals` (`horizon = '월'`)** 이번 달에 이룰 것. `vision_id` 로 비전에 연결합니다.
- **주 목표 `goals` (`horizon = '주'`)** 그 달을 이루려고 이번 주에 할 것.
  `parent_id` 로 달 목표에 매답니다. 목표는 **어느 층이든** `done_when`(완료 조건)
  한 문장이 있어야 합니다.
- **할 일 `tasks`** 하루 단위. `goal_id` 가 **not null** 입니다 — 목표 없는 할 일은 만들 수 없습니다.
  가능하면 주 목표에 매답니다. 연결할 목표가 없으면 만들기 전에 사용자에게 묻습니다.
- **영역** 6개 (브랜드 · 제품 · 생산·품질 · 마케팅 · 재무 · 운영). `goals.area`·`playbooks.area`
  이자 `content/ops/` 의 문서 이름입니다. 6개에서 늘리지 않습니다.

**진행률은 네 층 모두 같은 규칙 하나입니다** — 그 아래 달린 할 일 중 끝난 비율
(`lib/ops/signals.ts` 의 `flow`). 층마다 다른 계산을 쓰면 60%가 무슨 60%인지 매번
다시 물어야 합니다. 할 일이 하나도 없으면 0%가 아니라 **없음**입니다.
첫 화면의 관(파이프)이 차오르는 높이가 바로 이 숫자입니다.

곁가지:
- **작업물 `archive`** 파일이 사는 유일한 곳. `one_liner` 를 반드시 채웁니다(비울 수 없습니다).
- **플레이북 `playbooks`** 반복 절차서. `procedure` 에 AI에게 건넬 본문이 있습니다.
- **메모 `memos`** 팀원별 쪽지. 보드 아래쪽 칸. 자기 칸에만 씁니다. 기록이 쌓이지 않으니
  남아야 할 것은 할 일·목표·작업물로 옮깁니다.

## 표와 컬럼

컬럼 이름은 영문, 화면 라벨은 한글입니다. 정확한 목록은 `lib/ops/schema.ts` 가 원본입니다.

| 표 | 제목 컬럼 | 자주 쓰는 것 |
|---|---|---|
| `visions` | title | one_liner, metric, target, current, due, status |
| `goals` | title | done_when, **horizon('월'·'주')**, **parent_id**, area, status, priority, due, done_on, result, note, vision_id |
| `tasks` | title | status, field, priority, due, hours, note, **goal_id**, product_id, partner_id |
| `products` | name | sku, line, kind, stage, cost, price, launch_on, shopify_handle |
| `partners` | name | kinds[], status, contact_name, phone, email, moq, price_note, last_contact |
| `ledger` | title | amount, spent_on, scope, account, nature, recurring, product_id, partner_id |
| `qc_log` | title | kind, verdict, round, qty_checked, qty_defect, checked_on, issue, action |
| `supply` | title | purpose, status, priority, est_amount, reason, link |
| `archive` | title | **one_liner**, kind, dated_on, link, goal_id/task_id/product_id/partner_id |
| `playbooks` | title | area, status, actor, cadence, tools[], trigger_when, input, output, approval, procedure |

조인 표: `goal_playbooks`, `goal_products`, `product_partners`.
파일: `files` (archive_id · ledger_id · qc_log_id 중 하나에 붙습니다).

## 절대 규칙

1. **계산되는 값을 저장하지 않습니다.** 신호·진행률·마진율·불량률·컨택 경과는 컬럼이 아닙니다.
   `lib/ops/signals.ts` 가 읽을 때 계산합니다. 화면도 에이전트도 같은 함수를 씁니다.
2. **임계값은 두 곳에 있습니다.** 마진 60/50은 `signals.ts` 와 `content/ops/finance.md`,
   불량률 2/5는 `signals.ts` 와 `content/ops/production.md`, 컨택 21/14는 `signals.ts`.
   바꾸려면 **함께** 고칩니다. 한쪽만 고치면 화면의 색과 문서의 기준이 달라집니다.
3. **판정은 사람이 합니다.** QC 판정, 단가 결정, 브랜드·비전 결정, 지출 승인, 광고 예산 집행,
   메일 발송은 자동으로 하지 않습니다. 초안까지만 만들고 확정은 사용자에게 넘깁니다.
   `playbooks.approval` 이 그 경계입니다.
4. **끝난 행을 지우지 않습니다.** 상태만 바꿉니다. 지난 원가와 불량률이 다음 시즌의 유일한 근거입니다.
5. **`content/ops/*.md` 는 사람 소유입니다.** 요청 없이 고치지 않습니다. 깃 히스토리가 판본 기록입니다.
6. **사업과 개인을 섞지 않습니다.** `ledger.scope` 가 그 경계입니다.
7. **매출의 원본은 Shopify 입니다.** `ledger` 에 매출 행을 만들지 않습니다 — 지출만 담습니다.

## 작업

### 브리핑 — 이제 AI가 하지 않습니다

보드를 여는 순간 `lib/ops/queries.ts` 의 `briefing()` 이 계산해서 맨 위에 그립니다.
노션 때는 Claude 데스크톱 스케줄이 매일 아침 콜아웃을 덮어썼고, 앱이 꺼져 있으면
어제 숫자가 그대로 남았습니다. 그 문제 자체가 없어졌습니다.

사용자가 "브리핑"이라고 하면 같은 숫자를 SQL 로 직접 내서 대화로 알려 줍니다.
어딘가에 써 넣지 않습니다 — 화면이 이미 최신입니다.

### 주간 정리 (월요일)

0. **이번 주의 주 목표를 세웁니다.** 진행중인 달 목표마다 "이번 주에 무엇을 끝내면
   이 달이 한 칸 가는가"를 묻고, 답을 `horizon='주'` · `parent_id=<달 목표>` 로 만듭니다.
   `done_when` 을 반드시 채웁니다. 주 목표는 한 주에 3–5개를 넘기지 않습니다 —
   넘기면 그건 계획이 아니라 목록입니다.
1. 마감일이 없는 미완료 할 일을 목록으로 보여 주고, 마감일을 넣을지 지울지 묻습니다.
2. 2주 넘게 `updated_at` 이 그대로인 할 일을 짚습니다.
3. 목표를 영역별로 훑어 진행률과 신호를 한 줄씩 보고합니다.
   할 일이 하나도 연결되지 않은 진행중 목표를 짚습니다.
4. `last_contact` 가 14일 넘은 거래처(`status in ('거래중','견적 대기')`)를 정리하고,
   요청하면 메일 초안을 씁니다.
5. 지난주에 완료로 바뀐 목표가 있으면 "목표 마감 회고" 플레이북을 제안합니다.

### 월 결산 (매월 1일)

- 지난달 `ledger` 를 `account` 별로 집계합니다. `scope` 를 절대 섞지 않습니다.
- 고정비(`recurring`) 중 지난달에 실제로 쓰지 않은 구독을 짚습니다.
- 라인별(Midbar/Eden) 지출을 `product_id` 연결로 집계합니다.
- Shopify에서 지난달 매출을 가져옵니다.
- 결과를 `content/ops/finance.md` 에 **한 줄** 덧붙입니다. 판단은 쓰지 않고 사실만 씁니다.
  (문서는 사람 소유지만, 월 결산 한 줄은 이 절차가 쌓기로 정해 둔 자리입니다)

### 지출 받아쓰기

"어제 원단 30만원 김사장님한테" 같은 한 줄을 `ledger` 행으로 만듭니다.

- 날짜·금액·내역은 문장에서 뽑습니다. 상대 날짜는 오늘(KST) 기준 절대 날짜로 바꿉니다.
- `account`·`scope`·`nature`·`recurring` 은 **추정해서 채우되**, 만든 뒤 무엇을 어떻게
  추정했는지 한 줄로 보고합니다.
- 업체 이름이 나오면 `partners` 에서 찾아 `partner_id` 로 연결합니다. 없으면 만들지 말고 묻습니다.
- 금액이 모호하면("한 30만원쯤") 채우지 말고 묻습니다.

### 작업물 보관

- `kind` 를 고르고 `one_liner` 를 반드시 씁니다. 반년 뒤에 이게 뭐였는지 알 수 있는 문장이어야 합니다.
- 관련 목표·스타일·거래처·할 일을 연결합니다. 연결이 검색보다 강합니다.
- 파일 업로드는 사람이 `/ops/archive/<id>` 화면에서 합니다. 행과 분류·연결까지가 AI 몫입니다.
- 영수증(`ledger`)과 검수 사진(`qc_log`)처럼 **이미 제 자리가 있는 파일은 작업물에 중복해 넣지 않습니다.**

### 목표 마감 회고

`goals.status` 가 완료로 바뀔 때:

1. 연결된 할 일을 세고 얼마나 걸렸는지 봅니다.
2. 관련 지출 합계를 `ledger` 에서 냅니다.
3. `archive` 에 그 목표의 작업물이 남아 있는지 확인하고, 없으면 짚습니다.
4. `result` 에 **얻은 것 하나와 다시 안 할 것 하나**를 한 줄로 씁니다. 문장 확정은 사용자에게 넘깁니다.
5. `done_on` 을 채웁니다.

### 플레이북 실행

사용자가 플레이북 이름을 말하면:

1. 그 행을 읽습니다 — `input` · `output` · `approval` · `procedure`.
2. `input` 이 비어 있으면 진행하지 않고 무엇이 필요한지 묻습니다.
3. `output` 을 정해진 자리에 만듭니다. 할 일을 만들 때는 `goal_id` 를 반드시 채웁니다.
4. `approval` 지점에서 멈추고 보고합니다. 광고 예산 집행, 게시, 발송, Shopify 쓰기는 하지 않습니다.
5. 끝나면 `last_run` 을 오늘로 바꿉니다.

### Shopify ↔ 보드

스토어는 `v4v-2.myshopify.com` (Basic, KRW, KST).

- `products.shopify_handle` 이 두 시스템을 잇는 유일한 고리입니다. `stage` 를 판매중으로
  바꿀 때 반드시 채웁니다.
- 매출 숫자는 Shopify 분석에서 가져옵니다. 손으로 적지 않습니다.
- 스토어에 쓰기(상품 생성·가격 변경·할인 코드)는 사용자 확인 없이 하지 않습니다.
- "Shopify ↔ 보드 상품 대조" 플레이북에 점검 항목 다섯 개가 있습니다.

### 코드 ↔ 보드 정합성 — 대부분 사라진 일

`lib/brand.ts` 가 사업자 정보의 유일한 원본입니다. `/ops/docs/operations` 의 표는
그 파일을 직접 읽어 그립니다 — **사본이 없어서 어긋날 수가 없습니다.**

남은 점검은 스토어 쪽입니다: 푸터·정책 페이지·메일 하단이 모두 `lib/brand.ts` 의
상수를 쓰는지. 하드코딩된 값이 보이면 상수로 바꿉니다.

> 현재 미해결: `BUSINESS.mailOrderNo` 가 아직 `'pending'` 입니다. 통신판매업 신고는
> 2026-09-12에 끝났는데 번호가 반영되지 않았습니다. 전자상거래법상 표시 의무입니다.

## 이 보드를 다루며 알아 둘 것

- **금액은 원 단위 정수**입니다(`integer`). 돈에 부동소수점을 쓰지 않습니다.
- **날짜는 `YYYY-MM-DD` 문자열**로 다룹니다. `Date` 객체로 바꾸면 KST 자정이 UTC 로 넘어가며
  하루씩 밀립니다. 오늘 날짜는 `todayKST()` 를 씁니다.
- **`tasks.goal_id` 는 `on delete restrict`** 입니다. 할 일이 달린 목표는 지울 수 없습니다.
  먼저 할 일을 옮기세요.
- **`goals.parent_id` 는 자기 자신을 가리킬 수 없습니다** (`goals_parent_not_self`).
  달 목표에 `parent_id` 를 넣지 않습니다 — 달은 비전(`vision_id`)에 매답니다.
- **화면 하나가 접속을 적게 잡습니다.** 첫 화면은 왕복 한 번이고(`cascadeBoard`),
  나머지도 동시에 묻지 않고 차례로 묻습니다. Supabase 풀러의 접속은 프로젝트가
  나눠 쓰는 자리라, 한 화면이 여럿을 쥐면 다음 질의가 **오류 없이 멈춰 섭니다**.
  새 조회를 더할 때 `Promise.all` 로 묶고 싶어지면 한 번 더 생각하세요.
- **노션 페이지 id 를 그대로 기본키로 씁니다** (하이픈만 끼운 UUID). 옮긴 행은 노션 원본과
  id 가 같아서, 필요하면 노션 쪽에서 대조할 수 있습니다.
- **`products.sku` 는 5부터 이어집니다.** 노션에서 2·3·4를 썼습니다.
- **파일은 비공개입니다.** Supabase Storage 비공개 버킷에 있고 `/ops/files/<id>` 로
  우리 서버가 중계합니다. 로그인한 사람만 봅니다.

## 하지 않는 것

- QC 판정을 대신 내리는 것
- 거래처에 보낼 메일을 사용자 확인 없이 보내는 것 (초안까지만)
- 광고 예산을 집행하거나 캠페인을 켜고 끄는 것 (제안까지만)
- 데이터에 없는 숫자를 추정으로 채워 보고하는 것
- `content/ops/*.md` 의 산문(브랜드 정의, 톤앤매너, 원칙)을 요청 없이 다시 쓰는 것
- 목표 없이 할 일을 쌓는 것
- 주 목표를 달 목표에 매달지 않고 띄워 두는 것 (`parent_id` 를 비워 두지 않습니다)
- 끝난 행을 지우는 것
- `ops-migration/notion/*.json` 을 커밋하는 것 (사업 데이터입니다 — `.gitignore` 에 있습니다)
