import React, {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import PrimaryButton from '../components/PrimaryButton';
import {useAuth} from '../context/AuthContext';
import {logout} from '../services';
import {colors, shadow} from '../theme/colors';

function Row({
  icon,
  tint,
  label,
  value,
  right,
}: {
  icon: string;
  tint: string;
  label: string;
  value?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, {backgroundColor: tint}]}>
        <Text style={{fontSize: 17}}>{icon}</Text>
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {right ?? <Text style={styles.chevron}>›</Text>}
    </View>
  );
}

export default function SettingsScreen() {
  const {user, profile} = useAuth();
  const [notify, setNotify] = useState(true);
  const [sound, setSound] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const name = profile?.name ?? user?.displayName ?? 'Người dùng';

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi tài khoản?', [
      {text: 'Hủy', style: 'cancel'},
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
            // AuthContext nhận user = null -> tự quay về màn hình Đăng nhập
          } catch {
            setLoggingOut(false);
            Alert.alert('Lỗi', 'Không thể đăng xuất, vui lòng thử lại.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{paddingBottom: 32}}>
        <Text style={styles.title}>Cài đặt</Text>

        <View style={styles.profileCard}>
          <View style={styles.profileBg} />
          <Avatar name={name} color={profile?.avatarColor} size={72} showStatus online />
          <View style={{flex: 1, marginLeft: 16}}>
            <Text style={styles.profileName} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email}
            </Text>
            <View style={styles.onlineTag}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Đang hoạt động</Text>
            </View>
          </View>
        </View>

        <Text style={styles.section}>Tùy chọn</Text>
        <View style={styles.group}>
          <Row
            icon="🔔"
            tint="#FFF1EC"
            label="Thông báo"
            right={
              <Switch
                value={notify}
                onValueChange={setNotify}
                trackColor={{true: colors.primary, false: colors.border}}
                thumbColor="#fff"
              />
            }
          />
          <View style={styles.divider} />
          <Row
            icon="🔊"
            tint="#E7F8EE"
            label="Âm thanh tin nhắn"
            right={
              <Switch
                value={sound}
                onValueChange={setSound}
                trackColor={{true: colors.primary, false: colors.border}}
                thumbColor="#fff"
              />
            }
          />
          <View style={styles.divider} />
          <Row icon="🌐" tint="#EEF0FF" label="Ngôn ngữ" value="Tiếng Việt" />
        </View>

        <Text style={styles.section}>Thông tin</Text>
        <View style={styles.group}>
          <Row icon="🔒" tint="#F3E8FF" label="Quyền riêng tư" />
          <View style={styles.divider} />
          <TouchableOpacity
            onPress={() =>
              Alert.alert('B23DCCC136 Chat', 'Bài thực hành 5 - Chat realtime với Firebase.\nPhiên bản 1.0.0')
            }>
            <Row icon="ℹ️" tint="#FEF6E4" label="Về ứng dụng" value="v1.0.0" />
          </TouchableOpacity>
        </View>

        <PrimaryButton
          title="Đăng xuất"
          variant="danger"
          onPress={handleLogout}
          loading={loggingOut}
          style={{marginHorizontal: 16, marginTop: 28}}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 26,
    overflow: 'hidden',
    ...shadow,
  },
  profileBg: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primarySoft,
    right: -60,
    top: -70,
  },
  profileName: {fontSize: 19, fontWeight: '800', color: colors.text},
  profileEmail: {fontSize: 13.5, color: colors.textMuted, marginTop: 2},
  onlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E7F8EE',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  onlineDot: {width: 7, height: 7, borderRadius: 4, backgroundColor: colors.online, marginRight: 5},
  onlineText: {fontSize: 11.5, color: '#15803D', fontWeight: '700'},
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginTop: 26,
    marginBottom: 10,
  },
  group: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 22,
    paddingHorizontal: 14,
  },
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12},
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {flex: 1, fontSize: 15.5, color: colors.text, fontWeight: '500', marginLeft: 12},
  rowValue: {fontSize: 14, color: colors.textMuted, marginRight: 6},
  chevron: {fontSize: 22, color: colors.textMuted},
  divider: {height: 1, backgroundColor: colors.border, marginLeft: 50},
});

