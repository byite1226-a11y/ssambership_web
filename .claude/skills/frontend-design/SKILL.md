---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

## Ground it in the subject

If the brief does not pin down what the product or subject is, pin it yourself before designing: name one concrete subject, its audience, and the page's single job, and state your choice. If there's any information in your memory about the human's preferences, context about what they're building, or designs you've made before – use that as a hint. The subject's own world, its materials, instruments, artifacts, and vernacular, is where distinctive choices come from. Build with the brief's real content and subject matter throughout.

## Design principles

For web designs, the hero is a thesis. Open with the most characteristic thing in the subject's world, in whatever form makes sense for it: a headline, an image, an animation, a live demo, an interactive moment. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the template answer, only use if that's truly the best option.

Typography carries the personality of the page. Pair the display and body faces deliberately, not the same families you would reach for on any other project, and set a clear type scale with intentional weights, widths, and spacing. Make the type treatment itself a memorable part of the design, not a neutral delivery vehicle for the content.

Structure is information. Structural devices, numbering, eyebrows, dividers, labels, should encode something true about the content, not decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence - like a real process or a typed timeline where order carries information the reader needs. Question if choices like numbered markers actually make sense before incorporating them.

Leverage motion deliberately. Think about where and if animation can serve the subject: a page-load sequence, a scroll-triggered reveal, hover micro-interactions, ambient atmosphere. An orchestrated moment usually lands harder than scattered effects; choose what the direction calls for. However, sometimes less is more, and extra animation contributes to the feeling that the design is AI-generated.

Match complexity to the vision. Maximalist directions need elaborate execution; minimal directions need precision in spacing, type, and detail. Elegance is executing the chosen vision well.

Consider written content carefully. Often a design brief may not contain real content, and it's up to you to come up with copy. Copy can make a design feel as templated as the design itself. See the below section on writing for more guidance.

## Process: brainstorm, explore, plan, critique, build, critique again

For calibration: AI-generated design right now clusters around three looks: (1) a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta accent; (2) a near-black background with a single bright acid-green or vermilion accent; (3) a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns. All three are legitimate for some briefs, but they are defaults rather than choices, and they appear regardless of subject. Where the brief pins down a visual direction, follow it exactly — the brief's own words always win, including when it asks for one of these looks. Where it leaves an axis free, don't spend that freedom on one of these defaults. Just like a human designer who's hired, there's often a careful balance between doing what you're good at and taking each project as a chance to experiment and learn.

Work in two passes. First, brainstorm a short design plan based on the human's design brief: create a compact token system with color, type, layout, and signature. Color: describe the palette as 4–6 named hex values. Type: the typefaces for 2+ roles (a characterful display face that's used with restraint, a complementary body face, and a utility face for captions or data if needed). Layout: a layout concept, using one-sentence prose descriptions and ASCII wireframes to ideate and compare. Signature: the single unique element this page will be remembered by that embodies the brief in an appropriate way.

Then review that plan against the brief before building: if any part of it reads like the generic default you would produce for any similar page (work through a similar prompt to see if you arrive somewhere similar) rather than a choice made for this specific brief — revise that part, say what you changed and why. Only after you've confirmed the relative uniqueness of your design plan should you start to write the code, following the revised plan exactly and deriving every color and type decision from it.

When writing the code, be careful of structuring your CSS selector specificities. It's easy to generate CSS classes that cancel each other out (especially with a type-based selector like .section and a element-based selector like .cta). This can happen often with paddings/margins between sections.

Try to do a lot of this planning and iteration in your thinking, and only show ideas to the user when you have higher confidence it'll delight them.

## Restraint and self-critique

Spend your boldness in one place. Let the signature element be the one memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief. Not taking a risk can be a risk itself! Build to a quality floor without announcing it: responsive down to mobile, visible keyboard focus, reduced motion respected. Critique your own work as you build, taking screenshots if your environment supports it – a picture is worth 1000 tokens. Consider Chanel's advice: before leaving the house, take a look in the mirror and remove one accessory. Human creators have memory and always try to do something new, so if you have a space to quickly jot down notes about what you've tried, it can help you in future passes.

## More on writing in design

Words appear in a design for one reason: to make it easier to understand, and therefore easier to use. They are design material, not decoration. Bring the same intentionality to copy that you would bring to spacing and color. Before writing anything, ask what the design needs to say, and how it can best be said to help the person navigate the experience.

