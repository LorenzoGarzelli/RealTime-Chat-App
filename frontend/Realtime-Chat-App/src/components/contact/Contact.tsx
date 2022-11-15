import React from 'react';
import classes from './Contact.module.css';

const Contact: React.FC<{}> = props => {
  return (
    <div className={classes.container}>
      <img
        src="./../../../user.png"
        alt=""
        className={classes['profile-img']}
      />
      <div className={classes['contact-box']}>
        <h2 className={classes['contact-name']}>Contact</h2>
        <span className={classes['last-message-preview']}>
          Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum
        </span>
      </div>

      <span className={classes['last-message-timestamp']}>12:23</span>
    </div>
  );
};

export default Contact;
