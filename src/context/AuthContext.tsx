import React, {createContext, useContext, useEffect, useState} from 'react';
import {User} from 'firebase/auth';
import {startPresence, subscribeAuth, subscribeUser} from '../services';
import {AppUser} from '../types';

interface AuthContextValue {
  user: User | null;
  profile: AppUser | null;
  initializing: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  initializing: true,
});

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Theo dõi trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = subscribeAuth(u => {
      setUser(u);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  // Khi đã đăng nhập: bật presence + lắng nghe hồ sơ. Cleanup khi đăng xuất.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    const stopPresence = startPresence(user.uid);
    const unsubscribeProfile = subscribeUser(user.uid, setProfile);
    return () => {
      stopPresence();
      unsubscribeProfile();
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{user, profile, initializing}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

