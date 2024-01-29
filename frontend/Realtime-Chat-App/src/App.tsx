import React, { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AnimatePresence } from "framer-motion";
import "./App.css";

import Chat from "./pages/Chat";
import ChatsList from "./pages/ChatsList";
import Login from "./pages/Login";
import { AuthProvider } from "./store/auth-context";
import { SocketContext, socket } from "./store/socket-context";

import { ErrorBoundary } from "react-error-boundary";

function App() {
  return (
    <div className="App">
      {/* <ErrorBoundary FallbackComponent={errorHandler}> */}
      <AnimatePresence>
        <SocketContext.Provider value={socket}>
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/chats" />} />

            <Route path="/chats" element={<ChatsList />} />

            <Route path="chats/:userId" element={<Chat />} />
          </Routes>
        </SocketContext.Provider>
      </AnimatePresence>
      {/* </ErrorBoundary> */}
    </div>
  );
}

export default App;
