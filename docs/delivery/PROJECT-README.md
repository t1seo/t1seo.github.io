# Taewon Seo — After Hours

현대 도시의 강변이 내려다보이는 2.5D 일러스트 작업실입니다. 4계절과 5가지 시간에 따라 방과 도시가 함께 달라지고, 실제 사진과 산책 영상을 참고한 하얀 말티즈 **Milky**가 곁에 있습니다. 기존 Jieun 종이 작업실을 보존하면서 별도 브랜치와 워크트리에서 만들었습니다.

## 실행

```sh
npm install
npm run dev -- --port 5174
```

Chrome에서 http://127.0.0.1:5174/ 를 여시면 됩니다. 제작 중인 원본 폴더는 `/Users/cillian/Downloads/landingpage-worktrees/cyberpunk-studio`입니다.

로고 시안은 http://127.0.0.1:5174/milky-logo-options.html 에서 비교하실 수 있습니다. 새로 제공해 주신 웃는 사진을 바탕으로 만든 A–C 세 시안을 밝고 어두운 배경, 16·32·48px 크기로 보여드립니다. 이전의 직접 제작·Logopia 6종 시안은 비교 페이지의 보관 링크로 볼 수 있습니다. 두 개씩 비교하거나 선택 코드를 복사할 수 있습니다. 선택하신 **A의 하얀 귀 버전**을 작업실 로고와 파비콘에 적용했습니다. B·C도 더 하얗게 다듬었으며, 기존 버전과 함께 PNG·WebP로 내려받으실 수 있습니다. 비교 페이지에서 시안을 바꾸어 보는 것은 실제 사이트 로고를 바꾸지 않습니다.

```sh
npm run build
npm run preview -- --port 5174
```

## 화면과 조작