Write from the end user's side of the screen. Name things by what people control and recognize, never by how the system is built. A person manages notifications, not webhook config. Describe what something does in plain terms rather than selling it. Being specific is always better than being clever.

Use active voice as default. A control should say exactly what happens when it's used: "Save changes," not "Submit." An action keeps the same name through the whole flow, so the button that says "Publish" produces a toast that says "Published." The vocabulary of an interface is the signposting for someone navigating the product. Cohesion and consistency are how people learn their way around.

Treat failure and emptiness as moments for direction, not mood. Explain what went wrong and how to fix it, in the interface's voice rather than a person's. Errors don't apologize, and they are never vague about what happened. An empty screen is an invitation to act.

Keep the register conversational and tuned: plain verbs, sentence case, no filler, with tone matched to the brand and the audience. Let each element do exactly one job. A label labels, an example demonstrates, and nothing quietly does double duty.

---

<!-- ===== ssambership House Style: 아래 내용은 위 공식 지침보다 우선함 ===== -->

# 쌤버십 House Style (frontend-design 스킬에 덧붙이는 우리 집 규칙)

> 사용법: 공식 `frontend-design` 스킬을 받은 뒤, 그 `SKILL.md` **맨 아래에 이 내용을 붙여넣는다.**
> 목적: 스킬의 "좋은 디자인 사고"는 빌리되, **우리가 이미 정한 색·정체성·톤은 반드시 따르게** 한다(스킬이 제 마음대로 색·폰트를 못 바꾸게).
> ★이 House Style은 스킬의 일반 지침과 충돌 시 **우선한다.**

---

## 0. 레퍼런스 톤 — "토스의 정갈함 + 클래스101의 콘텐츠 만듦새"
모든 화면은 이 둘의 장점을 섞은 느낌을 목표로 한다:
- **토스에서 가져올 것:** 적은 색·넓은 여백·돈/결제를 불안하지 않고 명료하게 보여주는 정보 위계·부드러운 마이크로 인터랙션. "프로토타입 같다"의 해독제.
- **클래스101에서 가져올 것:** 멘토/콘텐츠 카드의 짜임새, 플랜 비교의 명확함, 썸네일·아바타·뱃지의 정돈된 위계.
- 한 줄 원칙: **"핀테크처럼 깔끔하게, 콘텐츠는 카드로 또렷하게."**

## 1. 색 — 2색 모델 (절대 규칙, 스킬보다 우선)
스킬이 제안하는 임의 색/그라데이션/보라 히어로를 **쓰지 않는다.** 색은 아래 토큰만:
- **플랫폼/기본 (Blue) `#2563EB`** — 브랜드 + 공개 사이트 + 학생 공간 공유. 학생에게 별도 색 없음(기본을 씀). pale `#EFF4FF` / 진한글자 `#1E429F` / hover `#1D4ED8`.
- **멘토 (Green) `#059669`** — 유일하게 구분되는 역할색. 초록은 이 하나만(다른 초록 금지). pale `#ECFDF5` / 진한글자 `#047857`.
- **강조색은 라우트가 정한다:** 컴포넌트는 `var(--accent)`를 쓰고, 공개+학생 라우트=파랑, **멘토 라우트=초록**(레이아웃에서 덮어씀). 즉 같은 버튼이 멘토 화면에선 초록, 학생 화면에선 파랑.
- **한 화면 = 한 primary 색.** 나머지 버튼은 중립(흰+`#E2E8F0` 테두리). 다른 역할색을 섞지 않는다.
- **상태색(작은 배지로만, 큰 면적 금지):** 완료=연한초록 `#ECFDF5`/`#047857`(+체크) · 대기=앰버 `#D97706` · 분쟁/오류=레드 `#DC2626` · 종료/안내=중립 `#F1F5F9`/`#475569`. ("안내"를 두 번째 파랑으로 만들지 말 것.)
- **역할 배지·아바타**는 역할 고정색(멘토=초록, 학생=파랑) — `var(--accent)` 아님(멘토는 어디서나 초록).
- **인증 배지는 중립 회색**(방패/체크). 초록 금지(완료색과 충돌, 멘토색 잠식).
- **금액:** +는 중립/진한글자, −는 레드. +를 파랑으로 칠하지 않는다.
- **남색(navy)·미정의 색 금지.** 채운 사이드바가 필요하면 역할색 톤으로.

