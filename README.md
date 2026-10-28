# B23DCCC136 – Bài thực hành 5: Ứng dụng Chat Thời Gian Thực (React Native CLI + Firebase)

Dự án **React Native CLI 0.76.5** hoàn chỉnh (đã có sẵn thư mục native `android/`, `ios/` và đã cài đặt `node_modules/`), sử dụng **React Navigation**, **Firebase JS SDK** (`firebase/auth`, `firebase/database`) và **`@react-native-community/geolocation`**.

---

## 1. Đáp ứng yêu cầu đề bài

| Mục | Yêu cầu | Triển khai trong mã nguồn |
|---|---|---|
| **1. Đăng ký / Đăng nhập** | • Đăng ký: họ tên, email, mật khẩu (≥ 6 ký tự), nhập lại mật khẩu<br>• Đăng nhập Firebase, báo lỗi khi sai tài khoản/mật khẩu<br>• Đăng xuất ở Cài đặt → quay về màn hình Đăng nhập | • `src/screens/RegisterScreen.tsx` (kiểm tra từng trường + thanh độ mạnh mật khẩu)<br>• `src/screens/LoginScreen.tsx` + `getAuthErrorMessage` trong `src/services/authService.ts`<br>• `src/screens/SettingsScreen.tsx` (ghi trạng thái `offline` trước khi `signOut`, `AuthContext` tự điều hướng về `Login`) |
| **2. Danh bạ** | • Lấy danh sách người dùng từ Firebase (không gồm bản thân)<br>• Trạng thái online/offline theo thời gian thực<br>• Ô tìm kiếm, nhấn vào mở màn hình Chat | • `src/screens/ContactsScreen.tsx`<br>• `src/services/presenceService.ts` (`.info/connected` + `onDisconnect` + `AppState`)<br>• Tìm kiếm theo tên (hỗ trợ cả có dấu & không dấu) hoặc email |
| **3. Chat 1-1** | • Gửi/nhận tin nhắn ngay lập tức<br>• Tin của mình bên phải, người kia bên trái, kèm thời gian<br>• Không cho gửi tin rỗng, tự cuộn xuống tin mới nhất<br>• Thanh tiêu đề hiển thị tên & trạng thái online | • `src/screens/ChatScreen.tsx` + `src/services/chatService.ts`<br>• Gộp nhóm tin nhắn liên tiếp, nhãn phân cách ngày (`Hôm nay`, `Hôm qua`, ...)<br>• Nút gửi khóa khi rỗng + `FlatList` `inverted` tự cuộn xuống tin mới nhất<br>• `ChatHeaderTitle` lắng nghe `subscribeStatus(otherUser.uid)` |
| **4. Gửi vị trí** | • Nút 📍 gửi vị trí hiện tại, xin quyền vị trí, báo khi từ chối<br>• Tin vị trí hiển thị khác tin thường, nhấn mở Google Maps đúng tọa độ | • `src/services/locationService.ts` (`PermissionsAndroid` + `Geolocation.getCurrentPosition`)<br>• `LocationBubble` trong `ChatScreen.tsx` hiển thị thẻ bản đồ + tọa độ, nhấn mở `https://www.google.com/maps/search/?api=1&query=lat,lng` |
| **5. Màn hình Home** | • Hiển thị các cuộc trò chuyện đã có (ảnh đại diện, tên, tin cuối, thời gian), mới nhất trên cùng<br>• Số tin chưa đọc tăng ngay khi có tin mới, về 0 khi mở chat | • `src/screens/HomeScreen.tsx` + dải ngang người dùng đang hoạt động<br>• `increment(1)` trong `sendTextMessage`/`sendLocationMessage` và `markAsRead` khi mở `ChatScreen` |
| **6. Yêu cầu kỹ thuật** | • React Native CLI + React Navigation<br>• Firebase JS SDK (`firebase/auth`, `firebase/database`), `@react-native-community/geolocation`<br>• Gom code Firebase vào `src/services/`<br>• Hủy lắng nghe trong cleanup của `useEffect`<br>• Màn hình Thông báo giữ như Bài 4 | • Toàn bộ cấu hình & hàm Firebase nằm trong `src/services/`<br>• Mọi `useEffect` lắng nghe (`subscribeMessages`, `subscribeUsers`, `subscribeUserChats`, `subscribeStatus`, `subscribeAllStatus`) đều trả về `unsubscribe` trong cleanup<br>• `src/screens/NotificationsScreen.tsx` |

---

## 2. Cấu trúc thư mục

