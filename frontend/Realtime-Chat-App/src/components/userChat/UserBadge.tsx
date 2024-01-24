import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DBController, User } from '../../util/db';

import styles from './UserBadge.module.css';

const UserBadge = () => {
  const { userId } = useParams();

  const [name, setName] = useState('');

  useEffect(() => {
    const getUserData = async () => {
      //await (async () => await DBController.db.open())();
      if (userId) {
        const friend = await DBController.getFriendById(userId!);
        setName(friend.name);
      }
    };
    getUserData();
  }, []);
  return (
    <>
      <div className={styles.container}>
        <img
          src="./../../../user.png"
          alt=""
          className={styles['profile-img']}
        />

        <div className={styles.details}>
          <h2 className={styles['contact-name']}>{name}</h2>
          <span className={styles.status}>last seen 3 hours ago</span>
        </div>
      </div>
    </>
  );
};

export default UserBadge;
