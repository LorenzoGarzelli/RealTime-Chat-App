import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { AnimatePresence } from 'framer-motion';
import './App.css';
import Chat from './pages/Chat';
import ChatsList from './pages/ChatsList';
import Login from './pages/Login';
import { AuthProvider } from './store/auth-context';
import RequireAuth from './components/util/RequireAuth';

function App() {
  const location = useLocation();
  return (
    <div className="App">
      <AnimatePresence>
        {/* <AuthProvider> */}
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
        {/* </AuthProvider> */}
      </AnimatePresence>
    </div>
  );
}

export default App;
