import { useState } from 'react';
import reactLogo from './assets/react.svg';
import './App.css';
import ContactList from './components/contactList/ContactList';

function App() {
  return (
    <div className="App">
      <ContactList />
    </div>
  );
}

export default App;
