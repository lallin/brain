# COMPANY 섹션 — 구 × 텍스트 연출 노트

메인 페이지(`/`) COMPANY 구간(numbers-intro "Trusted Cognitive Augmentation." / numbers-users "Redefining the limits of time …")의 스크롤 연출입니다.
레퍼런스 `Braindeck 구 × 텍스트 연출 비교.html`에서 옵션 **3 · 4 · 8 · 10 · 11**을 켠 상태를 사이트에 옮겼습니다.

- **[8] 길잡이**: 구가 텍스트 자리를 먼저 지나간 뒤 중앙에 안착합니다.
- **[4] 구에서 탄생**: 텍스트가 구 쪽에서부터 마스크 와이프로 열리고 초록빛을 받았다가 식습니다. 퇴장할 때는 구 쪽으로 닫힙니다. 이때 구가 펄스합니다.
- **[3] 초점 이동**: 텍스트가 보이는 동안 구가 작아지고 흐려지고 어두워집니다.
- **[11] 스프링**: 구가 스크롤을 살짝 늦게 따라옵니다.
- **[10] 카메라 팬**: 별과 성운이 구와 반대 방향으로 흐릅니다.

---

## 파일

| 파일 | 역할 |
|---|---|
| `company-flow-config.ts` | **조정 가능한 모든 수치**가 담긴 `COMPANY_FLOW` 객체 하나 |
| `company-flow.ts` | 매 프레임 엔진. 진행도 → 텍스트 → 구 경로 → 펄스·초점 → 스프링 → 카메라 순서로 계산 |
| `SharedMoon.tsx` | 한 rAF 루프에서 COMPANY 구간에서는 엔진을, 나머지 구간에서는 기존 체크포인트 스크럽을 사용. 구 위 검정 그라데이션(`.moon-shade`)도 같은 루프에서 씀 |
| `DeepSpace.tsx` | `cameraPan`을 읽어 별(깊이별)과 성운을 이동 |
| `BoilerLabScrollApp.tsx` | 기존 크로스페이드 루프에서 numbers-intro/users를 제외 (엔진이 담당) |
| `NumbersIntroScroll.tsx`, `NumbersUsersScroll.tsx` | 타이핑·커서·3D 팝 진입 제거 (`animate={false}`) |
| `boilerlab-scroll.css` | 맨 아래 "Company flow" 블록. 텍스트 색·글로우·잔상, S 스케일 글자 크기, 구 위 레이어(z 3), 별 레이어 좌우 여유. `.shared-moon` 근처에 `.moon-shade`와 `.stars-slide::after` 끄기 |

엔진은 COMPANY 범위 **밖에서는 아무것도 하지 않습니다**. 히어로, AIR, Solutions 이후 동작은 그대로입니다.
히어로 → COMPANY 경계에서는 히어로가 원래 두던 위치에서 출발하고, COMPANY → AIR 경계에서는 경로 끝 상태에서 기존 스크럽으로 넘어갑니다.

---

## 좌표와 진행도

- **좌표**: 1440×900 디자인 기준, 화면 중앙이 (0,0), +y는 아래. 실제 px = 값 × S, S = min(innerWidth/1440, innerHeight/900).
- **진행도 p**: 페이지가 휠 한 번에 섹션 하나씩 스냅 이동(약 0.5초)하므로, p는 스크롤에 묶이지 않고 **시간으로 재생**됩니다 (`timeline`).
  - 섹션에 들어가면 그 섹션의 정지점(`timeline.stops`)까지 재생: 0 → 0.32(`#numbers-intro`, T1) → 0.615(`#numbers-users`, T2) → 0.86(`#numbers-air`)
  - 위로 스크롤하면 역재생, 재생 중 다시 스크롤하면 그 자리에서 방향만 바뀝니다.
  - T1/T2 정지점에서는 텍스트가 다 열린 뒤 `timeline.hold`(1초)가 지나야 다음으로 넘어갑니다.
  - `#numbers-intro` 진입은 섹션이 절반(`enterAt`) 보일 때, 나머지는 스냅 이동이 25%(`stepAt`) 진행됐을 때 재생됩니다. 더 낮추면 Mission에서 굴러 내려오다 스냅 지점을 조금 지나쳐 멈췄을 때 T1을 건너뛰고 T2로 넘어갑니다.
  - 범위는 `#numbers-intro` 스냅 지점보다 `startVh`(1) 화면 앞부터입니다.

