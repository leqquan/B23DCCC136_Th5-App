import {AppState} from 'react-native';
import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
} from 'firebase/database';
import {db} from './firebaseConfig';
import {UserStatus} from '../types';

const statusPayload = (state: 'online' | 'offline') => ({
  state,
  lastChanged: serverTimestamp(),
});

/**
 * Bắt đầu theo dõi trạng thái online của người dùng hiện tại:
 *  - Khi kết nối tới Firebase: ghi online, đồng thời đăng ký onDisconnect -> offline
 *    (mất mạng / tắt app thì server tự chuyển offline).
 *  - Khi app chạy nền -> offline, quay lại -> online.
 * Trả về hàm dừng theo dõi (dùng trong cleanup của useEffect).
 */
export function startPresence(uid: string): () => void {
  const statusRef = ref(db, `status/${uid}`);
  const connectedRef = ref(db, '.info/connected');

  const unsubscribeConnected = onValue(connectedRef, snap => {
    if (snap.val() !== true) {
      return;
    }
    onDisconnect(statusRef)
      .set(statusPayload('offline'))
      .then(() => set(statusRef, statusPayload('online')))
      .catch(() => {});
  });

  const appStateSub = AppState.addEventListener('change', nextState => {
    const state = nextState === 'active' ? 'online' : 'offline';
    set(statusRef, statusPayload(state)).catch(() => {});
  });

  return () => {
    unsubscribeConnected();
    appStateSub.remove();
  };
}

export function setOffline(uid: string) {
  return set(ref(db, `status/${uid}`), statusPayload('offline'));
}

/** Lắng nghe trạng thái của tất cả người dùng: { uid: UserStatus } */
export function subscribeAllStatus(
  callback: (map: Record<string, UserStatus>) => void,
) {
  return onValue(ref(db, 'status'), snapshot => {
    callback((snapshot.val() as Record<string, UserStatus>) ?? {});
  });
}

/** Lắng nghe trạng thái của một người dùng */
export function subscribeStatus(
  uid: string,
  callback: (status: UserStatus | null) => void,
) {
  return onValue(ref(db, `status/${uid}`), snapshot => {
    callback(snapshot.exists() ? (snapshot.val() as UserStatus) : null);
  });
}

