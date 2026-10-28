import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {auth} from './firebaseConfig';
import {createUserProfile} from './userService';
import {setOffline} from './presenceService';

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  await updateProfile(cred.user, {displayName: name.trim()});
  await createUserProfile(cred.user.uid, name.trim(), email.trim());
  return cred.user;
}

export async function login(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function logout(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    // Phải ghi offline TRƯỚC khi signOut vì sau đó luật bảo mật sẽ chặn ghi
    await setOffline(uid).catch(() => {});
  }
  await signOut(auth);
}

export function subscribeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/** Chuyển mã lỗi Firebase sang thông báo tiếng Việt dễ hiểu */
export function getAuthErrorMessage(error: any): string {
  const code: string = error?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
    case 'auth/invalid-email':
      return 'Địa chỉ email không hợp lệ.';
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu, cần tối thiểu 6 ký tự.';
    case 'auth/too-many-requests':
      return 'Bạn thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.';
    case 'auth/network-request-failed':
      return 'Không có kết nối mạng. Kiểm tra Internet và thử lại.';
    case 'auth/user-disabled':
      return 'Tài khoản này đã bị vô hiệu hóa.';
    default:
      return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  }
}

