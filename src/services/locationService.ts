import {Linking, PermissionsAndroid, Platform} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface Coords {
  latitude: number;
  longitude: number;
}

/** Xin quyền vị trí. Trả về true nếu được cấp. */
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Cho phép truy cập vị trí',
        message: 'Ứng dụng cần vị trí hiện tại để gửi cho bạn bè trong cuộc trò chuyện.',
        buttonPositive: 'Cho phép',
        buttonNegative: 'Từ chối',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  return new Promise(resolve => {
    Geolocation.requestAuthorization(
      () => resolve(true),
      () => resolve(false),
    );
  });
}

function getPosition(highAccuracy: boolean): Promise<Coords> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      err => reject(err),
      {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 12000 : 20000,
        maximumAge: 10000,
      },
    );
  });
}

/** Lấy vị trí hiện tại; nếu GPS chính xác cao thất bại thì thử lại bằng mạng */
export async function getCurrentPosition(): Promise<Coords> {
  try {
    return await getPosition(true);
  } catch {
    return getPosition(false);
  }
}

/** Mở Google Maps đúng tọa độ */
export function openInGoogleMaps(latitude: number, longitude: number) {
  const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  return Linking.openURL(url);
}

