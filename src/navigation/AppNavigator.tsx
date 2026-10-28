import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {useAuth} from '../context/AuthContext';
import {subscribeUserChats} from '../services';
import {colors} from '../theme/colors';
import {MainTabParamList, RootStackParamList} from '../types';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ContactsScreen from '../screens/ContactsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Home: '💬',
  Contacts: '👥',
  Notifications: '🔔',
  Settings: '⚙️',
};

function TabIcon({name, focused}: {name: keyof MainTabParamList; focused: boolean}) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.tabEmoji, !focused && styles.tabEmojiInactive]}>
        {TAB_ICONS[name]}
      </Text>
    </View>
  );
}

function MainTabs() {
  const {user} = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);

  // Tổng số tin chưa đọc hiển thị ở badge tab "Đoạn chat"
  useEffect(() => {
    if (!user) {
      return;
    }
    const unsubscribe = subscribeUserChats(user.uid, chats =>
      setTotalUnread(chats.reduce((sum, c) => sum + (c.unread || 0), 0)),
    );
    return unsubscribe;
  }, [user]);

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({focused}) => <TabIcon name={route.name} focused={focused} />,
        tabBarBadgeStyle: styles.badge,
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Đoạn chat',
          tabBarBadge:
            totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined,
        }}
      />
      <Tab.Screen name="Contacts" component={ContactsScreen} options={{title: 'Danh bạ'}} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{title: 'Thông báo'}}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{title: 'Cài đặt'}} />
    </Tab.Navigator>
  );
}

function Splash() {
  return (
    <View style={styles.splash}>
      <View style={styles.splashLogo}>
        <Text style={styles.splashEmoji}>💬</Text>
      </View>
      <ActivityIndicator color={colors.primary} style={{marginTop: 24}} />
    </View>
  );
}

export default function AppNavigator() {
  const {user, initializing} = useAuth();

  if (initializing) {
    return <Splash />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {backgroundColor: colors.surface},
          headerTintColor: colors.text,
          contentStyle: {backgroundColor: colors.bg},
          animation: 'slide_from_right',
        }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{headerShown: false}} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{headerShown: false}} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{headerShown: false}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 68,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 0,
    backgroundColor: colors.surface,
    shadowColor: '#1F2340',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  tabLabel: {fontSize: 11, fontWeight: '600'},
  tabIcon: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {backgroundColor: colors.primarySoft},
  tabEmoji: {fontSize: 18},
  tabEmojiInactive: {opacity: 0.45},
  badge: {
    backgroundColor: colors.accent,
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashEmoji: {fontSize: 40},
});

