# Direct Messaging API Documentation

## 🎯 Tổng quan

API Direct Messaging cho phép users chat 1-1 với nhau trong cùng một workspace. Hệ thống tự động tạo conversation khi gửi tin nhắn lần đầu.

## 📌 Điều kiện

- Cả 2 users phải là members của cùng workspace
- Không thể chat với chính mình
- Chỉ người gửi mới có quyền xóa tin nhắn của mình trong DM

## 🔗 REST API Endpoints

### 1. Lấy danh sách Direct Conversations

**Endpoint:** `GET /api/workspaces/:workspaceId/direct-messages`

**Mô tả:** Lấy tất cả các cuộc trò chuyện 1-1 của user trong workspace

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv-uuid",
      "otherParticipant": {
        "id": "user-uuid",
        "username": "john_doe",
        "fullName": "John Doe",
        "email": "john@example.com",
        "avatarUrl": "https://...",
        "isOnline": true
      },
      "lastMessage": {
        "id": "msg-uuid",
        "content": "Hello!",
        "senderId": "user-uuid",
        "senderName": "John Doe",
        "isDeleted": false,
        "createdAt": "2023-12-24T10:00:00Z"
      },
      "unreadCount": 3,
      "updatedAt": "2023-12-24T10:00:00Z",
      "createdAt": "2023-12-20T10:00:00Z"
    }
  ],
  "total": 5
}
```

---

### 2. Tạo hoặc lấy Conversation

**Endpoint:** `POST /api/workspaces/:workspaceId/direct-messages/conversations`

**Body:**
```json
{
  "otherUserId": "user-uuid"
}
```

**Response:**
```json
{
  "id": "conv-uuid",
  "type": "DIRECT",
  "createdAt": "2023-12-24T10:00:00Z",
  "updatedAt": "2023-12-24T10:00:00Z"
}
```

**Note:** Nếu conversation đã tồn tại, trả về conversation hiện có.

---

### 3. Gửi tin nhắn Direct

**Endpoint:** `POST /api/workspaces/:workspaceId/direct-messages/send`

**Body:**
```json
{
  "recipientId": "user-uuid",
  "content": "Hello, how are you?",
  "conversationId": "conv-uuid",  // Optional: nếu đã biết conversationId
  "replyToId": "msg-uuid",        // Optional: reply to message
  "attachmentUrls": [             // Optional: file attachments
    "https://storage.com/file1.pdf",
    "https://storage.com/image.jpg"
  ]
}
```

**Response:**
```json
{
  "id": "msg-uuid",
  "conversationId": "conv-uuid",
  "content": "Hello, how are you?",
  "sender": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "username",
    "fullName": "User Name",
    "avatarUrl": "https://..."
  },
  "replyTo": {
    "id": "msg-uuid",
    "content": "Original message",
    "sender": { /* ... */ },
    "isDeleted": false
  },
  "mentions": [],
  "reactions": [],
  "attachments": [
    {
      "id": "attach-uuid",
      "fileUrl": "https://storage.com/file1.pdf",
      "createdAt": "2023-12-24T10:00:00Z"
    }
  ],
  "isDeleted": false,
  "createdAt": "2023-12-24T10:00:00Z",
  "updatedAt": "2023-12-24T10:00:00Z"
}
```

---

### 4. Lấy tin nhắn trong Conversation

**Endpoint:** `GET /api/workspaces/:workspaceId/direct-messages/conversations/:conversationId/messages`

**Query Parameters:**
- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số tin nhắn mỗi trang (mặc định: 50, tối đa: 100)
- `beforeId` (optional): Cursor-based pagination - lấy tin nhắn trước messageId này
- `afterId` (optional): Cursor-based pagination - lấy tin nhắn sau messageId này

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "conversationId": "conv-uuid",
      "content": "Message content",
      "sender": { /* ... */ },
      "replyTo": null,
      "mentions": [],
      "reactions": [
        {
          "emoji": "👍",
          "count": 2,
          "userIds": ["user-uuid-1", "user-uuid-2"]
        }
      ],
      "attachments": [],
      "isDeleted": false,
      "createdAt": "2023-12-24T10:00:00Z",
      "updatedAt": "2023-12-24T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50,
  "hasMore": true
}
```

---

### 5. Xóa tin nhắn

**Endpoint:** `DELETE /api/workspaces/:workspaceId/direct-messages/conversations/:conversationId/messages/:messageId`

**Response:**
```json
{
  "message": "Đã xóa tin nhắn thành công"
}
```

