import React from 'react';
import styles from './DummyFriend.module.css';

function DummyFriend() {
  return (
    <div className={styles.container}>
      <img className={`${styles['profile-img']} skeleton`} />
      <div className={styles['contact-box']}>
        <div
          className={`${styles['contact-name']} skeleton skeleton-title`}
        ></div>
        <div
          className={`${styles['last-message-preview']}  skeleton skeleton-text`}
        ></div>
      </div>
    </div>
  );
}

export default DummyFriend;