```text
B23DCCC136_TH5/
├── android/                  # Dự án Android gốc (đã khai báo ACCESS_FINE_LOCATION & ACCESS_COARSE_LOCATION)
├── ios/                      # Dự án iOS gốc (đã khai báo NSLocationWhenInUseUsageDescription)
├── src/
│   ├── components/           # Avatar, AuthInput, PrimaryButton, EmptyState
│   ├── context/              # AuthContext (quản lý phiên đăng nhập + tự bật/tắt presence)
│   ├── navigation/           # AppNavigator (Native Stack + Bottom Tabs có badge số tin chưa đọc)
│   ├── screens/              # LoginScreen, RegisterScreen, HomeScreen, ContactsScreen,
│   │                         # ChatScreen, NotificationsScreen, SettingsScreen
│   ├── services/             # Toàn bộ code Firebase & định vị:
│   │   ├── firebaseConfig.ts # Khởi tạo Firebase App, Auth (AsyncStorage persistence), Realtime DB
│   │   ├── authService.ts    # Đăng ký, đăng nhập, đăng xuất, thông báo lỗi tiếng Việt
│   │   ├── userService.ts    # Lưu & lắng nghe danh sách người dùng (/users)
│   │   ├── presenceService.ts# Trạng thái online/offline realtime (/status)
│   │   ├── chatService.ts    # Gửi/nhận tin nhắn (/messages) & danh sách hội thoại (/userChats)
│   │   ├── locationService.ts# Xin quyền GPS, lấy tọa độ, mở Google Maps
│   │   └── index.ts
│   ├── theme/                # Bảng màu & đổ bóng (colors.ts)
│   ├── types/                # Kiểu dữ liệu TypeScript (index.ts)
│   └── utils/                # Định dạng giờ/ngày, chữ cái đầu avatar, bỏ dấu tiếng Việt (format.ts)
├── App.tsx
├── database.rules.json       # Luật bảo mật Firebase Realtime Database
├── metro.config.js           # Cấu hình Metro tương thích Firebase JS SDK
└── package.json
```

---

## 3. Cấu hình Firebase (ĐÃ HOÀN TẤT SẴN)

Project Firebase đã được tạo, bật **Authentication (Email/Password)**, khởi tạo **Realtime Database**, đẩy luật bảo mật từ [`database.rules.json`](./database.rules.json) và điền sẵn vào [`src/services/firebaseConfig.ts`](./src/services/firebaseConfig.ts):

- **Project ID**: `b23dccc136-th5-chat`
- **Firebase Console**: https://console.firebase.google.com/project/b23dccc136-th5-chat/overview
- **Tab Data (Realtime Database)**: https://console.firebase.google.com/project/b23dccc136-th5-chat/database/b23dccc136-th5-chat-default-rtdb/data
- **Tài khoản mẫu đã tạo sẵn** (hoặc bạn có thể đăng ký mới trực tiếp trên app):
  - Máy 1: `quan@ptit.edu.vn` / Mật khẩu: `123456` (Lê Anh Quân)
  - Máy 2: `minhanh@ptit.edu.vn` / Mật khẩu: `123456` (Nguyễn Minh Anh)

### Chạy ứng dụng trên máy ảo Android
Dự án đã được cài sẵn `node_modules`. Để chạy:

```powershell
cd d:\B23DCCC136_TH5
npx react-native start
```

Mở một cửa sổ terminal khác:

```powershell
cd d:\B23DCCC136_TH5
npx react-native run-android
```

### Bước 3: Chạy trên 2 máy ảo để test chat realtime & quay video
1. Mở **2 máy ảo Android** trong Android Studio → Device Manager.
2. Kiểm tra danh sách thiết bị:
   ```powershell
   adb devices
   ```
   (Ví dụ: `emulator-5554` và `emulator-5556`).
3. Cài đặt lên từng máy ảo:
   ```powershell
   npx react-native run-android --deviceId emulator-5554
   npx react-native run-android --deviceId emulator-5556
   ```
4. Đăng ký 2 tài khoản khác nhau trên 2 máy ảo và nhắn tin trực tiếp với nhau.
5. Để test gửi vị trí trên máy ảo: nhấn nút **⋯ (Extended Controls)** cạnh máy ảo → **Location** → chọn một điểm trên bản đồ → **Set Location**, sau đó nhấn nút **📍** trong màn hình Chat.

---

## 4. Lưu ý khi đóng gói nộp bài
Khi nén thư mục nộp bài, **không kèm** các thư mục:
- `node_modules/`
- `android/build/` và `android/app/build/`
- `ios/Pods/`
