import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import {useAuth} from '../context/AuthContext';
import {subscribeAllStatus, subscribeUsers} from '../services';
import {colors, shadow} from '../theme/colors';
import {AppUser, RootStackParamList, UserStatus} from '../types';
import {formatPresence, normalizeText} from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ContactsScreen() {
  const navigation = useNavigation<Nav>();
  const {user} = useAuth();
  const myUid = user!.uid;

  const [users, setUsers] = useState<AppUser[]>([]);
  const [statuses, setStatuses] = useState<Record<string, UserStatus>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeUsers(list => {
      // Không gồm bản thân
      setUsers(list.filter(u => u.uid !== myUid));
      setLoading(false);
    });
    return unsubscribe;
  }, [myUid]);

  useEffect(() => {
    const unsubscribe = subscribeAllStatus(setStatuses);
    return unsubscribe;
  }, []);

  // Làm mới chữ "Hoạt động x phút trước" mỗi phút
  useEffect(() => {
    const timer = setInterval(() => forceTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const keyword = normalizeText(search);
    return users
      .filter(
        u =>
          !keyword ||
          normalizeText(u.name).includes(keyword) ||
          u.email.toLowerCase().includes(keyword),
      )
      .sort((a, b) => {
        const ao = statuses[a.uid]?.state === 'online' ? 1 : 0;
        const bo = statuses[b.uid]?.state === 'online' ? 1 : 0;
        if (ao !== bo) {
          return bo - ao; // online lên trước
        }
        return a.name.localeCompare(b.name, 'vi');
      });
  }, [users, statuses, search]);

  const onlineCount = users.filter(u => statuses[u.uid]?.state === 'online').length;

  const renderItem = ({item}: {item: AppUser}) => {
    const st = statuses[item.uid];
    const isOnline = st?.state === 'online';
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.row}
        onPress={() => navigation.navigate('Chat', {otherUser: item})}>
        <Avatar name={item.name} color={item.avatarColor} size={52} showStatus online={isOnline} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.status, isOnline && styles.statusOnline]} numberOfLines={1}>
            {formatPresence(st?.state, st?.lastChanged)}
          </Text>
        </View>
        <View style={styles.chatButton}>
          <Text style={styles.chatButtonText}>💬</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh bạ</Text>
        <View style={styles.pill}>
          <View style={styles.pillDot} />
          <Text style={styles.pillText}>{onlineCount} đang online</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm theo tên hoặc email..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.uid}
          renderItem={renderItem}
          contentContainerStyle={{paddingBottom: 24, flexGrow: 1}}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            filtered.length > 0 ? (
              <Text style={styles.count}>{filtered.length} liên hệ</Text>
            ) : null
          }
          ListEmptyComponent={
            search ? (
              <EmptyState
                emoji="🔎"
                title="Không tìm thấy ai"
                subtitle={`Không có kết quả cho "${search}"`}
              />
            ) : (
              <EmptyState
                emoji="👋"
                title="Chưa có người dùng khác"
                subtitle="Hãy đăng ký thêm một tài khoản trên máy khác để bắt đầu trò chuyện."
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  title: {fontSize: 30, fontWeight: '800', color: colors.text},
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F8EE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.online,
    marginRight: 6,
  },
  pillText: {color: '#15803D', fontWeight: '700', fontSize: 12.5},
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 50,
    ...shadow,
    shadowOpacity: 0.05,
  },
  searchIcon: {fontSize: 16, marginRight: 10},
  searchInput: {flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0},
  clear: {color: colors.textMuted, fontSize: 15, fontWeight: '700'},
  count: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 20,
  },
  info: {flex: 1, marginLeft: 14},
  name: {fontSize: 16, fontWeight: '700', color: colors.text},
  status: {fontSize: 13, color: colors.textMuted, marginTop: 3},
  statusOnline: {color: colors.online, fontWeight: '600'},
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {fontSize: 17},
});

