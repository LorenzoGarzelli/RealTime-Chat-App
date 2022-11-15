import styles from './UserBadge.module.css';

const UserBadge = () => {
  return (
    <>
      <div className={styles.container}>
        <img
          src="./../../../user.png"
          alt=""
          className={styles['profile-img']}
        />

        <div className={styles.details}>
          <h2 className={styles['contact-name']}>Contact</h2>
          <span className={styles.status}>last seen 3 hours ago</span>
        </div>
      </div>
    </>
  );
};

export default UserBadge;
