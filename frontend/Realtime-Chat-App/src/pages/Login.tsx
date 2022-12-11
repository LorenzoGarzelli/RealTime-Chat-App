import React from 'react';
import LoginForm from '../components/LoginForm/LoginForm';
import useUser from '../hooks/use-user';

const Home = () => {
  useUser({ redirectIfFound: true, redirectTo: '/' });
  return (
    <>
      <LoginForm />
    </>
  );
};
export default Home;
