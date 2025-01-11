import React from 'react'
import { Link, NavLink,useNavigate ,useLocation} from 'react-router-dom';
import { Button } from '../button';
import { userSignOutAccount } from '@/lib/react-query/queriesAndMutations';
import { useUserContext } from '@/context/AuthContext';
import { useEffect } from 'react';
import { INavLink } from '@/types';
import { sidebarLinks } from '@/constants';

const LeftSidebar = () => {
  const {pathname} = useLocation();
  const { mutate: signOut, isSuccess } = userSignOutAccount();
  const navigate = useNavigate();
  const { user } = useUserContext();

  useEffect(() => {
    if (isSuccess)  navigate(0);
    
  }, [isSuccess])

  return (
    <nav className='leftsidebar'>
      <div className='flex flex-col gap-11'>
      <Link to="/" className="flex gap-3 items-center">
         <img
          src="/assets/images/logo.svg"
          alt="logo"
          width={170}
          height={36}
         />
        </Link>

        <Link to={'/profile/${user.id}'} className="flex gap-3 items-centre">
        <img
        src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
        alt="profile"
        className="h-14 w-14 rounded-full"
        />
        <div className="flex dlex-col">
          <p className='body-bold'>
            {user.name}
            </p>
        </div>
        <p className='small-regular text-light-3'>
          @{user.username}
        </p>
        </Link>
        <ul className='flex flex-col gap-6'>
          {sidebarLinks.map((link: INavLink) => {
            const isActive = pathname === link.route;
            return (
                <li key={link.route} className={`leftSidebar-link group ${isActive ? 'bg-primary-500' : ''}`}>
              <NavLink
                to={link.route}
                className='flex gap-4 items-center p-4 group hover:bg-primary-500'
              >
                <img
                  src={link.imgURL}
                  alt={link.label}
                  className={`group-hover:invert-white ${isActive && 'invert-white'}`}
                />
                {link.label}
              </NavLink>
              </li>
            )
          })}
        </ul>
      </div>   
      <div className="mt-6">
        <Button variant="ghost"
          className="shad-button__ghost" 
          onClick={() => signOut()}>
          <img src="/assets/icons/logout.svg" 
        alt="logout" />
          <p className='small-medium lg:base-medium'>Logout</p>
        </Button>
      </div>  
    </nav>
  )
}

export default LeftSidebar;
