import React, {useState} from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import EmptyState from '../components/EmptyState';
import {colors, shadow} from '../theme/colors';

/** Màn hình Thông báo giữ như Bài 4: dữ liệu mẫu cục bộ */
interface NotificationItem {
  id: string;
  icon: string;
  color: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const SAMPLE: NotificationItem[] = [
  {
    id: '1',
    icon: '👋',
    color: '#EEF0FF',
    title: 'Chào mừng bạn!',
    body: 'Tài khoản của bạn đã sẵn sàng. Hãy bắt đầu trò chuyện với bạn bè.',
    time: 'Vừa xong',
    read: false,
  },
  {
    id: '2',
    icon: '💬',
    color: '#FFF1EC',
    title: 'Tin nhắn mới',
    body: 'Bạn có tin nhắn mới đang chờ trong mục Đoạn chat.',
    time: '5 phút trước',
    read: false,
  },
  {
    id: '3',
    icon: '👥',
    color: '#E7F8EE',
    title: 'Bạn mới tham gia',
    body: 'Một người bạn vừa đăng ký ứng dụng. Gửi lời chào ngay nhé!',
    time: '1 giờ trước',
    read: false,
  },
  {
    id: '4',
    icon: '📍',
    color: '#FEF6E4',
    title: 'Chia sẻ vị trí',
    body: 'Giờ đây bạn có thể gửi vị trí hiện tại bằng nút 📍 trong cuộc trò chuyện.',
    time: 'Hôm qua',
    read: true,
  },
  {
    id: '5',
    icon: '🔒',
    color: '#F3E8FF',
    title: 'Bảo mật tài khoản',
    body: 'Đăng nhập mới được ghi nhận trên thiết bị của bạn.',
    time: '2 ngày trước',
    read: true,
  },
  {
    id: '6',
    icon: '🎉',
    color: '#FCE7F3',
    title: 'Cập nhật ứng dụng',
    body: 'Phiên bản mới với giao diện được làm mới và tin nhắn thời gian thực.',
    time: '3 ngày trước',
    read: true,
  },
];

export default function NotificationsScreen() {
  const [items, setItems] = useState(SAMPLE);
  const unreadCount = items.filter(i => !i.read).length;

  const markRead = (id: string) =>
    setItems(list => list.map(i => (i.id === id ? {...i, read: true} : i)));
  const markAllRead = () => setItems(list => list.map(i => ({...i, read: true})));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Thông báo</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã xem hết thông báo'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAll} onPress={markAllRead}>
            <Text style={styles.markAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={{paddingBottom: 24, flexGrow: 1}}
        ListEmptyComponent={<EmptyState emoji="🔕" title="Không có thông báo" />}
        renderItem={({item}) => (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => markRead(item.id)}
            style={[styles.card, !item.read && styles.cardUnread]}>
            <View style={[styles.iconWrap, {backgroundColor: item.color}]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={{flex: 1, marginLeft: 14}}>
              <View style={styles.cardTop}>
                <Text style={[styles.cardTitle, !item.read && {fontWeight: '800'}]} numberOfLines={1}>
                  {item.title}
                </Text>
                {!item.read && <View style={styles.dot} />}
              </View>
              <Text style={styles.cardBody} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.cardTime}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {fontSize: 30, fontWeight: '800', color: colors.text},
  subtitle: {fontSize: 14, color: colors.textMuted, marginTop: 2},
  markAll: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  markAllText: {color: colors.primary, fontWeight: '700', fontSize: 13},
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 20,
    opacity: 0.85,
  },
  cardUnread: {opacity: 1, ...shadow, shadowOpacity: 0.06},
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {fontSize: 22},
  cardTop: {flexDirection: 'row', alignItems: 'center'},
  cardTitle: {flex: 1, fontSize: 15.5, fontWeight: '600', color: colors.text},
  dot: {width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent, marginLeft: 8},
  cardBody: {fontSize: 13.5, color: colors.textSoft, marginTop: 4, lineHeight: 19},
  cardTime: {fontSize: 12, color: colors.textMuted, marginTop: 6},
});

