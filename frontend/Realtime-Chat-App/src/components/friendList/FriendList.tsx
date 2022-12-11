import Friend from '../friend/Friend';
import classes from './FriendList.module.css';
import { Link } from 'react-router-dom';

const FriendList = () => {
  return (
    <div className={classes.container}>
      <ul className={classes['user-list']}>
        <li>
          <Link to="/chats/:userId">
            <Friend />
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default FriendList;
