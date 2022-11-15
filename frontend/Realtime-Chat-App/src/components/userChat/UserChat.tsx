import { useParams, Link } from 'react-router-dom';
import UserBadge from './UserBadge';
import styles from './UserChat.module.css';
const UserChat = () => {
  //TODO IMPLEMENT index DB
  const params = useParams();
  return (
    <div>
      <div className={styles['header']}>
        <Link to="/">
          <i className="back-btn uil uil-angle-left-b"></i>
        </Link>
        <UserBadge />
      </div>
      <main></main>
    </div>
  );
};

export default UserChat;