---

## COMPANY_FLOW 조정 방법

모든 값은 `company-flow-config.ts`의 `COMPANY_FLOW` 안에 있습니다. 저장하면 dev 서버에서 바로 반영됩니다.

### 타이밍: `speed`, `timeline`, `text.t1` / `text.t2`

| 하고 싶은 것 | 바꿀 값 |
|---|---|
| 전체를 빠르게/느리게 | `speed` (기본 1, 2 = 두 배 빠름, 0.5 = 절반) |
| 구간별 재생 시간 | `timeline.keys`의 `t`(초) — 각 줄 주석이 어느 순간인지 적혀 있음 |
| 텍스트 정지(읽는) 시간 | `timeline.hold` |
| COMPANY 연출을 더 일찍/늦게 시작 | `anchors.startVh` (클수록 일찍) |
| T1 / T2 등장·퇴장 구간 | `text.t1` / `text.t2`의 `in0 / in1 / out0 / out1` (p 단위, `timeline.keys`의 p와 맞추기) |

기본 재생 시간(speed 1): 구 → T1 자리 0.8초, 도착 0.2초 뒤 T1 와이프 1.45초(끝부분이 느려 체감 약 1.2초), 퇴장 1초, T2도 같은 구성, 구가 다음 섹션으로 내려가는 데 1.2초.

### 텍스트 위치·경로: `text.t1` / `text.t2`

- `x0` + `dx`: 왼쪽 끝 x (등장하면서 `dx`만큼 이동)
- `y0 → y1 → y2`: 세로 중심 y. y0 등장 시작 → y1 정지 → y2 퇴장 끝.
- `wipe`: 마스크가 열리는 방향. `"to left"`면 오른쪽(구 쪽)에서 열립니다.

### 와이프·색·잔상: `text.*`

