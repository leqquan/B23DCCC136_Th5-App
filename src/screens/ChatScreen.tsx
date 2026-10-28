import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import Avatar from '../components/Avatar';
import {useAuth} from '../context/AuthContext';
import {
  getChatId,
  getCurrentPosition,
  markAsRead,
  openInGoogleMaps,
  requestLocationPermission,
  sendLocationMessage,
  sendTextMessage,
  subscribeMessages,
  subscribeStatus,
} from '../services';
import {colors, shadow} from '../theme/colors';
import {AppUser, Message, RootStackParamList, UserStatus} from '../types';
import {formatDayLabel, formatPresence, formatTime, isSameDay} from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

type Row =
  | {kind: 'day'; id: string; label: string}
  | {kind: 'msg'; id: string; msg: Message; isMine: boolean; isFirst: boolean; isLast: boolean};

const GROUP_GAP = 3 * 60 * 1000; // tin cách nhau < 3 phút thì gộp nhóm

/* ---------- Thanh tiêu đề: tên + trạng thái ---------- */
function ChatHeaderTitle({user, status}: {user: AppUser; status: UserStatus | null}) {
  const isOnline = status?.state === 'online';
  return (
    <View style={styles.headerTitle}>
      <Avatar name={user.name} color={user.avatarColor} size={38} showStatus online={isOnline} />
      <View style={{marginLeft: 10, flexShrink: 1}}>
        <Text style={styles.headerName} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={[styles.headerStatus, isOnline && {color: colors.online}]} numberOfLines={1}>
          {formatPresence(status?.state, status?.lastChanged)}
        </Text>
      </View>
    </View>
  );
}

