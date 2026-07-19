import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return user;
}