## 2. 절제 (Restraint) — "정갈함"의 핵심 (토스에서)
- **중립·여백 우선.** 화면의 지배색은 흰색/회색/여백이고, 색은 "강조"로만 점처럼. 색으로 화면을 채우지 않는다.
- 버튼마다·배지마다·숫자마다 색칠하지 않는다. 색은 행동을 유도하는 곳에만.
- 그림자는 은은하게(과한 drop-shadow 금지). 테두리는 `#E2E8F0` 한 톤.
- **여백 리듬:** 8px 그리드(8·12·16·24·32). 섹션 간 넉넉히. 빽빽하게 채우지 않는다.

## 3. 타이포 — 한국어 기준
- 한국어 본문에 영문 디스플레이 폰트 강제 금지. 시스템/Pretendard 계열 등 한글이 정갈한 폰트.
- 위계: 제목(굵게)·본문(보통)·보조(회색 `#64748B`). 굵기 남발 금지(2~3단계).
- 숫자(금액·캐시·한도)는 또렷하게 — 토스처럼 금액은 크고 명료하게, 단위는 작게.

## 4. 컴포넌트 만듦새 (클래스101에서)
- **멘토 카드:** 아바타(또는 이니셜) + 이름 + **강점 한 줄** + 핵심 지표(소수, 표본 적으면 숨김). 빈 "—"·UUID 조각 노출 금지. 카드는 정돈된 그리드, 균일한 높이.
- **요금/플랜:** 플랜 비교는 ✓/✗ 매트릭스로 명확히("집중 멘토링" 같은 모호어 금지). 가격은 단일 출처, 질문당 단가 병기.
- **지갑/결제(캐시·질문권):** 토스 톤 — 현재 잔액 크게, 충전 후 예상 잔액 미리보기, "내 돈이 어떻게 되는지" 불안 없이 명료하게. 에스크로/예치는 "안전하게 보관 중→확인 시 지급" 안심 문구를 상단에.
- **빈 상태(Empty state):** "—"나 공백 대신 친절한 안내 + 다음 행동 버튼(아이콘+한 줄+CTA). 빈 콘텐츠를 장황한 설명 박스로 때우지 않는다.
- **상태 표시:** 진행 단계는 스테퍼로, 상태는 작은 배지로. 같은 의미는 같은 색.

## 5. 마이크로 인터랙션 (토스에서) — "살아있는" 느낌
- 버튼·카드에 **hover/active 상태**를 준다(색 살짝 진해짐, 미세한 올라옴). 정적인 회색 덩어리 금지.
- 전환은 **부드럽게**(150~200ms ease). 갑작스러운 점프 금지.
- 로딩은 스켈레톤 또는 부드러운 인디케이터(빈 화면 멈춤 금지).
- 과한 애니메이션·바운스는 금지(핀테크는 절제된 모션).

## 6. 역할 공간 정체성 (멘토=초록 2단계)
- 멘토 라우트에선 강조 전체가 초록(활성탭·로고마크·역할배지·아바타·버튼·링크·포커스). 본문은 중립 유지(초록 틴트 배경 금지 = 3단계 아님).
- 학생·공개는 파랑. admin은 기본(파랑).
- 사용자가 화면에 들어선 순간 "멘토 공간(초록) / 학생·일반 공간(파랑)"을 색으로 느끼게.

## 7. 접근성 (기본)
- 색 대비 충분히(연한 배경 위 연한 글자 금지). 색만으로 의미 전달 금지(아이콘·라벨 병기).
- 포커스 표시 명확히(키보드 사용). 터치 영역 충분히(모바일).

## 8. 금지 목록 (스킬이 하려 해도 막을 것)
- 보라/핑크 그라데이션 히어로, 임의 액센트 색, 남색 네비.
- 색 과다 사용(버튼·배지·숫자 전부 색칠).
- 빈 "—"·UUID 조각·개발메모("준비 중/예정/백엔드")·"초안/(안내)" 노출.
- 한글 화면에 영문 디스플레이 폰트 강제.
- 멘토 화면을 파랑으로, 학생 화면을 초록으로 (역할색 역전).

---

> 요약: **토스의 절제·명료 + 클래스101의 카드 짜임새**를, **2색 체계(파랑 플랫폼·초록 멘토)와 절제 원칙** 위에 얹는다. 스킬의 일반 디자인 감각은 활용하되, 이 House Style의 색·정체성·금지목록은 **항상 우선**한다.
