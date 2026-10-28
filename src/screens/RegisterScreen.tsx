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
import {getAuthErrorMessage, register} from '../services';
import {colors, shadow} from '../theme/colors';
import {RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function RegisterScreen({navigation}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (name.trim().length < 2) {
      e.name = 'Vui lòng nhập họ tên';
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      e.email = 'Email không hợp lệ';
    }
    if (password.length < 6) {
      e.password = 'Mật khẩu cần tối thiểu 6 ký tự';
    }
    if (!confirm) {
      e.confirm = 'Vui lòng nhập lại mật khẩu';
    } else if (confirm !== password) {
      e.confirm = 'Mật khẩu nhập lại không khớp';
    }
    return e;
  };

  const handleRegister = async () => {
    const e = validate();
    setErrors(e);
    setServerError('');
    if (Object.keys(e).length) {
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      // Thành công -> tự động đăng nhập và chuyển sang màn hình chính
    } catch (err) {
      setServerError(getAuthErrorMessage(err));
      setLoading(false);
    }
  };

  // Thanh độ mạnh mật khẩu nhỏ cho sinh động
  const strength = Math.min(
    3,
    (password.length >= 6 ? 1 : 0) +
      (/[A-Z]/.test(password) || /\d/.test(password) ? 1 : 0) +
      (password.length >= 10 ? 1 : 0),
  );
  const strengthColors = [colors.border, colors.danger, '#F59E0B', colors.online];
  const strengthLabels = ['', 'Yếu', 'Trung bình', 'Mạnh'];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blob} />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Tạo tài khoản ✨</Text>
          <Text style={styles.subtitle}>
            Chỉ mất một phút để bắt đầu nhắn tin với mọi người
          </Text>

          <View style={styles.card}>
            {!!serverError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            )}

            <AuthInput
              label="Họ và tên"
              icon="👤"
              placeholder="Nguyễn Văn A"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />
            <AuthInput
              label="Email"
              icon="✉️"
              placeholder="ban@example.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />
            <AuthInput
              label="Mật khẩu"
              icon="🔒"
              placeholder="Tối thiểu 6 ký tự"
              isPassword
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                {[1, 2, 3].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      {backgroundColor: i <= strength ? strengthColors[strength] : colors.border},
                    ]}
                  />
                ))}
                <Text style={[styles.strengthLabel, {color: strengthColors[strength]}]}>
                  {strengthLabels[strength]}
                </Text>
              </View>
            )}
            <AuthInput
              label="Nhập lại mật khẩu"
              icon="🔁"
              placeholder="Nhập lại mật khẩu"
              isPassword
              value={confirm}
              onChangeText={setConfirm}
              error={errors.confirm}
              onSubmitEditing={handleRegister}
              returnKeyType="done"
            />

            <PrimaryButton
              title="Đăng ký"
              onPress={handleRegister}
              loading={loading}
              style={{marginTop: 8}}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  blob: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.accent,
    opacity: 0.1,
    top: -120,
    left: -80,
  },
  scroll: {flexGrow: 1, padding: 24, paddingTop: 12},
  back: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...shadow,
  },
  backText: {fontSize: 30, color: colors.text, marginTop: -4},
  title: {fontSize: 28, fontWeight: '800', color: colors.text},
  subtitle: {fontSize: 15, color: colors.textMuted, marginTop: 8, marginBottom: 24},
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
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  strengthBar: {flex: 1, height: 5, borderRadius: 3, marginRight: 6},
  strengthLabel: {fontSize: 12, fontWeight: '600', width: 72, textAlign: 'right'},
  footer: {flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 12},
  footerText: {color: colors.textMuted, fontSize: 14.5},
  link: {color: colors.primary, fontWeight: '700', fontSize: 14.5},
});

