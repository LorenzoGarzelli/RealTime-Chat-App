import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AnimatePresence } from "framer-motion";
import "./App.css";

import Chat from "./pages/Chat";
import ChatsList from "./pages/ChatsList";
import Login from "./pages/Login";
import { SocketContext, socket } from "./store/socket-context";

import { ErrorBoundary } from "react-error-boundary";

function App() {
  return (
    <div className="App">
      <ErrorBoundary fallback={<p>Something went wrong</p>}>
        <AnimatePresence>
          <SocketContext.Provider value={socket}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/chats" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/chats" element={<ChatsList />} />
              <Route path="chats/:userId" element={<Chat />} />
            </Routes>
          </SocketContext.Provider>
        </AnimatePresence>
      </ErrorBoundary>
    </div>
  );
}

export default App;