| 값 | 의미 |
|---|---|
| `wipeOvershoot` (1.2), `wipeFeather` (20) | 마스크 진행 배율, 경계 부드러움(%) |
| `hot`, `coolFrom` | 받는 초록색, 등장 중 식기 시작하는 지점(inP) |
| `glowRgb`, `glowRadius`, `glowAlpha` | 텍스트 초록 글로우 |
| `echoGap`, `echoGrowth`, `echoOutRamp` | 잔상 간격(× S px), 퇴장 시 간격 증가, 퇴장 시 켜지는 속도 |
| `echoStrength` (0.45) | 잔상 밝기. 레퍼런스는 회색(#6d6b72) 잔상이라 흰색 기준 0.45 |
| `exitFade` | 퇴장 중 본문 투명도 감소량 |
| `maxFontScale` (1.3) | 큰 화면에서 글자 크기 상한. 저장값(53/57.5px)을 S = 1로 봅니다 |

### 구: `sphere`, `pulse`, `focus`

| 값 | 의미 |
|---|---|
| `sphere.waypoints` | [8] 길잡이 경로 `{p, x, y, s}`. s = 1이면 지름 400 × S px |
| `sphere.minDiameter` (120) | 구 지름 하한(px). 크기에만 적용되고, 이동 거리는 S를 그대로 씁니다 |
| `sphere.opacity`, `sphere.introBlend` | COMPANY 구간 구 투명도, 히어로 값에서 넘어오는 구간 |
| `pulse.scale` / `pulse.glowScale` / `pulse.inSpan` | [4] 구 반응 펄스 |
| `focus.scale / blur / brightness / saturate` | [3] 텍스트가 보일 때 구가 물러나는 정도 |
| `focus.glowBase / glowDim / glowPulse` | [3] 구 글로우 투명도 |

### 스프링·카메라: `spring`, `camera`

| 값 | 의미 |
|---|---|
| `spring.stiffness` (0.03) / `damping` (0.88) | [11] 60fps 기준 스프링. stiffness가 작을수록 더 늦게 따라오고, damping이 작을수록 덜 출렁입니다 |
| `spring.edgeVh` | COMPANY 양 끝에서 스프링이 기존 스크럽으로 넘겨주는 거리 |
| `camera.amount` / `yOffset` | [10] 카메라 오프셋 = (x, y − yOffset) × S × amount |
| `camera.starMin` | 가장 먼 별의 이동 비율 (가까운 별 = 1) |
| `camera.nebula` | 성운 이동 비율 |
| `camera.smoothing` | 팬이 켜지고 꺼지는 속도 |

### 구 위 검정 그라데이션: `shade`

| 값 | 기본 | 의미 |
|---|---|---|
| `shade.alpha` | 0.8 | 중앙 진하기 (rgb(0 0 0 / alpha) → 가장자리 투명) |
| `shade.size` | "41rem" | 원 지름. 구 크기(scale)와 무관하게 고정 |
| `shade.fadeIn` / `shade.fadeOut` | 0.6 / 0.3 | 나타나기·사라지기 시간(초), ease-out |
| `shade.reducedFade` | 0.15 | prefers-reduced-motion일 때 양쪽 페이드 시간(초) |
| `shade.settlePx` / `shade.settleSpeed` | 1 / 0.1 | 스프링이 "멈췄다"고 보는 기준: 목표까지 거리(px), 속도(60Hz 한 스텝당 px). 크기(w)도 같은 기준 |

---

## 구현 메모

- **[3] 필터는 CSS filter로 처리**: 구 셰이더(MagicMarble)는 Contacts·Solutions 구와 공유합니다. 블러는 WebGL에서도 추가 렌더 패스가 필요하므로 CSS filter를 택했습니다. GPU 합성으로 처리되고, 효과가 있을 때만 `filter`가 걸립니다(평소에는 `none`).
- **텍스트 색**: 레퍼런스처럼 단색 mix(#F2F2F2 → 초록)입니다. 기존의 흰→청록 그라데이션 글자는 text-shadow(잔상) 아래에 깔려 초록이 보이지 않아서 단색으로 바꿨습니다.
- **텍스트 크기**: 저장된 글자 크기 × min(S, 1.3)입니다. 글자 박스 너비도 같은 배율로 커지므로 줄바꿈은 1440 기준과 같습니다 (T1 2줄, T2 4줄).
- **레이어**: COMPANY 두 섹션은 z-index 3이라 텍스트가 구 위에 그려집니다 (레퍼런스와 동일).
- **reduced motion**: 스프링, 카메라 팬, 블러, 와이프를 끄고 텍스트는 정지 위치에서 페이드만 합니다.

---

## 텍스트 라벨 (2026-10-01)

T1 위에 "Core Value", T2 위에 "Vision" 라벨이 작게 나옵니다(첫 화면 부제와 같은 초록 대문자 Space Grotesk).
- 편집 id `numbers.intro.label` / `numbers.users.label`(EditableText). KO/JA는 `local.core_value_label` / `local.vision_label`(핵심 가치·비전 / コアバリュー·ビジョン).
- 같은 블록 안에 있어서 문장과 함께 움직이고 와이프됩니다. 문장의 저장된 위치 오프셋(`__pos`)을 `--cf-label-x/-y`로 따라가고, 문장의 보이는 정도(`--cf-label` = w)로 나타나고 사라집니다. 크기는 문장과 같은 배율(k)입니다. 잔상(text-shadow)은 라벨에 걸지 않습니다.

## 구 위 검정 그라데이션 (2026-10-01)

원래는 `boilerlab.css`의 `.stars-slide:after`(41rem 원, #000c → 투명)가 섹션 5곳(#mission, 숫자 섹션 3개, #partners)의 화면 중앙에 붙어 있었습니다. 그래서 스크롤하면 원이 섹션과 함께 먼저 올라오고, 구는 나중에 따로 도착해 얼룩처럼 보였습니다.

- **섹션 원 끄기**: `boilerlab-scroll.css`에서 `.boilerlab-root.scroll-mode .stars-slide::after { content: none }`로 껐습니다. `boilerlab.css`는 `/classic`과 같이 쓰는 파일이라 그대로 두었고, `/classic`의 원도 그대로입니다.
- **구를 따라다니는 원**: `SharedMoon`이 `.shared-moon` 바로 뒤에 형제 요소 `.moon-shade`를 둡니다. 둘 다 `position: fixed`, z-index 2이고, DOM 순서가 뒤라서 구 위에 그려집니다. COMPANY 섹션(z 3)과 텍스트보다는 아래입니다. 구의 자식이 아니므로 구의 scale과 [3] 초점 filter가 원에 걸리지 않습니다. 중심은 스프링이 적용된 실제 구 중심(`moonShade.cx / cy`)입니다.
- **언제 보이나** (`company-flow.ts` 7단계):
  - 켜짐: COMPANY 범위 안에서 타임라인이 T1(p 0.32) 또는 T2(p 0.615) 정지점에 **멈춰 있고**, 동시에 스프링이 목표에 정착했을 때 (`settlePx` / `settleSpeed`). 정착 후 `fadeIn` 0.6초 동안 ease-out으로 나타납니다. 타임라인만 보면 스프링 지연 때문에 구가 도착하기 전에 켜지므로 두 조건을 같이 씁니다.
  - 꺼짐: 타임라인이 정지점을 떠나는 순간(다음 섹션으로 스크롤, 위로 역스크롤, AIR로 넘어가며 T2가 퇴장하는 `companyFlowPlay.leave` 포함) `fadeOut` 0.3초 동안 사라집니다. 한 번 켜지면 정지해 있는 동안은 스프링의 마지막 미세한 흔들림 때문에 꺼지지 않습니다.
  - Hero, AIR, SOLUTIONS, EXCELLENCE, PARTNER, CONTACTS, 그리고 이동 중에는 opacity 0이고 `visibility: hidden`입니다. COMPANY 범위(+여유)를 벗어나면 즉시 0으로 초기화됩니다.
  - 위로 스크롤해 T2나 T1로 돌아갈 때도 같은 규칙입니다.
  - 모바일(768px 미만)에서는 구가 restY(화면 중앙보다 위)에 멈추고, 원도 그 자리에 나옵니다.
  - reduced motion에서는 구가 정지점으로 바로 이동하므로 `reducedFade`(0.15초) 페이드만 씁니다.
- **성능**: 매 프레임 바뀌는 값은 `.moon-shade` 자신의 CSS 변수(`--shade-x / -y / -o`)뿐입니다. 값이 바뀔 때만 쓰고, 위치는 보일 때만 갱신합니다. 원에서는 transform과 opacity만 바뀌고 filter는 쓰지 않습니다.

### 검증 (dev 서버 + `open-site.html`, 실제 휠 스크롤)

캡처: `.playwright-mcp/company/shade/dev/`, `.playwright-mcp/company/shade/html/` (`*-red.png`는 원을 #f00c로 바꿔 위치를 보이게 한 것, 소스는 원래 색 그대로)

| | 1440×900 | 1920×1080 | 390×844 |
|---|---|---|---|
| ③⑤⑧(+T1 역스크롤) 원 중심 − 구 중심 | 0 / 0.1px | 0px | 0px (구 y 236 = restY) |
| 원 지름 | 656px (41rem) | 656px | 656px |
| ①②④⑥⑦ 원 opacity | 0 | 0 | 0 |
| 구가 멈춘 뒤 켜지기까지 (0.5px/프레임 기준) | 0.35–0.8초 | 0.38–1.0초 | 0.35–1.0초 |
| 페이드인 / 페이드아웃 | 0.53 / 0.27–0.28초 | 같음 | 같음 |
| 구가 움직이기 시작할 때 원 opacity | 0–0.005 | 0–0.011 | 0–0.001 |

- 원이 보이는 동안 구 이동은 프레임당 최대 0.2px입니다.
- reduced motion(1440): 페이드 0.13초. 정지 위치의 원 중심 오차는 0px입니다.
- 프레임(1440, 부드러운 휠 스크롤 Hero → T1 → T2 → AIR, 약 1,550프레임): p95는 원을 켰을 때와 숨겼을 때 모두 16.7–16.8ms로, 기존 16.8ms와 같습니다.
- `/classic`의 `.stars-slide::after`는 그대로 그려집니다(content ""). `/`에서는 5곳 모두 `none`입니다.

### 휠 동작 (2026-10-01 수정: "COMPANY는 휠을 너무 많이 돌려야 한다" 피드백)

수정 전 측정(1440, 0.25초 간격 휠): T2에서 20칸을 돌렸지만 17칸이 무시됐고(연출 재생 중 휠 차단), AIR는 자유 스크롤이라 24칸이 필요했습니다.

- **연출 중 휠 차단 제거**: `companyFlowPlay.dir`(재생 중 같은 방향 휠 무시)을 없앴습니다. 휠은 항상 다음 섹션으로 넘어가고, 타임라인은 새 정지점을 향해 계속 재생됩니다.
  - 기다렸다가 한 번 돌리면: 지금처럼 구가 멈춘 상태에서 텍스트 퇴장 → 다음 텍스트 연출이 재생됩니다.
  - 기다리지 않고 계속 돌리면: 연출은 계속 재생되지만 페이지는 바로 다음 섹션으로 넘어갑니다.
  - T2 → AIR: 한 번 돌리면 T2가 퇴장한 뒤 AIR로 넘어갑니다(`companyFlowPlay.leave`). 그 사이 한 번 더 돌리면 바로 넘어갑니다.
- **Hero(첫 화면) ↔ T1: 휠 한 번**: #mission 어디서든 아래로 한 번 돌리면 #numbers-intro 스냅 지점까지 `HERO_STEP_MS`(1.2초, ease-in-out) 동안 스크롤됩니다. 이 스크롤은 직접 만든 rAF 애니메이션이에요(Chrome 기본 smooth는 약 0.7초라 Hero 텍스트 슬라이드가 너무 빨랐습니다). T1에서 위로 한 번 돌리면 같은 방식으로 Hero 맨 위로 돌아갑니다. 스크롤 중 반대 방향으로 돌리면 그 자리에서 멈춥니다.
  - 전에는 자유 스크롤(200vh)이라 휠 14–18칸이 필요했고, 스냅 지점 몇 px 앞에서 멈추면 다음 한 칸이 헛돌았습니다.
  - 프레임(1440, 4회): 스크롤 중 p95 16.7ms, 20ms 넘는 프레임 0개.
- **한 동작 = 한 단계** (`WHEEL_GESTURE_GAP_MS` 160ms): 한 단계 넘어간 뒤에도 휠 이벤트가 160ms 이상 끊기지 않으면(트랙패드 관성, 빠르게 굴리는 휠) 같은 동작으로 보고 무시합니다. 이게 없으면 트랙패드 한 번 쓸기(관성 1초 이상)가 잠금 시간보다 길어서 T1을 지나 AIR까지 넘어갔습니다. 텍스트 정지 시간(`timeline.hold` 1초)은 그대로입니다.
- **AIR**: 휠 한 칸에 글자 하나씩 진행됩니다. 정지점은 AIR 스냅 → A 완료 → I 완료 → R 완료 → Solutions(#products)이고, 역방향도 같습니다. AIR 맨 위에서 위로 돌리면 T2로 갑니다. A/I/R 경계는 GSAP 스크럽 범위(`airScrubRange`, `NumbersAirSlideScroll.tsx`에서 갱신)의 1/3씩입니다.
  - 이전에 AIR 맨 위에서 일반 휠로 위로 올리면 mandatory 스냅이 AIR로 되돌려 T2로 돌아갈 수 없던 문제도 같이 해결됩니다.
- 구현: `BoilerLabScrollApp.tsx` 휠 핸들러(`airWheelStops`, `animateScrollTo`).
- **애니메이션을 기다리지 않음 (2026-10-01)**: 시간 잠금(`WHEEL_STEP_LOCK_MS`)을 없앴습니다. 이동(또는 Hero 글라이드) 중에 휠을 새로 돌리면, 지금 위치가 아니라 향하던 목표(`targetY`)에서 한 단계 더 갑니다. 그래서 0.15초 간격으로 7칸 돌리면 Hero → T1 → T2 → AIR → A → I → R → Solutions에 약 2초 만에 도착합니다. 위로도 같습니다.
  - 한 동작 = 한 단계는 유지합니다. 이벤트가 `WHEEL_GESTURE_GAP_MS`(100ms)보다 촘촘하면 같은 동작(트랙패드 관성)으로 봅니다. 16ms/50ms 간격 관성 스와이프로 확인했고, 한 번 쓸면 한 단계입니다.
  - T2 → AIR: T2가 다 열려 멈춰 있을 때(`companyFlowPlay.parked === 2`)만 한 번 돌리면 T2 퇴장 후 넘어갑니다(약 2초). 아직 열리는 중이거나 페이지가 들어오는 중이면 바로 넘어갑니다(약 0.1초).
  - AIR 고정(pin) 중에는 GSAP 여백 때문에 Solutions 위치가 900px 아래로 읽힙니다. 그래서 Solutions 정지점은 고정이 아닐 때 잰 값을 씁니다.
  - Solutions 맨 위에서 위로 돌리면 R 정지점으로 갑니다.
- **Solutions 도착 위치 (상단 그라데이션 잘림 수정)**: AIR 다음 휠 정지점이 #products의 스냅 지점(헤더 높이 68px 위)이었습니다. 그 위치에서는 `.ferris-bg`가 아직 화면 맨 위에 붙기 전이라, 위쪽 끝이 투명한 헤더 바로 아래(y 68)에 일직선으로 보였습니다. `#products { scroll-margin-top: 0 }`으로 바꿔서 배경이 맨 위에 붙은 위치(`hin`)에 멈추게 했습니다. 하단 내비게이션 SOLUTIONS 버튼도 같은 위치에 도착합니다.
  - 스크롤 중 그 끝이 헤더 근처를 지나갈 때도 직선으로 보이지 않도록, `.ferris-bg` 마스크에 위쪽 페이드(`--wash-top` = wash-arc × 22vh, 다 올라오면 0)를 겹쳤습니다(`mask-composite: intersect`). 휠 잠금(`WHEEL_STEP_LOCK_MS` 700ms)과 누적 임계값(40)은 다른 섹션과 같습니다.

수정 후 측정 (1440 / 390, dev와 `open-site.html` 모두 같음)

| | 수정 전 | 수정 후 |
|---|---|---|
| 기다렸다 한 칸씩: Hero → T1 | 14–18칸 | **1칸** (트랙패드 한 번 쓸기도 1단계) |
| 기다렸다 한 칸씩: T1 → Solutions | T2에서 대기 + AIR 21칸 | **6칸** (T2, AIR, A, I, R, Solutions) |
| 0.25초마다 계속: T1 → Solutions | 약 50칸 | 22칸 / 약 7초 (한 칸 넘어갈 때마다 0.7초 잠금이 있어서, 칸 수가 아니라 시간으로 정해짐) |

그라데이션(T1·T2 정지 후 표시) 검증도 수정 후 다시 통과했습니다.

---

## 검증 결과 (2026-09-30)

p 0.14 / 0.30 / 0.46 / 0.60 / 0.72 지점, 레퍼런스와 나란히 비교했습니다. 390px 값은 아래 모바일 조정 이후 기준입니다 (`.playwright-mcp/company/flow/v{1440,1920,390}-compare.png`).

| | 1440×900 | 1920×1080 | 390×844 |
|---|---|---|---|
| S | 1.0 | 1.2 | 0.27 |
| 글자 크기 (T1 / T2) | 53 / 57.5px | 63.6 / 69px | 22 / 20px (모바일 하한) |
| 구 지름 (정지) | 196 → 초점 시 169px | 235 → 202px | 120 → 초점 시 103px |
| 줄바꿈 | 2 / 4줄 | 2 / 4줄 | 2 / 4줄 |

- 빠른 왕복 스크롤에서도 두 텍스트가 동시에 보인 프레임은 없었습니다. 부드러운 스크롤 중 구의 최대 이동은 프레임당 40px(경로상 가장 빠른 구간)입니다.
- 프레임 p95는 16.8ms입니다. 부드러운 스크롤 864프레임 중 20ms를 넘은 프레임은 2개였습니다.
- Solutions 구 핸드오프는 겹침 오차 0px로 그대로입니다.

### 알아둘 점

- p 0.72 무렵 화면 아래에 AIR 섹션 라벨("THE CORE VALUES BRAINDECK BELIEVES IN")이 먼저 올라옵니다. AIR 섹션 자체의 레이아웃이며, COMPANY 연출 범위 밖이라 그대로 두었습니다.

---

## 모바일 (화면 폭 768px 미만)

폭이 `COMPANY_FLOW.mobile.maxWidth`(768)보다 좁으면 세로 구도로 바뀝니다. 데스크톱(768px 이상)은 이 블록을 읽지 않고 동작도 그대로입니다.
판정은 측정(리사이즈) 때마다 다시 하고, `<html data-company-flow-layout="mobile|desktop">`로 CSS에 전달됩니다.

### 구도

| 요소 | 모바일 동작 |
|---|---|
| 구 휴식 위치 | 화면 중앙보다 위, y = `restY` × 높이 (−0.22 → 844px 화면에서 −186px) |
| 텍스트 (T1, T2) | 구 아래 중앙 정렬. 구 아래 가장자리(펄스 최대 기준)와 최소 `textGap` 24px 간격 |
| 텍스트 이동 | 휴식 위치보다 `enterDy`(8% 높이) 아래에서 올라오며 등장, 퇴장 때 `exitDy`(2.5% 높이)만큼 위로 이동. 2.5%는 24px 간격보다 작게 잡아서 퇴장 중에도 쉬고 있는 구에 닿지 않게 했습니다 |
| 길잡이 경로 | 좌우(−200, +175) 대신, 각 텍스트가 열릴 자리(구 아래)로 내려갔다가 휴식 위치로 올라옵니다. 끝(p 0.86)은 중앙보다 `endY`(30% 높이) 아래 |
| 마스크 와이프 | `wipe: "to bottom"`. 위(구 쪽)에서 열리고, 퇴장할 때 위로 닫힙니다 |
| 글자 크기 | 저장값 × min(S, 1.3), 단 T1 ≥ 22px, T2 ≥ 20px (`minFont`). 박스 폭도 같은 배율이라 줄바꿈은 T1 2줄 / T2 4줄로 유지됩니다 |

타이밍(in/out, 앵커), 색·잔상, 스프링, 카메라 팬은 데스크톱과 같은 값을 씁니다.

### 구 크기 계산 순서 (모든 화면)

1. 기본 지름 = max(웨이포인트 s × 400 × S, `sphere.minDiameter` 120px)
2. 그 위에 초점 축소 (1 − 0.14w)와 펄스 (1 + 0.035 × pulse)를 곱합니다.

그래서 모바일에서는 평소 120px, 텍스트가 보일 때 약 103px입니다.
데스크톱은 기본 지름이 항상 120px보다 커서(1440에서 196px) 하한이 걸리지 않고, 결과도 이전과 같습니다.

### 조정 값: `COMPANY_FLOW.mobile`

| 값 | 기본 | 의미 |
|---|---|---|
| `maxWidth` | 768 | 이 폭 미만이면 모바일 구도 |
| `minFont.t1` / `minFont.t2` | 22 / 20 | 글자 크기 하한(px) |
| `restY` | −0.22 | 구 휴식 위치 (화면 높이 비율, − = 위) |
| `textGap` | 24 | 구와 텍스트 사이 최소 간격(px) |
| `enterDy` / `exitDy` | 0.08 / −0.025 | 텍스트 등장·퇴장 이동량 (화면 높이 비율) |
| `endY` | 0.3 | 연출 끝에서 구 위치 (화면 높이 비율, 중앙 기준 아래) |
| `wipe` | "to bottom" | 와이프 방향 |

`restY`를 올리거나(더 음수) `textGap`을 키우면 텍스트도 따라 움직입니다. 텍스트 위치는 구 휴식 위치 + 구 반지름 + 간격으로 계산됩니다.

### 검증 (390×844, 2026-09-30)

`.playwright-mcp/company/flow/m390-compare.png` (레퍼런스와 나란히)

| p | 구 (중앙 기준 x, y / 지름) | 텍스트 | 겹침 |
|---|---|---|---|
| 0.14 | 0, −7 / 120 | T1 등장 직전 (보이지 않음) | 없음 |
| 0.30 | 0, −186 / 103 | T1 22px, 2줄, 중앙 정렬 | 없음, 구와 34px 간격 |
| 0.46 | 0, +9 / 120 | T2가 열릴 자리. 마스크가 완전히 닫혀 보이지 않음 | 없음 |
| 0.60 | 0, −186 / 103 | T2 20px, 4줄, 중앙 정렬 | 없음, 구와 34px 간격 |
| 0.72 | 0, −80 / 120 | 퇴장 완료 | 없음 |

- **박스 폭**: T1 251px, T2 210px로 390px 화면 안에 들어갑니다 (좌우 여백 16px 기준 최대 358px). 320px 폭에서도 T1 박스 251px이 들어갑니다.
- **등장 중 (p 0.20, 0.52)**: 구가 텍스트 자리를 지나가며 위로 올라가는 동안, 위에서부터 열리는 텍스트가 구와 겹쳐 보입니다. 데스크톱과 같은 의도된 "길잡이" 순간이며, 텍스트가 구 위 레이어라 가려지지 않습니다.
