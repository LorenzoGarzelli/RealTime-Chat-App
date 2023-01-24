import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { AnimatePresence } from 'framer-motion';
import './App.css';

import Chat from './pages/Chat';
import ChatsList from './pages/ChatsList';
// const ChatsList = React.lazy(() => import('./pages/ChatsList'));
import Login from './pages/Login';
import { AuthProvider } from './store/auth-context';
import RequireAuth from './util/RequireAuth';
import { SocketContext, socket } from './store/socket-context';
import useIndexDB from './hooks/use-indexDB';
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  // const location = useLocation();

  // const errorHandler = (error: any) => {
  //   console.log(error);
  //   return <h1>ERRORE</h1>;
  // };
  // console.log(location.pathname);
  //TODO Hidden chats page on navigation (for caching it)
  return (
    <div className="App">
      {/* <ErrorBoundary FallbackComponent={errorHandler}> */}
      <AnimatePresence>
        {/* <AuthProvider> */}
        <SocketContext.Provider value={socket}>
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/chats" />} />

            <Route
              path="/chats"
              element={
                // <RequireAuth>
                <ChatsList />
                // </RequireAuth>
              }
            />

            <Route path="chats/:userId" element={<Chat />} />
          </Routes>
        </SocketContext.Provider>
        {/* </AuthProvider> */}
      </AnimatePresence>
      {/* </ErrorBoundary> */}
    </div>
  );
}

export default App;
