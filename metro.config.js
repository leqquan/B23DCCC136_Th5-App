const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Firebase JS SDK cần 2 chỉnh sửa nhỏ để chạy ổn định với Metro:
 *  - Cho phép file .cjs
 *  - Tắt package "exports" để Metro lấy đúng bản build React Native của firebase/auth
 *    (bản này có getReactNativePersistence giúp giữ phiên đăng nhập).
 */
const config = {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
    unstable_enablePackageExports: false,
  },
};

module.exports = mergeConfig(defaultConfig, config);

