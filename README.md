# Musinsa Price Tracker (FastAPI + Next.js)

구성:
- `backend/scraper-worker`: FastAPI 백엔드 + Playwright 스크래핑 + SQLite 저장
- `app/*`: Next.js 프론트엔드

DB 파일:
- `/Users/juwon/musinsa-scrap/data/prices.db`

## 1) 백엔드 실행 (FastAPI)

```bash
cd /Users/juwon/musinsa-scrap
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -U pip setuptools wheel
pip install -r backend/scraper-worker/requirements.txt
python -m playwright install chromium
cd backend/scraper-worker
uvicorn app:app --host 127.0.0.1 --port 8000
```

확인:
```bash
curl http://127.0.0.1:8000/health
```

## 2) 프론트 실행 (Next.js)

```bash
cd /Users/juwon/musinsa-scrap
npm install
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

브라우저:
- `http://localhost:3000`

## API

- `GET /api/products`
- `POST /api/products`
- `POST /api/products/update`
- `POST /api/products/{id}/update`
- `DELETE /api/products/{id}`
- `GET /api/products/{id}/history?limit=40`

## 참고

- CORS 허용 origin: `http://localhost:3000`, `http://127.0.0.1:3000`
- 무신사 DOM 변경 시 가격 선택자 보정이 필요할 수 있습니다.
- 현재 백엔드는 `backend/scraper-worker`만 사용합니다.

## Fly.io 배포

백엔드를 Fly.io에 배포할 수 있도록 `Dockerfile`, `.dockerignore`, `fly.toml`이 포함되어 있습니다.

1. Fly 앱 이름 수정
   - 현재 [fly.toml](/Users/juwon/musinsa-scrap/fly.toml) 은 `musinsa-price-tracker-juwon-20260317` 로 설정됨
   - 이미 사용 중이면 다른 고유 이름으로 변경
2. Fly CLI 로그인
   - `fly auth login`
3. SQLite 볼륨 생성
   - `fly volumes create tracker_data --region nrt --size 1`
4. 백엔드 배포
   - `fly deploy`
5. Vercel 프론트 환경변수 설정
   - `NEXT_PUBLIC_API_BASE_URL=https://<your-fly-app>.fly.dev`
6. 백엔드 CORS 설정
   - `fly secrets set CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>`

배포 후 헬스체크:

```bash
curl https://<your-fly-app>.fly.dev/health
```

## Vercel 자동 배포

`main` 브랜치 push 시 Vercel 프로덕션 배포가 실행되도록 [vercel-production.yml](/Users/juwon/musinsa-scrap/.github/workflows/vercel-production.yml) 을 추가했습니다.

필요한 GitHub Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

설정 후 동작 방식:

1. GitHub 저장소를 Vercel 프로젝트와 연결
2. Vercel 프로젝트 환경변수에 `NEXT_PUBLIC_API_BASE_URL=https://musinsa-price-tracker-juwon-20260317.fly.dev` 설정
3. GitHub 저장소 secrets 에 위 3개 값을 추가
4. `main` 브랜치에 push 하면 GitHub Actions 가 Vercel 프로덕션 배포 실행
