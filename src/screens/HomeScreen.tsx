import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import {useAuth} from '../context/AuthContext';
import {subscribeAllStatus, subscribeUserChats, subscribeUsers} from '../services';
import {colors, shadow} from '../theme/colors';
import {AppUser, ChatSummary, RootStackParamList, UserStatus} from '../types';
import {formatChatListTime} from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const {user, profile} = useAuth();
  const myUid = user!.uid;

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [users, setUsers] = useState<Record<string, AppUser>>({});
  const [statuses, setStatuses] = useState<Record<string, UserStatus>>({});
  const [loading, setLoading] = useState(true);

  // Mỗi lắng nghe đều trả về hàm hủy -> React gọi khi rời màn hình
  useEffect(() => {
    const unsubscribe = subscribeUserChats(myUid, list => {
      setChats(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [myUid]);

  useEffect(() => {
    const unsubscribe = subscribeUsers(list => {
      const map: Record<string, AppUser> = {};
      list.forEach(u => (map[u.uid] = u));
      setUsers(map);
    });
    return unsubscribe;
  }, []);

  useEffect(() => subscribeAllStatus(setStatuses), []);

  const onlineUsers = useMemo(
    () =>
      Object.values(users).filter(
        u => u.uid !== myUid && statuses[u.uid]?.state === 'online',
      ),
    [users, statuses, myUid],
  );

  const openChat = (other: AppUser) => navigation.navigate('Chat', {otherUser: other});

  const firstName = (profile?.name ?? user?.displayName ?? '').trim().split(/\s+/).pop();

  const renderChat = ({item}: {item: ChatSummary}) => {
    const other = users[item.otherUid];
    if (!other) {
      return null;
    }
    const isOnline = statuses[item.otherUid]?.state === 'online';
    const hasUnread = item.unread > 0;
    const prefix = item.lastSenderId === myUid ? 'Bạn: ' : '';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.chatRow, hasUnread && styles.chatRowUnread]}
        onPress={() => openChat(other)}>
        <Avatar name={other.name} color={other.avatarColor} size={56} showStatus online={isOnline} />
        <View style={styles.chatBody}>
          <View style={styles.chatTop}>
            <Text style={[styles.chatName, hasUnread && styles.bold]} numberOfLines={1}>
              {other.name}
            </Text>
            <Text style={[styles.chatTime, hasUnread && styles.chatTimeUnread]}>
              {formatChatListTime(item.updatedAt)}
            </Text>
          </View>
          <View style={styles.chatBottom}>
            <Text
              style={[styles.chatPreview, hasUnread && styles.chatPreviewUnread]}
              numberOfLines={1}>
              {prefix}
              {item.lastMessage}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread > 99 ? '99+' : item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const header = (
    <View>
      <View style={styles.header}>
        <View style={{flex: 1}}>
          <Text style={styles.greeting}>Xin chào{firstName ? `, ${firstName}` : ''} 👋</Text>
          <Text style={styles.title}>Đoạn chat</Text>
        </View>
        <Avatar name={profile?.name} color={profile?.avatarColor} size={46} />
      </View>

      {onlineUsers.length > 0 && (
        <View style={styles.onlineSection}>
          <Text style={styles.sectionTitle}>Đang hoạt động</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 20}}>
            {onlineUsers.map(u => (
              <TouchableOpacity key={u.uid} style={styles.onlineItem} onPress={() => openChat(u)}>
                <View style={styles.onlineRing}>
                  <Avatar name={u.name} color={u.avatarColor} size={54} showStatus online />
                </View>
                <Text style={styles.onlineName} numberOfLines={1}>
                  {u.name.trim().split(/\s+/).pop()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {chats.length > 0 && <Text style={[styles.sectionTitle, {marginTop: 8}]}>Gần đây</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={item => item.otherUid}
          renderItem={renderChat}
          ListHeaderComponent={header}
          contentContainerStyle={{paddingBottom: 24, flexGrow: 1}}
          ListEmptyComponent={
            <EmptyState
              emoji="💭"
              title="Chưa có cuộc trò chuyện nào"
              subtitle="Vào Danh bạ và chọn một người để bắt đầu nhắn tin nhé!">
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Main', {screen: 'Contacts'})}>
                <Text style={styles.emptyButtonText}>Mở danh bạ</Text>
              </TouchableOpacity>
            </EmptyState>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  greeting: {fontSize: 14, color: colors.textMuted, fontWeight: '500'},
  title: {fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 2},
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  onlineSection: {marginBottom: 16},
  onlineItem: {alignItems: 'center', marginRight: 16, width: 64},
  onlineRing: {
    padding: 3,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  onlineName: {fontSize: 12, color: colors.textSoft, marginTop: 6, fontWeight: '500'},
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 22,
  },
  chatRowUnread: {...shadow, shadowOpacity: 0.07},
  chatBody: {flex: 1, marginLeft: 14},
  chatTop: {flexDirection: 'row', alignItems: 'center'},
  chatName: {flex: 1, fontSize: 16, fontWeight: '600', color: colors.text},
  bold: {fontWeight: '800'},
  chatTime: {fontSize: 12, color: colors.textMuted, marginLeft: 8},
  chatTimeUnread: {color: colors.primary, fontWeight: '700'},
  chatBottom: {flexDirection: 'row', alignItems: 'center', marginTop: 5},
  chatPreview: {flex: 1, fontSize: 14, color: colors.textMuted},
  chatPreviewUnread: {color: colors.text, fontWeight: '600'},
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {color: '#fff', fontSize: 12, fontWeight: '800'},
  emptyButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyButtonText: {color: '#fff', fontWeight: '700'},
});
