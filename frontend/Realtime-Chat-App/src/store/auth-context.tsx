import React, { useEffect } from 'react';
import useUser from '../hooks/use-user';

interface AuthContextType {
  user: null;
  signin: (newUser: any) => void;
}

const AuthContext = React.createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  let [user, setUser] = React.useState<any>(null);
  const { currentUser, isLoggedIn, mutate } = useUser();

  // const { data } = useUser({ redirectTo: '/' });
  // useEffect(() => {
  // console.log(currentUser);
  // if (!user && !currentUser) setUser(currentUser);
  // }, [currentUser, mutate]);

  let signin = (newUser: any) => {
    setUser(newUser);
  };

  let value = { user, signin };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}
