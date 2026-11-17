# world-qa-9 / 다섯 장면 확장

천국 → 전산실 → 심판대 → 기획실 또는 지옥. 하단 바로가기도 다섯 장면으로 확장했다. 전산실 근무 종료 시 실제 이름·실적·은총·근무 시간을 저장하고 심판대로 이동한다.

## 현재 규칙
- 판정은 실적 기준. 기본 1분당 20점, 5분 100점 이상 기획실, 미달 지옥. `world-flow.js`의 `rules.targetPerMinute`에서 조정한다. 이번에 정한 임시 기준이며 사람 QA로 다시 보정할 부분이다.
- 판정 시작 클릭 → 4.5초 드럼롤과 저울 → 배정 결과 및 이동 버튼. 판정에 추가 난수는 없다.
- `HeavenFlow.review(player)` 또는 `review(players[])`가 결과를 받는다. 배열은 최대 12명 표시하고 첫 항목을 현 플레이어로 취급한다. 현재는 같은 브라우저의 로컬 상태이며 원격 다인 동기화/서버는 구현하지 않았다.
- 지옥에는 서약이 없다. 클릭당 유황 1개. 유황 20개를 연료 20 또는 15초 Rave에 소비한다. 매 20개 단위 선택이며 영구 분기 잠금은 아니다. 잔액 부족 및 Rave 중 중복 재구매는 차단한다.
- 연료는 기획실 창고에 저장한다. 기획 설비가 연료 20을 소비해 계획서 1장을 만든다. 계획서의 후속 사업·정책 기능은 다음 확장을 위한 연결 지점이다.
- 세계 상태 저장 키 `heaven-world-v1`. 기존 QA 기록 초기화와 별개다. Rave 활성 시간은 장면을 나가면 끝나며 쓴 유황은 돌아오지 않는다.

## 문구
주요 실행 파일의 목사 호칭을 교주로, 집단 이름을 교주님의 영광회로 통일했다. 타 종교/비신앙인에 대한 정죄, 실제 목사의 실화라는 주장, 일반적인 신앙 강요 문장을 가상의 교주가 만든 실적표·복종·노동 배치로 수정했다. 전도 문구도 `교주님의 영광회로 오세요.`로 바뀌었다. 가상의 권위주의 집단이며 종교 전체가 아닌 개인 숭배/착취를 풍자한다는 맥락을 입장 설명과 새 장면에 명시했다.

## 이미지
내장 이미지 생성 도구로 생성. 원본은 보존하고 아래 경로에 새 자산으로 저장했다.
`Resources/HeavenSoft/judgment-cloud-gates-v1.png`
참고: `Resources/HeavenSoft/open-heaven-gates.png`.
최종 프롬프트:
Create a new wide 16:9 background bitmap for a surreal late-1990s Korean browser game's judgment screen, using this image as reference. Upper LEFT quadrant: the ornate open silver heaven gates and luminous staircase ascending through blue-white clouds, preserving reference aesthetic. Lower RIGHT corner: clouds softly part through a long gradual diagonal mist gradient to reveal only a small glimpse of glowing orange sulfur mines and dark red volcanic hell cliffs. Most of center remains quiet pale blue cloud mist, readable space for a scale and player scores to be placed later by code. No text, no UI, no scale, no people. Kitsch heavenly photomontage, luminous rays, early digital airbrush, rich sky blue, smooth cloudy transition not a hard split. Gate occupies upper-left third, hell only bottom-right quarter. Landscape composition.

## 검증
Chrome 실제 화면에서 직접 지옥 진입 시 서약 미표시, 19개 소비 불가/20개 소비 가능, 연료 공급과 새로고침 보존, 기획 설비의 정확한 20 소비, 두 사람 점수 표시, 99/100 경계 양쪽 배정, Rave 소비/15초 종료/새로고침 후 소모 유지 확인. 전산실 실제 end 함수에서 123 실적/456 은총 전달 확인. 심판대·지옥·기획실 화면 확인. 기존 경제 199개 검증, 발송·재시도·중복 지급 방지, QA 내보내기 회귀 통과.
재실행: Playwright 환경의 `QA/browser-world9.cjs`, `QA/browser-world-end9.cjs`.