**Note:** Chỉ người gửi mới có quyền xóa tin nhắn của mình.

---

### 6. Thêm Reaction

**Endpoint:** `POST /api/workspaces/:workspaceId/direct-messages/conversations/:conversationId/messages/:messageId/reactions`

**Body:**
```json
{
  "emoji": "👍"
}
```

**Response:**
```json
{
  "message": "Đã thêm reaction thành công"
}
```

---

### 7. Xóa Reaction

**Endpoint:** `DELETE /api/workspaces/:workspaceId/direct-messages/conversations/:conversationId/messages/:messageId/reactions/:emoji`

**Note:** `:emoji` cần được URL encoded (e.g., `%F0%9F%91%8D` cho 👍)

**Response:**
```json
{
  "message": "Đã xóa reaction thành công"
}
```

---

### 8. Đánh dấu đã đọc

**Endpoint:** `POST /api/workspaces/:workspaceId/direct-messages/conversations/:conversationId/mark-read`

**Response:**
```json
{
  "message": "Đã đánh dấu đọc tất cả tin nhắn"
}
```

---

## 🔌 WebSocket Events

Xem chi tiết trong [README.md](./README.md) phần "Direct Messaging"

### Kết nối

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events chính

- **dm:join** - Join vào conversation room
- **dm:message:send** - Gửi tin nhắn
- **dm:message:new** - Nhận tin nhắn mới (real-time)
- **dm:typing:start/stop** - Typing indicator
- **dm:reaction:add/remove** - Thêm/xóa reaction
- **dm:messages:read** - Đánh dấu đã đọc

---

## 🛠️ Error Responses

Tất cả endpoints đều có thể trả về các lỗi sau:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Không thể chat với chính mình",
  "error": "Bad Request"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Cả hai user phải là thành viên của workspace",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Conversation không tồn tại",
  "error": "Not Found"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## 📊 Use Cases

### 1. Bắt đầu cuộc trò chuyện mới

```typescript
// Cách 1: Tạo conversation trước
const conv = await createConversation(workspaceId, otherUserId);
await sendDirectMessage(workspaceId, {
  conversationId: conv.id,
  recipientId: otherUserId,
  content: "Hi!"
});

// Cách 2: Gửi luôn (tự động tạo conversation)
await sendDirectMessage(workspaceId, {
  recipientId: otherUserId,
  content: "Hi!"
});
```

### 2. Real-time chat với typing indicator

```typescript
// Join conversation room
socket.emit('dm:join', { conversationId });

// Listen for messages
socket.on('dm:message:new', ({ message }) => {
  displayMessage(message);
});

// Typing indicator
let typingTimeout;
inputField.addEventListener('input', () => {
  socket.emit('dm:typing:start', { conversationId });
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('dm:typing:stop', { conversationId });
  }, 3000);
});

socket.on('dm:typing:start', ({ user }) => {
  showTypingIndicator(user.fullName);
});

socket.on('dm:typing:stop', () => {
  hideTypingIndicator();
});
```

### 3. Hiển thị unread count

```typescript
// Lấy conversations với unread count
const { conversations } = await getDirectConversations(workspaceId);

conversations.forEach(conv => {
  if (conv.unreadCount > 0) {
    displayBadge(conv.id, conv.unreadCount);
  }
});

// Đánh dấu đã đọc khi user mở conversation
await markAsRead(workspaceId, conversationId);
```

---

## 🔒 Security & Best Practices

1. **Authentication**: Tất cả endpoints yêu cầu JWT token valid
2. **Authorization**: Chỉ members của workspace mới có thể chat với nhau
3. **Soft Delete**: Messages bị xóa chỉ được đánh dấu `isDeleted`, không xóa khỏi DB
4. **Rate Limiting**: Nên implement rate limiting cho message sending
5. **File Upload**: attachmentUrls phải đã được upload trước (qua file upload API riêng)
6. **XSS Protection**: Frontend nên sanitize message content trước khi render

---

## 📈 Performance Tips

1. **Pagination**: Sử dụng cursor-based pagination (`beforeId`, `afterId`) cho performance tốt hơn với dataset lớn
2. **Caching**: Cache danh sách conversations ở client, chỉ refresh khi có tin nhắn mới
3. **Lazy Loading**: Load messages on-demand khi user scroll
4. **WebSocket**: Sử dụng WebSocket cho real-time, REST API cho initial load và pagination
5. **Debounce**: Debounce typing indicator để giảm số lượng events

