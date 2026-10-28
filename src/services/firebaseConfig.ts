import {initializeApp, getApps, getApp} from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  // @ts-ignore - hàm này chỉ có trong bản build React Native của firebase/auth
  getReactNativePersistence,
  Auth,
} from 'firebase/auth';
import {getDatabase} from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cấu hình Firebase Project: B23DCCC136 TH5 Chat (b23dccc136-th5-chat)
 * Console: https://console.firebase.google.com/project/b23dccc136-th5-chat/overview
 */
const firebaseConfig = {
  apiKey: 'AIzaSyB-kJFvqB4_PL0fHb4yp9atcvl32qJYGZQ',
  authDomain: 'b23dccc136-th5-chat.firebaseapp.com',
  databaseURL: 'https://b23dccc136-th5-chat-default-rtdb.firebaseio.com',
  projectId: 'b23dccc136-th5-chat',
  storageBucket: 'b23dccc136-th5-chat.firebasestorage.app',
  messagingSenderId: '729675103334',
  appId: '1:729675103334:web:ff4f212bfef5a9bd2101a7',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;
try {
  // Lưu phiên đăng nhập vào AsyncStorage để mở lại app không phải đăng nhập lại
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Khi Fast Refresh, auth đã được khởi tạo trước đó
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getDatabase(app);
export default app;
