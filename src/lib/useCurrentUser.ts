import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { AppUser } from '../types';

export interface CurrentUser {
  authUser: User | null | undefined; // undefined = loading
  profile: AppUser | null | undefined; // undefined = loading, null = no profile doc yet
}

export function useCurrentUser(): CurrentUser {
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<AppUser | null | undefined>(undefined);

  useEffect(() => onAuthStateChanged(auth, setAuthUser), []);

  useEffect(() => {
    if (authUser === undefined) return;
    if (authUser === null) {
      setProfile(null);
      return;
    }
    setProfile(undefined);
    return onSnapshot(doc(db, 'users', authUser.uid), (snap) => {
      setProfile(snap.exists() ? ({ uid: snap.id, ...snap.data() } as AppUser) : null);
    });
  }, [authUser]);

  return { authUser, profile };
}
