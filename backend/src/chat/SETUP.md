# Setup Guide - Direct Messaging

## 📋 Prerequisites

1. Node.js >= 18
2. PostgreSQL database
3. Prisma CLI installed

## 🚀 Installation

### 1. Database Schema

Database schema đã có sẵn tất cả các models cần thiết:
- ✅ `Conversation` (type: DIRECT hoặc CHANNEL)
- ✅ `ConversationParticipant` (tracking users trong conversation)
- ✅ `Message` (tin nhắn với support reply, mentions, attachments)
- ✅ `Reactable` & `Reaction` (reaction system)
- ✅ `FileAttachment` (đính kèm files)
- ✅ `UserPresence` (online status)

**Không cần migration mới!** Schema hiện tại đã hỗ trợ đầy đủ Direct Messaging.

### 2. Environment Variables

Đảm bảo file `.env` có các biến sau:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT
JWT_SECRET="your-secret-key"

# CORS (cho Socket.IO)
CLIENT_ORIGIN="http://localhost:5173"

# Server
PORT=3000
```

### 3. Chạy Migration (nếu cần)

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4. Start Server

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 🧪 Testing the API

### Manual Testing với cURL

#### 1. Lấy danh sách conversations

```bash
curl -X GET \
  http://localhost:3000/api/workspaces/{workspaceId}/direct-messages \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

#### 2. Gửi tin nhắn direct

```bash
curl -X POST \
  http://localhost:3000/api/workspaces/{workspaceId}/direct-messages/send \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "recipientId": "user-id",
    "content": "Hello from cURL!"
  }'
```

#### 3. Lấy tin nhắn trong conversation

```bash
curl -X GET \
  'http://localhost:3000/api/workspaces/{workspaceId}/direct-messages/conversations/{conversationId}/messages?limit=20&page=1' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Testing WebSocket với Socket.IO Client

Tạo file `test-socket.js`:

```javascript
const io = require('socket.io-client');

const token = 'YOUR_JWT_TOKEN';
const workspaceId = 'workspace-id';
const recipientId = 'user-id';

// Connect
const socket = io('http://localhost:3000/chat', {
  auth: { token },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('connected', (data) => {
  console.log('✅ Authenticated:', data.user);
  
  // Gửi tin nhắn direct
  socket.emit('dm:message:send', {
    workspaceId,
    recipientId,
    content: 'Hello from Socket.IO!'
  });
});

socket.on('dm:message:sent', (data) => {
  console.log('✅ Message sent:', data.message);
});

socket.on('dm:message:new', (data) => {
  console.log('📩 New message:', data.message);
});

socket.on('error', (error) => {
  console.error('❌ Error:', error);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

// Run: node test-socket.js
```

## 🔍 Verification Checklist

Sau khi setup, verify các chức năng sau:

### REST API
- [ ] GET conversations - Lấy danh sách conversations
- [ ] POST conversations - Tạo conversation mới
- [ ] POST send - Gửi tin nhắn
- [ ] GET messages - Lấy tin nhắn với pagination
- [ ] DELETE message - Xóa tin nhắn (chỉ owner)
- [ ] POST reaction - Thêm reaction
- [ ] DELETE reaction - Xóa reaction
- [ ] POST mark-read - Đánh dấu đã đọc

### WebSocket
- [ ] Connection & Authentication
- [ ] dm:join - Join conversation room
- [ ] dm:message:send - Gửi tin nhắn real-time
- [ ] dm:message:new - Nhận tin nhắn real-time
- [ ] dm:typing:start/stop - Typing indicator
- [ ] dm:reaction:add/remove - Reactions real-time
- [ ] dm:messages:read - Read receipts

## 📊 Database Queries for Testing

### Kiểm tra conversations

```sql
-- Xem tất cả DIRECT conversations
SELECT 
  c.id,
  c.type,
  c.createdAt,
  COUNT(cp.id) as participant_count,
  COUNT(m.id) as message_count
FROM "Conversation" c
LEFT JOIN "ConversationParticipant" cp ON c.id = cp."conversationId"
LEFT JOIN "Message" m ON c.id = m."conversationId"
WHERE c.type = 'DIRECT'
GROUP BY c.id;
```

### Kiểm tra messages trong conversation

```sql
-- Xem messages trong một conversation
SELECT 
  m.id,
  m.content,
  u."fullName" as sender_name,
  m."createdAt",
  m."isDeleted"
FROM "Message" m
JOIN "User" u ON m."senderId" = u.id
WHERE m."conversationId" = 'conversation-id'
ORDER BY m."createdAt" DESC
LIMIT 20;
```

### Kiểm tra unread messages

```sql
-- Đếm unread messages cho một user trong conversation
SELECT COUNT(*) as unread_count
FROM "Message" m
JOIN "ConversationParticipant" cp ON m."conversationId" = cp."conversationId"
WHERE m."conversationId" = 'conversation-id'
  AND cp."userId" = 'user-id'
  AND m."createdAt" > COALESCE(cp."lastReadAt", '1970-01-01')
  AND m."senderId" != 'user-id'
  AND m."isDeleted" = false;
```

## 🐛 Troubleshooting

### Issue: "Unauthorized" khi connect Socket.IO

**Solution:**
- Kiểm tra JWT token có valid không
- Kiểm tra token được gửi đúng cách (auth header, auth object, hoặc query param)
- Log token ở server để debug

```typescript
// Debug token
console.log('Auth:', client.handshake.auth);
console.log('Query:', client.handshake.query);
console.log('Headers:', client.handshake.headers?.authorization);
```

### Issue: "Conversation không tồn tại"

**Solution:**
- Verify conversationId có đúng không
- Kiểm tra user có phải participant của conversation không
- Kiểm tra type của conversation (phải là 'DIRECT')

### Issue: "Cả hai user phải là thành viên của workspace"

**Solution:**
- Verify cả 2 users đều có trong bảng `WorkspaceMember` với workspaceId đúng
- Kiểm tra workspaceId có đúng không

### Issue: Tin nhắn không real-time

**Solution:**
- Verify client đã join room (`dm:join`) trước khi nhận messages
- Kiểm tra WebSocket connection có stable không
- Check server logs xem có emit events không

### Issue: Unread count không chính xác

**Solution:**
- Verify `lastReadAt` được update đúng khi user đọc tin nhắn
- Kiểm tra logic đếm unread trong service
- Gọi `mark-read` API khi user mở conversation

## 📚 Additional Resources

- [Swagger API Docs](http://localhost:3000/api-docs) - Sau khi start server
- [Socket.IO Docs](https://socket.io/docs/v4/)
- [Prisma Docs](https://www.prisma.io/docs/)

## 🔐 Security Notes

1. **JWT Expiration**: Mặc định JWT expire sau 7 ngày. Có thể thay đổi trong `chat.module.ts`
2. **CORS**: Chỉ cho phép origin từ `CLIENT_ORIGIN` environment variable
3. **Authorization**: Mọi REST endpoint và WebSocket event đều require authentication
4. **Soft Delete**: Messages không bao giờ bị xóa hoàn toàn khỏi database
5. **Rate Limiting**: Nên implement rate limiting cho production (chưa có trong code hiện tại)

## 🚀 Next Steps

1. Implement file upload API cho attachments
2. Add rate limiting middleware
3. Add logging & monitoring (Winston, Sentry)
4. Setup Redis cho WebSocket scaling (Socket.IO adapter)
5. Add unit & integration tests
6. Setup CI/CD pipeline

