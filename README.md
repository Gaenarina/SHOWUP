# SHOWUP
블록체인 프로젝트


## 개발 환경 실행 방법

### 1. Hardhat 로컬 체인 실행

첫 번째 터미널에서 실행한다.

```bash
npm run chain
```

해당 터미널은 종료하지 않는다.

### 2. 스마트 컨트랙트 배포

두 번째 터미널에서 실행한다.

```bash
npm run deploy
```

로컬 체인을 재시작한 경우 컨트랙트를 다시 배포해야 한다.

### 3. 개발 서버 실행

세 번째 터미널에서 실행한다.

```bash
npm run dev
```

브라우저에서 접속한다.

```txt
http://localhost:3000
```

## 실행 순서 요약

```bash
npm run chain
npm run deploy
npm run dev
```

`npm run chain`은 계속 켜둔 상태에서 나머지 명령어를 실행한다.
