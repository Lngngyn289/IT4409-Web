# Chat Module - Real-time với Socket.IO

## 🚀 Công nghệ sử dụng

| Công nghệ | Version | Mô tả |
|-----------|---------|-------|
| **NestJS WebSockets** | ^11.x | WebSocket framework |
| **Socket.IO** | ^4.x | Real-time engine |
| **JWT** | - | Xác thực WebSocket |
| **Prisma** | ^6.x | ORM |

## 🔐 Xác thực WebSocket với JWT

Client cần gửi JWT token khi connect. Có 3 cách:

### Cách 1: Auth header (Recommended)
```javascript
const socket = io('http://localhost:3000/chat', {
  extraHeaders: {
    Authorization: `Bearer ${token}`
  }
});
```

### Cách 2: Auth object
```javascript
const socket = io('http://localhost:3000/chat', {
  auth: {
    token: token
  }
});
```

### Cách 3: Query params
```javascript
const socket = io(`http://localhost:3000/chat?token=${token}`);
```

## 📡 Socket.IO Events

### Client → Server (Emit)

| Event | Payload | Mô tả |
|-------|---------|-------|
| `channel:join` | `{ channelId: string }` | Join vào channel room |
| `channel:leave` | `{ channelId: string }` | Rời khỏi channel room |
| `message:send` | `{ channelId: string, message: CreateMessageDto }` | Gửi tin nhắn |
| `message:delete` | `{ channelId: string, messageId: string }` | Xóa tin nhắn |
| `reaction:add` | `{ channelId: string, messageId: string, reaction: { emoji: string } }` | Thêm reaction |
| `reaction:remove` | `{ channelId: string, messageId: string, emoji: string }` | Xóa reaction |
| `typing:start` | `{ channelId: string }` | Bắt đầu gõ |
| `typing:stop` | `{ channelId: string }` | Dừng gõ |
| `messages:read` | `{ channelId: string }` | Đánh dấu đã đọc |
| `users:online` | `{ channelId: string }` | Lấy danh sách online |

### Server → Client (Listen)

| Event | Payload | Mô tả |
|-------|---------|-------|
| `connected` | `{ message, user }` | Kết nối thành công |
| `error` | `{ message, event? }` | Lỗi xảy ra |
| `channel:joined` | `{ channelId, onlineUsers }` | Đã join channel |
| `channel:left` | `{ channelId }` | Đã rời channel |
| `message:new` | `{ channelId, message }` | Tin nhắn mới |
| `message:sent` | `{ channelId, message }` | Xác nhận đã gửi |
| `message:deleted` | `{ channelId, messageId, deletedBy }` | Tin nhắn bị xóa |
| `reaction:added` | `{ channelId, messageId, emoji, user }` | Reaction mới |
| `reaction:removed` | `{ channelId, messageId, emoji, user }` | Reaction bị xóa |
| `typing:start` | `{ channelId, user }` | Ai đó đang gõ |
| `typing:stop` | `{ channelId, user }` | Ai đó dừng gõ |
| `user:online` | `{ channelId, user }` | User online |
| `user:offline` | `{ channelId, user }` | User offline |
| `messages:read` | `{ channelId, user, readAt }` | User đã đọc |
| `users:online:list` | `{ channelId, onlineUsers }` | Danh sách online |

## 💻 Ví dụ Client Code (React)

```typescript
import { io, Socket } from 'socket.io-client';
import { useEffect, useState, useRef } from 'react';