/* ---------- Bong bóng tin vị trí ---------- */
function LocationBubble({msg, isMine}: {msg: Message; isMine: boolean}) {
  const lat = msg.latitude ?? 0;
  const lng = msg.longitude ?? 0;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        openInGoogleMaps(lat, lng).catch(() =>
          Alert.alert('Không mở được bản đồ', 'Thiết bị chưa có ứng dụng bản đồ hoặc trình duyệt.'),
        )
      }
      style={[styles.locationCard, isMine ? styles.locationMine : styles.locationOther]}>
      {/* Bản đồ minh họa */}
      <View style={styles.mapPreview}>
        <View style={[styles.road, {top: 22, left: -20, width: 320, transform: [{rotate: '-12deg'}]}]} />
        <View style={[styles.road, {top: 70, left: -20, width: 320, transform: [{rotate: '8deg'}]}]} />
        <View style={[styles.road, styles.roadV, {left: 70}]} />
        <View style={[styles.road, styles.roadV, {left: 170, transform: [{rotate: '15deg'}]}]} />
        <View style={styles.park} />
        <View style={styles.water} />
        <View style={styles.pinWrap}>
          <View style={styles.pulse} />
          <Text style={styles.pin}>📍</Text>
        </View>
      </View>
      <View style={styles.locationInfo}>
        <Text style={[styles.locationTitle, isMine && {color: '#fff'}]}>Vị trí hiện tại</Text>
        <Text style={[styles.locationCoords, isMine && {color: 'rgba(255,255,255,0.8)'}]}>
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </Text>
        <View style={styles.locationFooter}>
          <Text style={[styles.locationLink, isMine && {color: '#fff'}]}>Mở Google Maps ›</Text>
          <Text style={[styles.time, isMine ? styles.timeMine : styles.timeOther]}>
            {formatTime(msg.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatScreen({route, navigation}: Props) {
  const {otherUser} = route.params;
  const {user} = useAuth();
  const myUid = user!.uid;
  const chatId = useMemo(() => getChatId(myUid, otherUser.uid), [myUid, otherUser.uid]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [locating, setLocating] = useState(false);
  const listRef = useRef<FlatList<Row>>(null);

  // 1. Lắng nghe tin nhắn realtime — hủy trong cleanup để không bị lặp tin
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeMessages(chatId, list => {
      setMessages(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [chatId]);

  // 2. Lắng nghe trạng thái online của người đang chat
  useEffect(() => {
    const unsubscribe = subscribeStatus(otherUser.uid, setStatus);
    return () => unsubscribe();
  }, [otherUser.uid]);

  // 3. Mở chat / có tin mới khi đang mở -> số chưa đọc về 0
  useEffect(() => {
    markAsRead(myUid, otherUser.uid).catch(() => {});
  }, [messages.length, myUid, otherUser.uid]);

  // 4. Cập nhật thanh tiêu đề
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <ChatHeaderTitle user={otherUser} status={status} />,
      headerBackTitle: '',
    });
  }, [navigation, otherUser, status]);

  // Dựng danh sách dòng (có phân cách ngày + gộp nhóm), đảo ngược cho FlatList inverted
  const rows = useMemo<Row[]>(() => {
    const result: Row[] = [];
    messages.forEach((m, i) => {
      const prev = messages[i - 1];
      const next = messages[i + 1];
      if (!prev || !isSameDay(prev.createdAt, m.createdAt)) {
        result.push({kind: 'day', id: `day-${m.id}`, label: formatDayLabel(m.createdAt)});
      }
      const sameAsPrev =
        !!prev &&
        prev.senderId === m.senderId &&
        isSameDay(prev.createdAt, m.createdAt) &&
        m.createdAt - prev.createdAt < GROUP_GAP;
      const sameAsNext =
        !!next &&
        next.senderId === m.senderId &&
        isSameDay(next.createdAt, m.createdAt) &&
        next.createdAt - m.createdAt < GROUP_GAP;
      result.push({
        kind: 'msg',
        id: m.id,
        msg: m,
        isMine: m.senderId === myUid,
        isFirst: !sameAsPrev,
        isLast: !sameAsNext,
      });
    });
    return result.reverse();
  }, [messages, myUid]);

  // Tự cuộn xuống tin mới nhất khi có tin mới
  useEffect(() => {
    if (rows.length) {
      listRef.current?.scrollToOffset({offset: 0, animated: true});
    }
  }, [rows.length]);

  const canSend = text.trim().length > 0;

  const handleSend = async () => {
    const content = text.trim();
    if (!content) {
      return; // không cho gửi tin rỗng
    }
    setText('');
    try {
      await sendTextMessage(myUid, otherUser.uid, content);
    } catch {
      setText(content);
      Alert.alert('Gửi thất bại', 'Không gửi được tin nhắn. Kiểm tra kết nối mạng và thử lại.');
    }
  };

  const handleSendLocation = async () => {
    if (locating) {
      return;
    }
    setLocating(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert(
          'Chưa có quyền vị trí',
          'Bạn đã từ chối quyền truy cập vị trí nên không thể gửi vị trí. Hãy bật lại quyền trong Cài đặt của máy.',
          [
            {text: 'Để sau', style: 'cancel'},
            {text: 'Mở Cài đặt', onPress: () => Linking.openSettings()},
          ],
        );
        return;
      }
      const {latitude, longitude} = await getCurrentPosition();
      await sendLocationMessage(myUid, otherUser.uid, latitude, longitude);
    } catch {
      Alert.alert('Không lấy được vị trí', 'Hãy bật GPS/Định vị trên thiết bị rồi thử lại.');
    } finally {
      setLocating(false);
    }
  };

  const renderRow = ({item}: {item: Row}) => {
    if (item.kind === 'day') {
      return (
        <View style={styles.dayWrap}>
          <Text style={styles.dayText}>{item.label}</Text>
        </View>
      );
    }
    const {msg, isMine, isFirst, isLast} = item;
    return (
      <View
        style={[
          styles.msgRow,
          isMine ? styles.msgRowMine : styles.msgRowOther,
          {marginTop: isFirst ? 10 : 2},
        ]}>
        {!isMine && (
          <View style={styles.msgAvatar}>
            {isLast && <Avatar name={otherUser.name} color={otherUser.avatarColor} size={28} />}
          </View>
        )}
        {msg.type === 'location' ? (
          <LocationBubble msg={msg} isMine={isMine} />
        ) : (
          <View
            style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleOther,
              // Gộp nhóm: góc phía người gửi bo nhỏ, tin cuối nhóm có "đuôi"
              isMine
                ? {borderTopRightRadius: isFirst ? 20 : 6, borderBottomRightRadius: isLast ? 4 : 6}
                : {borderTopLeftRadius: isFirst ? 20 : 6, borderBottomLeftRadius: isLast ? 4 : 6},
            ]}>
            <Text style={[styles.msgText, isMine && {color: '#fff'}]}>{msg.text}</Text>
            <Text style={[styles.time, isMine ? styles.timeMine : styles.timeOther]}>
              {formatTime(msg.createdAt)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.center}>
            <Avatar name={otherUser.name} color={otherUser.avatarColor} size={84} />
            <Text style={styles.introName}>{otherUser.name}</Text>
            <Text style={styles.introText}>
              Hãy gửi lời chào đầu tiên tới {otherUser.name.trim().split(/\s+/).pop()} 👋
            </Text>
            <TouchableOpacity
              style={styles.waveButton}
              onPress={() => sendTextMessage(myUid, otherUser.uid, 'Xin chào 👋').catch(() => {})}>
              <Text style={styles.waveText}>Gửi "Xin chào 👋"</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={rows}
            inverted
            keyExtractor={item => item.id}
            renderItem={renderRow}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Thanh nhập tin */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleSendLocation}
            disabled={locating}>
            {locating ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={styles.locationButtonText}>📍</Text>
            )}
          </TouchableOpacity>
          <View style={styles.inputWrap}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              multiline
              maxLength={2000}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.8}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32},
  headerTitle: {flexDirection: 'row', alignItems: 'center', maxWidth: 260},
  headerName: {fontSize: 16, fontWeight: '700', color: colors.text},
  headerStatus: {fontSize: 12, color: colors.textMuted, marginTop: 1},
  listContent: {paddingHorizontal: 12, paddingVertical: 12},
  dayWrap: {alignItems: 'center', marginVertical: 14},
  dayText: {
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: '#E9EBF5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
    fontWeight: '600',
  },
  msgRow: {flexDirection: 'row', alignItems: 'flex-end'},
  msgRowMine: {justifyContent: 'flex-end'},
  msgRowOther: {justifyContent: 'flex-start'},
  msgAvatar: {width: 28, marginRight: 8},
  bubble: {
    maxWidth: '76%',
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 7,
    borderRadius: 20,
  },
  bubbleMine: {backgroundColor: colors.bubbleMine},
  bubbleOther: {
    backgroundColor: colors.bubbleOther,
    shadowColor: '#1F2340',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  msgText: {fontSize: 15.5, color: colors.text, lineHeight: 21},
  time: {fontSize: 10.5, marginTop: 3, alignSelf: 'flex-end'},
  timeMine: {color: 'rgba(255,255,255,0.75)'},
  timeOther: {color: colors.textMuted},

  // Tin vị trí
  locationCard: {width: 240, borderRadius: 20, overflow: 'hidden'},
  locationMine: {backgroundColor: colors.primaryDark},
  locationOther: {backgroundColor: colors.surface, ...shadow, shadowOpacity: 0.06},
  mapPreview: {height: 110, backgroundColor: colors.mapGreen, overflow: 'hidden'},
  road: {position: 'absolute', height: 9, backgroundColor: colors.mapRoad, opacity: 0.95},
  roadV: {top: -20, width: 9, height: 160},
  park: {
    position: 'absolute',
    width: 60,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#BFE8CB',
    top: 34,
    left: 92,
  },
  water: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#C9E4F8',
    bottom: -40,
    right: -20,
  },
  pinWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,122,89,0.25)',
    marginTop: 18,
  },
  pin: {fontSize: 32, marginBottom: 12},
  locationInfo: {padding: 12},
  locationTitle: {fontSize: 15, fontWeight: '700', color: colors.text},
  locationCoords: {fontSize: 12.5, color: colors.textMuted, marginTop: 2},
  locationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  locationLink: {fontSize: 13, fontWeight: '700', color: colors.primary},

  // Màn hình trống
  introName: {fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 14},
  introText: {fontSize: 14.5, color: colors.textMuted, marginTop: 6, textAlign: 'center'},
  waveButton: {
    marginTop: 20,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  waveText: {color: colors.primary, fontWeight: '700'},

  // Thanh nhập
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadow,
    shadowOffset: {width: 0, height: -4},
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButtonText: {fontSize: 20},
  inputWrap: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: colors.bg,
    borderRadius: 22,
    paddingHorizontal: 16,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15.5,
    color: colors.text,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {backgroundColor: '#C7C9E0'},
  sendIcon: {color: '#fff', fontSize: 18, marginLeft: 3},
});
