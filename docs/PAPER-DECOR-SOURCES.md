# 공개 종이 작업실 소품 에셋

출처는 [Kitbitz](https://kitbitz.art/)의 공개 손그림 일러스트 라이브러리입니다. 개별 그림은 모두 원본 SVG이며 재제작하거나 AI로 생성하지 않았습니다. 실내·겨울·중세 키트 중 서로 어울리는 식물, 책, 계절 소품 8개를 골랐습니다.

## 라이선스 및 고정 원본

- 라이선스: **CC0 1.0 Universal**. 상업용 사용, 수정, 배포 가능. 출처 표기 의무는 없으며 자산만 CC0입니다.
- 원본 라이선스 사본: `public/assets/paper/decor/LICENSE.md`.
- 원본 저장소: https://github.com/CaptExcellent/kits-library-assets
- 고정 리비전: `c67532ddf21cef61827de203344282cc9c2cecae`.
- 공식 카탈로그: https://kitbitz.art/catalog.v1.json
- 각 다운로드 URL, 원본 페이지, 크기는 같은 폴더의 `manifest.json`에 보존했습니다.

## 자산 선택

| 파일 | 사용 위치 | 원본 |
|---|---|---|
| `christmas-tree.svg` | 겨울의 주요 트리. 별과 장식이 원본에 포함되어 있습니다. | [Festive Christmas Tree](https://kitbitz.art/illustrations/winter-kit/festive-christmas-tree-9df1043b) |
| `christmas-wreath.svg` | 겨울 벽면 또는 창 위의 리스. | [Holiday Wreath](https://kitbitz.art/illustrations/winter-kit/holiday-wreath-db95db3e) |
| `candy-cane.svg` | 겨울 책상·양말·선물 주변의 작은 포인트. | [Candy Cane](https://kitbitz.art/illustrations/winter-kit/candy-cane-cbc15f39) |
| `spring-flowers.svg` | 봄 책상 위 꽃 화분. | [Flower Planter](https://kitbitz.art/illustrations/interior-kit/flower-planter-1a7e244d) |
| `summer-monstera.svg` | 여름의 풍성한 녹색 화분. | [Potted Monstera Plant](https://kitbitz.art/illustrations/interior-kit/potted-monstera-plant-7453374f) |
| `rose-vase.svg` | 봄의 붉은 장미 화병. | [Rose in Vase](https://kitbitz.art/illustrations/interior-kit/rose-in-vase-e8a939bd) |
| `autumn-pumpkin.svg` | 가을 책상 또는 선반 장식. 얼굴 없는 호박입니다. | [Pumpkin](https://kitbitz.art/illustrations/medieval-kit/pumpkin-b7e06798) |
| `book-stack.svg` | 계절 공통 책 더미. 읽을거리 상호작용에 사용할 수 있습니다. | [Stacked Books](https://kitbitz.art/illustrations/interior-kit/stacked-books-347d21ad) |

## 통합 시 유의점

- 원본은 완성된 종이 공예 사진이 아니라 입체 음영이 들어간 손그림입니다. 종이 질감, 얇은 외곽 그림자와 여러 깊이 층은 사이트 쪽에서 적용해야 합니다.
- 일부 원색이 선명하므로 전체 장면의 채도 조정(`saturate(.65)` 정도부터 확인)과 따뜻한 조명으로 통일하는 편이 좋습니다.
- 트리와 책의 일부 가장자리에는 원본의 미세한 그림자/질감 필터가 있습니다. 아주 작은 크기에서 흐려지지 않는지 화면에서 확인해 주세요.
- 크리스마스 선물과 여름 음료는 이 8개 묶음에 없습니다. 특정 계절을 완성하려면 추가 소품 또는 별도 단순한 종이 포장 요소를 함께 배치해야 합니다.
- 공식 CDN 다운로드는 이 환경에서 HTTP 403이어서, 같은 공식 저장소의 고정 리비전 raw 파일로 받았습니다.

## 검증

- 8개 SVG 모두 XML 파싱 성공, `viewBox` 존재.
- 스크립트, 외부 참조, 포함된 래스터 이미지 없음. 모두 자체 완결 벡터입니다.
- 트리·꽃 화분·몬스테라·호박·책의 공식 PNG 미리보기를 직접 확인했습니다.
- SVG 총 용량 약 279 KB. 파일별 정확한 값은 Git 상태 및 파일 시스템에서 확인할 수 있습니다.

## 종이 스타일 변형본

원본 8개를 유지하면서 `public/assets/paper/decor/adapted/`에 같은 이름의 변형 SVG를 추가했습니다. 실제 장면에서는 이 경로를 사용합니다.

- 색상: moss `#607651`, sage `#81916a`, terracotta `#b76b50`, dull gold `#c4a564`, cream `#e9dec6`을 중심으로 소재별로 정교하게 매핑했습니다.
- 원본의 반짝임·내부 베벨·구형 음영 필터 179개를 제거했습니다. 트리 장식은 평면 스티커처럼, 트리 잎은 4단의 다른 녹색 종이처럼 보이게 조정했습니다.
- 얇은 경계 그림자와 미세한 단색 종이 노이즈를 추가했습니다. 노이즈의 alpha를 1로 고정한 산술 곱셈으로 재질을 입혀 가장자리에 흰 번짐이 생기지 않도록 했습니다.
- 원본 하이라이트 경로는 삭제하지 않고 투명도를 낮췄습니다. 봄꽃의 흰 꽃잎은 크림색 종이로 유지했습니다.
- **모든 원본 도형의 경로·좌표·크기와 `viewBox`가 동일함을 비교 검증했습니다.** 새 그림을 생성하거나 새로운 도형을 그린 작업이 아닙니다.
- 8개 전체를 `rsvg-convert`로 렌더링하고 따뜻한 종이색 배경 위에서 눈으로 확인했습니다.
- 변형 파일별 제거 필터 수와 정확한 색상 매핑은 `adapted/manifest.json`에 기록했습니다. 기존 CC0 라이선스가 그대로 적용됩니다.

## 발견할 수 있는 작은 친구와 음악 소품

동일한 Kitbitz CC0 라이브러리에서 다음 3개를 추가했습니다. 기존 변형과 같은 종이 색상·무광 처리이며 원본은 각 상위 경로에 유지했습니다.

| 파일 | 원본 자산 | 용도 |
|---|---|---|
| `adapted/little-bird.svg` | [Seagull](https://kitbitz.art/illustrations/pirate-kit/seagull-441747a1) | 창가에 잠시 앉는 작은 새. 원본 종은 갈매기입니다. |
| `adapted/speaker.svg` | [Audio Speaker](https://kitbitz.art/illustrations/interior-kit/audio-speaker-6098ff56) | 책상 위 음악 상호작용용 스피커. 라디오나 레코드플레이어를 대체합니다. |
| `adapted/resting-cat.svg` | [Lounging Cat](https://kitbitz.art/illustrations/halloween-kit/lounging-cat-fbd31a3c) | 바닥이나 의자 위에서 웅크려 쉬는 고양이. |

- 새·스피커·고양이의 원본 광택 필터 47개를 제거하고 기존 팔레트에 맞췄습니다.
- 세 파일 모두 원본 path/도형 좌표/`viewBox` 동일 검증, `rsvg-convert` 렌더링 및 육안 검수 완료.
- 원본 3개 약 79 KB, 실제 사용할 변형본 3개 약 30 KB.