// Hook custom cho Socket.IO
export function useChatSocket(token: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    // Tạo connection
    const socket = io('http://localhost:3000/chat', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    socket.on('connected', (data) => {
      setIsConnected(true);
      console.log('Authenticated:', data.user);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Message events
    socket.on('message:new', ({ message }) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('message:deleted', ({ messageId }) => {
      setMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, isDeleted: true } : m)
      );
    });

    // Typing events
    socket.on('typing:start', ({ user }) => {
      setTypingUsers(prev => {
        if (prev.find(u => u.id === user.id)) return prev;
        return [...prev, user];
      });
    });

    socket.on('typing:stop', ({ user }) => {
      setTypingUsers(prev => prev.filter(u => u.id !== user.id));
    });

    // Online status
    socket.on('user:online', ({ user }) => {
      setOnlineUsers(prev => {
        if (prev.find(u => u.id === user.id)) return prev;
        return [...prev, user];
      });
    });

    socket.on('user:offline', ({ user }) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== user.id));
    });

    socket.on('channel:joined', ({ onlineUsers: users }) => {
      setOnlineUsers(users);
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Actions
  const joinChannel = (channelId: string) => {
    socketRef.current?.emit('channel:join', { channelId });
  };

  const leaveChannel = (channelId: string) => {
    socketRef.current?.emit('channel:leave', { channelId });
  };

  const sendMessage = (channelId: string, content: string, replyToId?: string) => {
    socketRef.current?.emit('message:send', {
      channelId,
      message: { content, replyToId },
    });
  };

  const deleteMessage = (channelId: string, messageId: string) => {
    socketRef.current?.emit('message:delete', { channelId, messageId });
  };

  const addReaction = (channelId: string, messageId: string, emoji: string) => {
    socketRef.current?.emit('reaction:add', {
      channelId,
      messageId,
      reaction: { emoji },
    });
  };

  const startTyping = (channelId: string) => {
    socketRef.current?.emit('typing:start', { channelId });
  };

  const stopTyping = (channelId: string) => {
    socketRef.current?.emit('typing:stop', { channelId });
  };

  return {
    isConnected,
    messages,
    typingUsers,
    onlineUsers,
    joinChannel,
    leaveChannel,
    sendMessage,
    deleteMessage,
    addReaction,
    startTyping,
    stopTyping,
  };
}
```

## 🔧 REST API Endpoints (vẫn giữ)

REST API vẫn hoạt động song song với WebSocket:

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/channels/:channelId/chat/messages` | Lấy tin nhắn (có pagination) |
| `POST` | `/api/channels/:channelId/chat/messages` | Gửi tin nhắn |
| `DELETE` | `/api/channels/:channelId/chat/messages/:id` | Xóa tin nhắn |
| `POST` | `/api/channels/:channelId/chat/messages/:id/reactions` | Thêm reaction |

## 🔹 Direct Messaging (1-1 Chat)

### REST API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/workspaces/:workspaceId/direct-messages` | Lấy danh sách conversations |
| `POST` | `/api/workspaces/:workspaceId/direct-messages/conversations` | Tạo hoặc lấy conversation |
| `POST` | `/api/workspaces/:workspaceId/direct-messages/send` | Gửi tin nhắn direct |
| `GET` | `/api/workspaces/:workspaceId/direct-messages/conversations/:conversationId/messages` | Lấy tin nhắn (pagination) |
| `DELETE` | `/api/workspaces/:workspaceId/direct-messages/conversations/:conversationId/messages/:messageId` | Xóa tin nhắn |
| `POST` | `/api/workspaces/:workspaceId/direct-messages/conversations/:conversationId/messages/:messageId/reactions` | Thêm reaction |
| `DELETE` | `/api/workspaces/:workspaceId/direct-messages/conversations/:conversationId/messages/:messageId/reactions/:emoji` | Xóa reaction |
| `POST` | `/api/workspaces/:workspaceId/direct-messages/conversations/:conversationId/mark-read` | Đánh dấu đã đọc |

### WebSocket Events (Direct Messaging)

#### Client → Server (Emit)

| Event | Payload | Mô tả |
|-------|---------|-------|
| `dm:join` | `{ conversationId: string }` | Join vào DM conversation room |
| `dm:leave` | `{ conversationId: string }` | Rời khỏi DM conversation room |
| `dm:message:send` | `{ workspaceId, conversationId?, recipientId, content?, replyToId?, attachmentUrls? }` | Gửi tin nhắn direct |
| `dm:message:delete` | `{ conversationId: string, messageId: string }` | Xóa tin nhắn |
| `dm:reaction:add` | `{ conversationId: string, messageId: string, reaction: { emoji: string } }` | Thêm reaction |
| `dm:reaction:remove` | `{ conversationId: string, messageId: string, emoji: string }` | Xóa reaction |
| `dm:typing:start` | `{ conversationId: string }` | Bắt đầu gõ |
| `dm:typing:stop` | `{ conversationId: string }` | Dừng gõ |
| `dm:messages:read` | `{ conversationId: string }` | Đánh dấu đã đọc |

#### Server → Client (Listen)

| Event | Payload | Mô tả |
|-------|---------|-------|
| `dm:joined` | `{ conversationId, otherParticipantOnline }` | Đã join conversation |
| `dm:left` | `{ conversationId }` | Đã rời conversation |
| `dm:message:new` | `{ conversationId, message }` | Tin nhắn mới |
| `dm:message:notification` | `{ conversationId, message }` | Thông báo tin nhắn mới (cho user chưa join room) |
| `dm:message:sent` | `{ conversationId, message }` | Xác nhận đã gửi |
| `dm:message:deleted` | `{ conversationId, messageId, deletedBy }` | Tin nhắn bị xóa |
| `dm:reaction:added` | `{ conversationId, messageId, emoji, user }` | Reaction mới |
| `dm:reaction:removed` | `{ conversationId, messageId, emoji, user }` | Reaction bị xóa |
| `dm:typing:start` | `{ conversationId, user }` | Ai đó đang gõ |
| `dm:typing:stop` | `{ conversationId, user }` | Ai đó dừng gõ |
| `dm:user:online` | `{ conversationId, user }` | User online trong conversation |
| `dm:user:offline` | `{ conversationId, user }` | User offline trong conversation |
| `dm:messages:read` | `{ conversationId, user, readAt }` | User đã đọc |

### Example: Sending Direct Message

```typescript
// Gửi tin nhắn trực tiếp cho user khác trong workspace
socket.emit('dm:message:send', {
  workspaceId: 'workspace-id',
  recipientId: 'user-id',
  content: 'Hello!',
  // conversationId: 'conv-id', // Optional: nếu đã có conversation
  // replyToId: 'msg-id', // Optional: reply to message
  // attachmentUrls: ['url1', 'url2'], // Optional: file attachments
});

// Listen for new messages
socket.on('dm:message:new', ({ conversationId, message }) => {
  console.log('New DM:', message);
});

// Listen for message notifications (khi chưa join room)
socket.on('dm:message:notification', ({ conversationId, message }) => {
  console.log('New DM notification:', message);
  // Có thể hiển thị notification và tự động join conversation
  socket.emit('dm:join', { conversationId });
});
```

### Example: Listing Direct Conversations

```typescript
// REST API: Lấy danh sách conversations
const response = await fetch('/api/workspaces/:workspaceId/direct-messages', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { conversations, total } = await response.json();

// conversations = [
//   {
//     id: 'conv-id',
//     otherParticipant: {
//       id: 'user-id',
//       username: 'john_doe',
//       fullName: 'John Doe',
//       email: 'john@example.com',
//       avatarUrl: '...',
//       isOnline: true
//     },
//     lastMessage: {
//       id: 'msg-id',
//       content: 'Hello!',
//       senderId: 'user-id',
//       senderName: 'John Doe',
//       isDeleted: false,
//       createdAt: '2023-12-24T10:00:00Z'
//     },
//     unreadCount: 3,
//     updatedAt: '2023-12-24T10:00:00Z',
//     createdAt: '2023-12-20T10:00:00Z'
//   }
// ]
```

## 📝 Notes

1. **Namespace**: WebSocket sử dụng namespace `/chat`
2. **Rooms**:
   - Channel chat: `channel:{channelId}`
   - Direct messaging: `dm:{conversationId}`
3. **Authentication**: Token được verify mỗi lần connect và mỗi event (qua Guard)
4. **Persistence**: Messages được lưu vào DB, WebSocket chỉ broadcast real-time
5. **Direct Messages**: Chỉ có thể chat với members trong cùng workspace
6. **Privacy**: Trong DM, chỉ người gửi mới có quyền xóa tin nhắn của mình

