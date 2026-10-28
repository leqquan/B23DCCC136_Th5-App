import {
  get,
  increment,
  limitToLast,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';
import {db} from './firebaseConfig';
import {ChatSummary, Message} from '../types';

/** Id cuộc trò chuyện 1-1 luôn giống nhau với cả 2 người: uidNhỏ_uidLớn */
export function getChatId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

/**
 * Lắng nghe tin nhắn của một cuộc trò chuyện theo thời gian thực.
 * Trả về hàm hủy lắng nghe -> gọi trong cleanup của useEffect để không bị lặp tin.
 */
export function subscribeMessages(
  chatId: string,
  callback: (messages: Message[]) => void,
) {
  const q = query(
    ref(db, `messages/${chatId}`),
    orderByChild('createdAt'),
    limitToLast(300),
  );
  return onValue(q, snapshot => {
    const list: Message[] = [];
    snapshot.forEach(child => {
      const val = child.val();
      list.push({
        id: child.key as string,
        ...val,
        createdAt: typeof val.createdAt === 'number' ? val.createdAt : Date.now(),
      });
    });
    list.sort((a, b) => a.createdAt - b.createdAt);
    callback(list);
  });
}

async function pushMessage(
  myUid: string,
  otherUid: string,
  payload: Record<string, unknown>,
  preview: string,
) {
  const chatId = getChatId(myUid, otherUid);
  const msgRef = push(ref(db, `messages/${chatId}`));
  await set(msgRef, {
    ...payload,
    senderId: myUid,
    createdAt: serverTimestamp(),
  });

  // Cập nhật "hộp thư" của cả hai người (dùng cho màn hình Home)
  const now = serverTimestamp();
  await update(ref(db), {
    [`userChats/${myUid}/${otherUid}/lastMessage`]: preview,
    [`userChats/${myUid}/${otherUid}/lastSenderId`]: myUid,
    [`userChats/${myUid}/${otherUid}/updatedAt`]: now,
    [`userChats/${myUid}/${otherUid}/unread`]: 0,
    [`userChats/${otherUid}/${myUid}/lastMessage`]: preview,
    [`userChats/${otherUid}/${myUid}/lastSenderId`]: myUid,
    [`userChats/${otherUid}/${myUid}/updatedAt`]: now,
    [`userChats/${otherUid}/${myUid}/unread`]: increment(1),
  });
}

export async function sendTextMessage(
  myUid: string,
  otherUid: string,
  text: string,
) {
  const content = text.trim();
  if (!content) {
    return; // Không gửi tin rỗng
  }
  await pushMessage(myUid, otherUid, {type: 'text', text: content}, content);
}

export async function sendLocationMessage(
  myUid: string,
  otherUid: string,
  latitude: number,
  longitude: number,
) {
  await pushMessage(
    myUid,
    otherUid,
    {type: 'location', latitude, longitude},
    '📍 Đã chia sẻ vị trí',
  );
}

/** Đưa số tin chưa đọc về 0 khi mở cuộc trò chuyện */
export async function markAsRead(myUid: string, otherUid: string) {
  const unreadRef = ref(db, `userChats/${myUid}/${otherUid}/unread`);
  const snap = await get(unreadRef);
  if (snap.exists() && snap.val() !== 0) {
    await set(unreadRef, 0);
  }
}

/** Lắng nghe danh sách cuộc trò chuyện, mới nhất nằm trên cùng */
export function subscribeUserChats(
  uid: string,
  callback: (chats: ChatSummary[]) => void,
) {
  return onValue(ref(db, `userChats/${uid}`), snapshot => {
    const list: ChatSummary[] = [];
    snapshot.forEach(child => {
      const val = child.val();
      if (val && val.lastMessage) {
        list.push({
          otherUid: child.key as string,
          lastMessage: val.lastMessage,
          lastSenderId: val.lastSenderId,
          updatedAt: typeof val.updatedAt === 'number' ? val.updatedAt : Date.now(),
          unread: val.unread ?? 0,
        });
      }
    });
    list.sort((a, b) => b.updatedAt - a.updatedAt);
    callback(list);
  });
}

