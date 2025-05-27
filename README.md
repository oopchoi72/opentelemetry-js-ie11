# OpenTelemetry JavaScript IE11 Support

[![Build Status](https://github.com/your-org/opentelemetry-js-ie11/workflows/CI/badge.svg)](https://github.com/your-org/opentelemetry-js-ie11/actions)
[![npm version](https://badge.fury.io/js/opentelemetry-js-ie11.svg)](https://www.npmjs.com/package/opentelemetry-js-ie11)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/opentelemetry-js-ie11.svg)](https://bundlephobia.com/result?p=opentelemetry-js-ie11)
[![IE11 Compatible](https://img.shields.io/badge/IE11-compatible-brightgreen.svg)](https://caniuse.com/#feat=es6)

Internet Explorer 11 호환성을 위해 특별히 적응된 OpenTelemetry JavaScript SDK입니다. 이 라이브러리는 레거시 브라우저 환경에서 추적, 메트릭, 성능 모니터링을 포함한 관찰 가능성 기능을 제공합니다.

## 🚀 주요 기능

### ✅ 완료된 기능

- **🔧 개발 환경 설정**: IE11 호환 개발 환경 완전 구축

  - TypeScript ES5 타겟 설정
  - Webpack UMD 번들링
  - Babel IE11 트랜스파일레이션
  - 자동화된 테스트 환경

- **🛡️ 핵심 폴리필 구현**: IE11 필수 폴리필 완전 지원

  - Core-js ES6+ 기능 폴리필
  - Promise, Map, Set, Symbol 지원
  - Fetch API 및 URL API 폴리필
  - 성능 API 및 Crypto API 대체 구현

- **📡 OpenTelemetry API**: IE11 호환 API 완전 구현

  - Span, Tracer, Context API
  - W3C Trace Context 지원
  - 브라우저 API 교체 및 모듈 시스템 호환성
  - 종합 테스트 완료

- **⚙️ Core SDK**: IE11 호환 핵심 SDK 구현

  - 플랫폼 감지 및 시간 측정 함수
  - 유틸리티 함수 적응
  - 성능 최적화 및 통합 테스트
  - 번들 크기 최적화

- **🔍 Trace SDK**: 완전한 추적 SDK 구현

  - Span 관리 및 Context 전파
  - 샘플링 최적화
  - 배치 처리 최적화
  - IE11 호환 비동기 처리

- **🌐 Web SDK**: 웹 전용 추적 SDK 구현

  - XMLHttpRequest 계측
  - DOM 이벤트 처리 적응
  - 성능 API 교체
  - 웹 리소스 타이밍 구현
  - 자동 계측 시스템

- **📊 Metrics SDK**: 메트릭 수집 시스템 구현

  - Counter, Histogram, Gauge 지원
  - 집계 로직 적응
  - 메트릭 내보내기 구현
  - IE11 성능 최적화

- **🎯 성능 최적화**: IE11 전용 성능 최적화

  - 병목 지점 식별 및 해결
  - 데이터 배치 처리
  - 메모리 할당 감소
  - 이벤트 스로틀링
  - 폴리필 최적화

- **🧪 자동화된 테스트**: 완전한 IE11 테스트 환경

  - Karma + BrowserStack 통합
  - IE11 폴리필 및 테스트 유틸리티
  - GitHub Actions CI/CD 파이프라인
  - 성능 벤치마킹

- **📦 통합 번들**: 단일 에이전트 파일로 통합
  - 모든 기능을 포함한 단일 `agent.js` 파일
  - 간편한 배포 및 관리
  - 의존성 충돌 방지
  - 최적화된 로딩 성능

## 📦 설치

```bash
npm install opentelemetry-js-ie11
```

또는 브라우저에서 직접 사용하기 위한 CDN:

```html
<!-- IE11용 통합 에이전트 -->
<script src="https://cdn.jsdelivr.net/npm/opentelemetry-js-ie11@1.0.0/dist/agent.js"></script>
```

## 🚀 빠른 시작

### 기본 추적 설정

```javascript
// IE11 호환 OpenTelemetry 초기화
// agent.js가 로드되면 전역 OpenTelemetryIE11 객체가 사용 가능합니다
var opentelemetry = window.OpenTelemetryIE11;

// TracerProvider 생성
var provider = new opentelemetry.BasicTracerProvider();
opentelemetry.trace.setGlobalTracerProvider(provider);

// Tracer 가져오기
var tracer = opentelemetry.trace.getTracer("my-app", "1.0.0");

// Span 생성 및 사용
var span = tracer.startSpan("user-operation");
span.setAttribute("user.id", "12345");
span.addEvent("operation-started");

// 작업 수행...
setTimeout(function () {
  span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
  span.end();
}, 1000);
```

### XMLHttpRequest 자동 계측

```javascript
var opentelemetry = window.OpenTelemetryIE11;

// XMLHttpRequest 자동 계측 설정
var xhrInstrumentation = opentelemetry.createXMLHttpRequestInstrumentation({
  enableTracing: true,
  enableTiming: true,
  propagateTraceHeaders: true,
});

// 계측 시작
xhrInstrumentation.enable();

// 이제 모든 XHR 요청이 자동으로 추적됩니다
var xhr = new XMLHttpRequest();
xhr.open("GET", "/api/data");
xhr.send();
```

### DOM 이벤트 계측

```javascript
var opentelemetry = window.OpenTelemetryIE11;

// DOM 이벤트 계측 생성
var instrumentation = opentelemetry.createDOMEventInstrumentation({
  enableEventHistory: true,
  throttleHighFrequency: true,
  maxEventHistory: 1000,
  eventTypes: ["click", "submit", "focus", "blur"],
});

// 문서 계측
instrumentation.instrumentDocument();

// 이벤트 통계 확인
setTimeout(function () {
  var stats = instrumentation.getEventStatistics();
  console.log("총 이벤트 수:", stats.totalEvents);
  console.log("가장 빈번한 이벤트:", stats.mostFrequentEvent);
}, 5000);
```

### 메트릭 수집

```javascript
var opentelemetry = window.OpenTelemetryIE11;

// MeterProvider 생성
var meterProvider = new opentelemetry.MeterProvider();
var meter = meterProvider.getMeter("my-app", "1.0.0");

// Counter 생성
var requestCounter = meter.createCounter("http_requests_total", {
  description: "Total number of HTTP requests",
});

// Histogram 생성
var requestDuration = meter.createHistogram("http_request_duration", {
  description: "HTTP request duration in milliseconds",
});

// 메트릭 기록
requestCounter.add(1, { method: "GET", status: "200" });
requestDuration.record(150, { method: "GET", endpoint: "/api/users" });
```

### 성능 최적화 기능

```javascript
var opentelemetry = window.OpenTelemetryIE11;

// 브라우저 감지
var browserInfo = opentelemetry.detectBrowserInfo();
console.log("브라우저:", browserInfo.name, browserInfo.version);
console.log("IE11 여부:", browserInfo.isIE11);

// 성능 모니터링
var monitor = opentelemetry.createPerformanceMonitor({
  enableBottleneckDetection: true,
  enableMemoryOptimization: true,
  enableEventThrottling: true,
  reportInterval: 10000,
});

// 모니터링 시작
monitor.start();

// 성능 보고서 가져오기
monitor.getReport().then(function (report) {
  console.log("성능 보고서:", report);
  console.log("병목 지점:", report.bottlenecks);
  console.log("메모리 사용량:", report.memoryUsage);
});
```

## 🏗️ 프로젝트 구조

```
opentelemetry-js-ie11/
├── src/                          # 소스 코드
│   ├── agent.ts                  # 통합 에이전트 진입점
│   ├── index.ts                  # 메인 진입점
│   ├── umd-wrapper.js            # UMD 래퍼
│   ├── api/                      # OpenTelemetry API 구현
│   ├── core/                     # 핵심 SDK 기능
│   ├── trace/                    # 추적 SDK
│   ├── metrics/                  # 메트릭 SDK
│   ├── browser/                  # 브라우저 감지 및 호환성
│   ├── performance/              # 성능 최적화 도구
│   ├── web/                      # 웹 전용 계측
│   ├── polyfills/                # IE11 폴리필
│   ├── sdk-trace-base/           # 기본 추적 SDK
│   ├── sdk-trace-web/            # 웹 추적 SDK
│   └── sdk-metrics/              # 메트릭 SDK
├── dist/                         # 빌드 결과물
│   └── agent.js                  # 통합 에이전트 번들 (773KB)
├── examples/                     # 사용 예제
│   ├── simple-agent-test.html    # 기본 에이전트 테스트
│   ├── dom-event-test-with-agent.html  # DOM 이벤트 테스트
│   ├── dom-event-instrumentation-example.html  # DOM 계측 예제
│   ├── server.js                 # 개발 서버
│   └── basic-setup/              # 기본 설정 예제
├── docs/                         # 문서
│   ├── api-reference.md          # API 참조
│   ├── ie11-compatibility.md     # IE11 호환성 가이드
│   ├── bundle-optimization-strategy.md  # 번들 최적화 전략
│   ├── ie11-integration-testing.md      # IE11 통합 테스트
│   └── bundle-optimization.md    # 번들 최적화
├── tests/                        # 테스트 파일
│   ├── browser-detection.test.ts # 브라우저 감지 테스트
│   ├── performance.test.ts       # 성능 테스트
│   ├── dom-event-instrumentation.test.ts  # DOM 이벤트 테스트
│   ├── ie11-integration.spec.ts  # IE11 통합 테스트
│   ├── basic.spec.ts             # 기본 기능 테스트
│   └── setup.js                  # 테스트 설정
├── scripts/                      # 빌드 및 유틸리티 스크립트
│   ├── task-complexity-report.json  # 복잡도 분석 보고서
│   ├── prd.txt                   # 제품 요구사항 문서
│   └── example_prd.txt           # 예제 PRD
└── tasks/                        # Task Master 태스크 관리
```

## 🌐 브라우저 지원

| 브라우저          | 버전 | 상태         | 비고                |
| ----------------- | ---- | ------------ | ------------------- |
| Internet Explorer | 11   | ✅ 완전 지원 | 주요 타겟           |
| Chrome            | 49+  | ✅ 완전 지원 | 모던 기능 활성화    |
| Firefox           | 52+  | ✅ 완전 지원 | 모던 기능 활성화    |
| Safari            | 10+  | ✅ 완전 지원 | 모던 기능 활성화    |
| Edge              | 12+  | ✅ 완전 지원 | 레거시 및 모던 버전 |

## 📊 성능 특성

### 번들 크기

- **통합 에이전트**: 773KB (압축 전)
- **Gzip 압축 후**: ~200KB (예상)
- **모든 기능 포함**: 추적, 메트릭, 성능 최적화, 브라우저 감지, DOM 계측
- **단일 파일**: 의존성 관리 불필요

### IE11 성능

- **초기화 오버헤드**: <100ms
- **이벤트 처리**: <1ms per event
- **메모리 사용량**: <3MB baseline
- **성능 영향**: 모던 브라우저 대비 <25%

## 🔧 고급 사용법

### 조건부 로딩

```javascript
// IE11 감지 후 조건부 로딩
if (navigator.userAgent.indexOf("Trident") !== -1) {
  // IE11에서만 에이전트 로드
  var script = document.createElement("script");
  script.src =
    "https://cdn.jsdelivr.net/npm/opentelemetry-js-ie11@1.0.0/dist/agent.js";
  script.onload = function () {
    // 에이전트 초기화
    var opentelemetry = window.OpenTelemetryIE11;
    opentelemetry.initialize({
      serviceName: "my-app",
      enableAutoInstrumentation: true,
    });
  };
  document.head.appendChild(script);
}
```

### 성능 모니터링

```javascript
var opentelemetry = window.OpenTelemetryIE11;

// 성능 모니터 설정
var monitor = opentelemetry.createPerformanceMonitor({
  enableBottleneckDetection: true,
  enableMemoryOptimization: true,
  enableEventThrottling: true,
  reportInterval: 10000,
});

// 모니터링 시작
monitor.start();

// 성능 보고서 가져오기
monitor.getReport().then(function (report) {
  console.log("성능 보고서:", report);
  console.log("병목 지점:", report.bottlenecks);
  console.log("메모리 사용량:", report.memoryUsage);
});
```

## 📚 문서

- **[설치 가이드](docs/installation.md)**: 상세한 설정 지침
- **[IE11 호환성 가이드](docs/ie11-compatibility.md)**: IE11 전용 고려사항
- **[API 참조](docs/api-reference.md)**: 완전한 API 문서
- **[번들 최적화](docs/bundle-optimization-strategy.md)**: 크기 최적화 전략
- **[IE11 통합 테스트](docs/ie11-integration-testing.md)**: 테스트 가이드

## 🔗 예제

- **[기본 에이전트 테스트](examples/simple-agent-test.html)**: 에이전트 기본 기능 테스트
- **[DOM 이벤트 계측](examples/dom-event-instrumentation-example.html)**: DOM 이벤트 추적
- **[DOM 이벤트 + 에이전트](examples/dom-event-test-with-agent.html)**: 통합 DOM 이벤트 테스트
- **[기본 설정](examples/basic-setup/)**: 간단한 통합 예제

## 🐛 알려진 제한사항

### IE11 전용

- 비동기 작업을 위한 Promise 폴리필 필요
- 제한된 ES6 기능 지원 (호환성 가이드 참조)
- 모던 브라우저 대비 20-25% 성능 오버헤드
- 권장 최대 활성 span 수: 1000개
- 큰 번들 크기 (773KB)

### 일반 제한사항

- 일부 고급 OpenTelemetry 기능 사용 불가
- 고빈도 타이밍 측정의 정밀도 감소
- IE11에서 제한된 WebWorker 지원
- 단일 번들로 인한 초기 로딩 시간 증가

## 🧪 테스트

### 테스트 실행

```bash
# 모든 테스트
npm test

# IE11 전용 테스트
npm run test:ie11:local

# BrowserStack 테스트
npm run test:ie11:browserstack

# 성능 벤치마크
npm run benchmark:ie11
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# UMD 빌드만 (에이전트 생성)
npm run build:umd

# 번들 분석
npm run build:analyze
```

## 🤝 기여하기

기여를 환영합니다! 자세한 내용은 [기여 가이드](CONTRIBUTING.md)를 참조하세요.

### 개발 환경 설정

```bash
git clone https://github.com/your-org/opentelemetry-js-ie11.git
cd opentelemetry-js-ie11
npm install
npm run dev
```

## 📄 라이선스

이 프로젝트는 Apache License 2.0 하에 라이선스됩니다 - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- [OpenTelemetry 커뮤니티](https://opentelemetry.io/) - 기초 작업
- [Babel 팀](https://babeljs.io/) - ES5 트랜스파일레이션 도구
- [Core-js](https://github.com/zloirock/core-js) - 폴리필 지원

## 📞 지원

- **GitHub Issues**: [버그 신고 또는 기능 요청](https://github.com/your-org/opentelemetry-js-ie11/issues)
- **문서**: [완전한 문서](https://your-org.github.io/opentelemetry-js-ie11/)
- **커뮤니티**: [OpenTelemetry Slack](https://cloud-native.slack.com/archives/opentelemetry)

---

**레거시 브라우저 지원을 위해 ❤️로 제작되었습니다**
