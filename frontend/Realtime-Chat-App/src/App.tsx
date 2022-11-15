import { Route, Routes } from 'react-router-dom';
import './App.css';
import Chat from './pages/Chat';
import ChatsList from './pages/ChatsList';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<ChatsList />} />
        <Route path="chat/:userId" element={<Chat />} />
      </Routes>
    </div>
  );
}

export default App;
