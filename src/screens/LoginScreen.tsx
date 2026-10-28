import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import AuthInput from '../components/AuthInput';
import PrimaryButton from '../components/PrimaryButton';
import {getAuthErrorMessage, login} from '../services';
import {colors, shadow} from '../theme/colors';
import {RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({navigation}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{email?: string; password?: string}>({});

  const handleLogin = async () => {
    const errs: typeof fieldErrors = {};
    if (!EMAIL_REGEX.test(email.trim())) {
      errs.email = 'Vui lòng nhập email hợp lệ';
    }
    if (!password) {
      errs.password = 'Vui lòng nhập mật khẩu';
    }
    setFieldErrors(errs);
    setError('');
    if (Object.keys(errs).length) {
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Đăng nhập thành công -> AuthContext tự chuyển sang màn hình chính
    } catch (e) {
      setError(getAuthErrorMessage(e));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blobTop} />
      <View style={styles.blobSide} />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Text style={styles.logoEmoji}>💬</Text>
            </View>
            <Text style={styles.title}>Chào mừng trở lại!</Text>
            <Text style={styles.subtitle}>
              Đăng nhập để tiếp tục trò chuyện cùng bạn bè
            </Text>
          </View>

          <View style={styles.card}>
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <AuthInput
              label="Email"
              icon="✉️"
              placeholder="ban@example.com"
              keyboardType="email-address"
              value={email}
              onChangeText={t => {
                setEmail(t);
                setError('');
              }}
              error={fieldErrors.email}
            />
            <AuthInput
              label="Mật khẩu"
              icon="🔒"
              placeholder="Nhập mật khẩu"
              isPassword
              value={password}
              onChangeText={t => {
                setPassword(t);
                setError('');
              }}
              error={fieldErrors.password}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />

            <PrimaryButton
              title="Đăng nhập"
              onPress={handleLogin}
              loading={loading}
              style={{marginTop: 8}}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  blobTop: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primary,
    opacity: 0.12,
    top: -140,
    right: -90,
  },
  blobSide: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    opacity: 0.1,
    top: 180,
    left: -110,
  },
  scroll: {flexGrow: 1, padding: 24, justifyContent: 'center'},
  hero: {alignItems: 'center', marginBottom: 28},
  logo: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    transform: [{rotate: '-8deg'}],
    ...shadow,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
  },
  logoEmoji: {fontSize: 38, transform: [{rotate: '8deg'}]},
  title: {fontSize: 28, fontWeight: '800', color: colors.text},
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 22,
    ...shadow,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: {fontSize: 16, marginRight: 8},
  errorText: {flex: 1, color: colors.danger, fontSize: 13.5, fontWeight: '500'},
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {color: colors.textMuted, fontSize: 14.5},
  link: {color: colors.primary, fontWeight: '700', fontSize: 14.5},
});

