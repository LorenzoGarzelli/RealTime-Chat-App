import Contact from '../contact/Contact';
import classes from './ContactList.module.css';

const ContactList = () => {
  return (
    <div className={classes.container}>
      <ul className={classes['user-list']}>
        <li>
          <Contact />
        </li>
      </ul>
    </div>
  );
};

export default ContactList;
