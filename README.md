
## Công nghệ sử dụng

### Backend
- **NestJS** - Framework Node.js
- **Prisma** - ORM cho database
- **MySQL** - Cơ sở dữ liệu

### Frontend
- **React** - Thư viện UI
- **Vite** - Build tool
- **Tailwind CSS** - CSS framework

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd HUST-FOOD-LOCA
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend`:

```env
DATABASE_URL="mysql://username:password@localhost:3306/hust_food_loca"
```

Chạy migration database:

```bash
npx prisma migrate dev --name init
```

Khởi động backend:

```bash
npm run start:dev
```

Backend sẽ chạy tại `http://localhost:3000`

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
```

Khởi động frontend:

```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173`

## Cấu trúc thư mục

```
HUST-FOOD-LOCA/
├── backend/          # NestJS API server
│   ├── prisma/       # Database schema
│   └── src/          # Source code
└── frontend/         # React application
    └── src/          # Source code
```

## Scripts

### Backend
- `npm run start:dev` - Chạy development mode
- `npm run build` - Build production
- `npm run test` - Chạy tests

### Frontend
- `npm run dev` - Chạy development mode
- `npm run build` - Build production
- `npm run preview` - Preview production build

## License

UNLICENSED

