import UserChat from '../components/userChat/UserChat';
import useUser from '../hooks/use-user';

const Chat = () => {
  const { currentUser: user, isLoggedIn } = useUser({ redirectTo: '/login' });

  return (
    <>
      <UserChat />
    </>
  );
};

export default Chat;
