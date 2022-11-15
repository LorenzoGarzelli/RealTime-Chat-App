import Contact from '../contact/Contact';
import classes from './ContactList.module.css';
import { Link } from 'react-router-dom';
const ContactList = () => {
  return (
    <div className={classes.container}>
      <ul className={classes['user-list']}>
        <li>
          <Link to="/chat/:userId">
            <Contact />
          </Link>
          <Link to="/chat/:userId">
            <Contact />
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default ContactList;