- 이름이 약 2초 동안 한 글자씩 나타나고 소개 문장이 뒤따릅니다. 글자 자리는 미리 확보하여 타이핑 중 구도가 흔들리지 않습니다. `Step inside` 또는 방을 누르면 사라집니다. 45초 동안 조작하지 않으면 돌아옵니다. `Focus`는 소개가 다시 나타나지 않도록 유지합니다.
- 모니터 또는 키보드를 누르면 코드가 입력됩니다. 자동으로 시작하지 않습니다.
- `Climate`에서 아침·점심·오후·저녁·밤, 4계절, 맑음·흐림·비·눈·안개를 고릅니다. 화면의 표기는 모두 영어입니다. `Auto`는 서울 날짜와 시간을 따릅니다. 날씨는 직접 고르는 장면 설정이며 실시간 예보가 아닙니다.
- 봄의 꽃과 밝은 패브릭, 여름의 녹색 식물과 린넨, 가을의 단풍과 니트·호박, 겨울의 크리스마스트리·선물·조명이 실제 그림에 반영됩니다. 20개의 계절/시간 장면을 선택할 때 필요한 것만 불러옵니다.
- 램프와 하단 Light 버튼은 조명과 책상 위의 따뜻한 빛을 부드럽게 켜고 끕니다. 처음에는 시간과 날씨에 맞춰 켜지며, 직접 조작하면 그 선택을 유지합니다.
- 스피커 또는 `Music` 버튼은 실제 연주곡을 재생합니다. 처음에는 무음이며, 누르기 전에는 음원을 내려받지 않습니다. 20개의 로컬 CC BY 4.0 음원을 계절·시간·날씨의 100개 조합에 맞게 선곡하고, 환경이 바뀌면 다음 곡으로 부드럽게 이어집니다. 재생 중 곡명·연주자와 크레딧 링크가 나타납니다.
- 건물 창의 작은 불빛이 서로 다른 간격으로 천천히 켜지고 꺼집니다. 창밖에는 깊이가 다른 비·눈, 유리를 흐르는 빗물, 강의 잔물결과 다리를 지나는 차량 불빛이 움직입니다. 계절 전환 중에도 실제로 보이는 실내 장식 위에는 비·눈이 겹치지 않도록 처리했습니다.
- 싱잉볼은 작은 금빛 잔향과 울림을, 커피는 잔물결·김과 짧은 도자기 소리를 냅니다. 음악을 켜지 않아도 각각 누르면 반응합니다.
- 만년필 또는 노트를 누르면 생각을 적는 공간이 열립니다. 입력한 내용은 이 기기의 브라우저에만 저장합니다.
- 얇은 월넛 상판과 실제 다리, Aeron을 참고한 메쉬 의자, HHKB 형태의 키보드, 알루미늄 디스플레이, 월넛·린넨 스피커와 검정·금색 만년필을 20개 장면에 같은 위치로 반영했습니다.
- 책상은 장비와 함께 높이고 다리를 연장했습니다. 클릭 영역·모니터·빛 효과를 새 위치로 맞추고, 실내 물건과 식물 잎 위에는 창밖 비·눈이 겹치지 않도록 가림을 추가했습니다.
- Milky는 제공해 주신 사진을 바탕으로 만들었으며, 실제 Claude Fable 5가 Herdr에서 동작 코드를 작성했습니다. 걸을 때는 이동 방향을 보고, 쉬는 중에는 가끔 사용자를 돌아봅니다. 누르면 인사한 뒤 바닥 안에서 새로운 목적지를 고릅니다.
- 하단 네 칸 모양의 `Desk` 버튼에서 Milky와 앉기, 낮잠, 식사, 공놀이, 빠른 걸음을 선택할 수 있습니다. 식사할 때는 그릇을 보고 고개를 내렸다 들며, 공놀이에서는 앞발을 내밀고 구르는 공을 따라갑니다. 쉬다가 자연스럽게 앉고 누워 잠들기도 합니다. Milky에 키보드 초점을 맞추면 방향키로 이동, S로 앉기, N으로 낮잠을 실행할 수 있습니다.
- 움직임 줄이기 설정에서는 Milky가 자동으로 돌아다니지 않습니다. 앉기·낮잠·식사·놀이를 직접 선택하면 정지 자세로 보이며 빠른 이동은 생략합니다. 설정창을 열거나 탭을 숨기면 동작을 멈춥니다.
- 세로로 긴 화면에서는 하단 네 칸 아이콘으로 책상 기능을 이용할 수 있습니다.
- 패널은 닫기 버튼, 바깥 영역, Escape 키로 닫습니다. 클릭 영역은 키보드로도 접근할 수 있습니다.

## 구현

TypeScript, CSS, Vite를 사용합니다. 계절과 시간에 맞춰 그린 2.5D 장면 위에 Canvas 날씨·다리를 지나는 작은 차량 불빛·실시간 HTML 모니터·조명·카메라 움직임·Milky의 별도 애니메이션 레이어를 조합합니다. 실시간 3D 모델은 아니며, 이 엔트리는 Three.js를 로드하지 않습니다.

