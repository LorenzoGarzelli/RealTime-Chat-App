import React from 'react';
import { Socket } from 'socket.io-client';
import classes from './Friend.module.css';

const Friend: React.FC<{ name: string }> = props => {
  return (
    <div className={classes.container}>
      <img
        src="./../../../user.png"
        alt=""
        className={`${classes['profile-img']} skeleton`}
      />
      <div className={classes['contact-box']}>
        <h2 className={classes['contact-name'] + 'skeleton'}>{props.name}</h2>
        <span className={classes['last-message-preview']}>
          Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum
        </span>
      </div>
      <span className={classes['last-message-timestamp']}>12:23</span>
    </div>
  );
};

export default Friend;
