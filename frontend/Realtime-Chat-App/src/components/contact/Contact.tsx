import classes from './Contact.module.css';

const Contact = () => {
  return (
    <div className={classes.container}>
      <img
        src="./../../../public/user.png"
        alt=""
        className={classes['profile-img']}
      />
      <div className={classes['contact-box']}>
        <h2 className={classes['contact-name']}>Contact</h2>
        <span className={classes['last-message-intro']}>
          Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum
        </span>
      </div>

      <span className={classes['last-message-timestamp']}>12:23</span>
    </div>
  );
};

export default Contact;