- `src/cyber-main.ts`: 구성, 접근성, 객체 상호작용
- `src/cyber-studio.css`: 반응형 구도, 타이포그래피, 전환
- `src/cyber-climate.ts`: 서울 날짜/시간, 사용자 설정과 저장
- `src/cyber-climate-controls.ts`: 영어 설정 패널
- `src/cyber-scene-plates.ts`: 이미지 준비 후 전환, 빠른 연속 선택과 로딩 오류 처리
- `src/cyber-atmosphere.ts`: 창밖 날씨와 작은 빛, 실내 반사광
- `src/cyber-terminal.ts`: 클릭으로 시작하는 코드 입력
- `src/cyber-sound.ts`: 실제 음악의 교차 재생과 합성 싱잉볼·컵 소리
- `src/cyber-music-catalog.ts`: 계절·시간·날씨에 따른 선곡
- `src/cyber-desk-effects.ts`: 사물에 맞춘 클릭 반응
- `src/cyber-desk-layout.ts`: 높아진 책상 위 사물의 공통 좌표와 실외 효과 가림
- `src/cyber-intro.ts`: 공간이 준비된 뒤 시작하는 이름 타이핑과 재등장
- `src/cyber-pet.ts`: Milky의 시선·보행·식사·공놀이·휴식 제어
- `src/cyber-pet-rest.ts`, `src/cyber-pet-activity.ts`: 쉬기·식사·놀이 계획과 공의 움직임
- `src/cyber-pet-roam.ts`: 바닥 경계 안에서 목적지와 쉬는 시간을 고르는 로직
- `src/cyber-pet-life.ts`: 전달된 표정 이미지에 맞춘 미세 동작 계획
- `docs/MILKY-FABLE-SMILE.md`, `docs/MILKY-FABLE-ASSET-BRIEF.md`: 실제 Fable 5 구현과 최종 에셋 계약
- `docs/MILKY-SMILE-ART.md`, `docs/milky-v4-registration.json`: 새 웃는 사진 기반 이미지 제작·투명도·등록 검수
- `public/assets/cyberpunk/ART-DIRECTION.md`: 그림 제작 프롬프트, 폰트 출처, 참고 자료
- `public/assets/cyberpunk/MODERN-ILLUSTRATION.md`: 이전 버전의 현대 도시·말티즈 이미지와 제작 프롬프트
- `public/assets/cyberpunk/climate/`: 계절/시간별 WebP와 제작 프롬프트
- `public/assets/cyberpunk/MILKY.md`: Milky 그림과 애니메이션 제작 기록
- `docs/MILKY-PHOTO-GAIT.md`, `docs/MILKY-ROAM.md`: 사진 기반 보행 그림과 이동 방식의 제작·검수 기록
- `public/assets/cyberpunk/MILKY-VIDEO.md`: 이전 영상 기반 포즈 제작 기록(현재 런타임에서는 사용하지 않습니다)
- `docs/LOGOPIA-MILKY.md`: Logopia를 사용한 Milky 로고 제작 기록
- `public/milky-logo-options.html`: 새 웃는 사진 기반 로고 3종 비교 페이지
- `public/milky-logo-options-archive.html`: 이전 직접 제작 및 Logopia 로고 6종 보관 페이지
- `docs/MILKY-SMILE-LOGOS.md`: 새 로고의 프롬프트, 출처, 작은 크기 검수
- `docs/LOGO-DIRECT-OPTIONS.md`, `docs/LOGO-LOGOPIA-OPTIONS.md`: 시안별 제작·검수 기록
- `docs/DESK-HEIGHT.md`: 높아진 책상 기준 그림, 좌표 및 20개 장면 검수
- `docs/CYBER-MUSIC.md`: 음악 API·라이선스·검증 범위
- `docs/DESK-MASTER.md`: 가구 기준 그림과 계절별 제작 기록
- `docs/CYBERPUNK-CHECKS.md`: 검증 결과와 남은 확인 사항
- `docs/MILKY-FABLE-ACTIVITY.md`: 식사·놀이·시선·소품 배치와 검사 기록
- `docs/MILKY-LOGO-PACK.md`: 하얀 A·B·C 및 이전 B·C 보존 내역

새 보행 이미지는 프레임 사이 얼굴·발 위치에 작은 차이가 남아 있습니다. 실제 Chrome 연속 재생 검수는 제어 서비스 연결 오류로 수행하지 못했으며, 자세한 검사 범위와 한계는 `docs/CYBERPUNK-CHECKS.md`에 기록했습니다.

운영체제의 움직임 줄이기 설정을 따릅니다. 숨겨진 탭에서는 애니메이션과 소리를 일시정지합니다. 사용자 이름 외에 경력, 직함, 연락처를 임의로 작성하지 않았습니다.

기존 종이 작업실 관련 `PAPER-STUDIO.md`, `README-DELIVERY.md` 등은 이전 작업 기록이며, 이 새 페이지의 설명은 본 문서가 우선합니다.
