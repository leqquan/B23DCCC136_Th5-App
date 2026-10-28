import {onValue, ref, serverTimestamp, set} from 'firebase/database';
import {db} from './firebaseConfig';
import {AppUser} from '../types';
import {avatarPalette} from '../theme/colors';

function pickAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

export async function createUserProfile(
  uid: string,
  name: string,
  email: string,
): Promise<void> {
  await set(ref(db, `users/${uid}`), {
    uid,
    name,
    email: email.toLowerCase(),
    avatarColor: pickAvatarColor(uid),
    createdAt: serverTimestamp(),
  });
}

/** Lắng nghe toàn bộ danh sách người dùng. Trả về hàm hủy lắng nghe. */
export function subscribeUsers(callback: (users: AppUser[]) => void) {
  return onValue(ref(db, 'users'), snapshot => {
    const list: AppUser[] = [];
    snapshot.forEach(child => {
      const val = child.val();
      if (val) {
        list.push({...val, uid: child.key as string});
      }
    });
    callback(list);
  });
}

/** Lắng nghe hồ sơ một người dùng. Trả về hàm hủy lắng nghe. */
export function subscribeUser(
  uid: string,
  callback: (user: AppUser | null) => void,
) {
  return onValue(ref(db, `users/${uid}`), snapshot => {
    callback(snapshot.exists() ? {...snapshot.val(), uid} : null);
  });
}

