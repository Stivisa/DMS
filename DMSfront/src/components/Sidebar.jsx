import React from "react";
import { Link } from "react-router-dom";
import {
  AiOutlineTags ,
  AiOutlineSetting ,
} from "react-icons/ai";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { TbCategory } from "react-icons/tb";
import { IoDocumentsOutline  } from "react-icons/io5";
import { MdOutlineDelete} from "react-icons/md";
import { useSelector } from "react-redux";
import { SlPeople } from "react-icons/sl";


const Sidebar = ({ activeLink, setActiveLink }) => {
  const user = useSelector((state) => state.user.currentUser);
  const companyName = useSelector((state) => state.company?.currentCompany?.name);
  const isAdmin = user && user.isAdmin;
  const superAdmin = user.superAdmin;

  const handleDocumentClick = (event, to) => {
    if(to === '/document' && !companyName) {
      alert('Niste izabrali firmu!');
      event.preventDefault();
    }
    setActiveLink(to);
  };

  const handleRecycleBinClick = (event, to) => {
    if(to === '/recyclebin' && !companyName) {
      alert('Niste izabrali firmu!');
      event.preventDefault();
    }
    setActiveLink(to);
  };

  const handleLinkClick = (to) => {
    setActiveLink(to);
  };
    return (
        <div className="bg-white w-32 h-full border shadow">       
            <ul className="flex flex-col p-0 overflow-y-auto">                 
                <NavLink 
                    to="/document" 
                    icon={<IoDocumentsOutline  size={35} />} 
                    text="Dokumenti" 
                    isActive={activeLink === '/document'} 
                    onClick={(event) => handleDocumentClick(event,'/document')}
                />
                <NavLink 
                    to="/categories" 
                    icon={<TbCategory size={35} />} 
                    text="Kategorije" 
                    isActive={activeLink === '/categories'} 
                    onClick={() => handleLinkClick('/categories')}
                />          
                <NavLink 
                    to="/tags" 
                    icon={<AiOutlineTags size={35} />} 
                    text="Tagovi" 
                    isActive={activeLink === '/tags'} 
                    onClick={() => handleLinkClick('/tags')}
                />
                <NavLink 
                    to="/clients" 
                    icon={<HiOutlineBuildingOffice2 size={35} />} 
                    text="Komitenti" 
                    isActive={activeLink === '/clients'} 
                    onClick={() => handleLinkClick('/clients')}
                />          
                <NavLink 
                    to="/recyclebin" 
                    icon={<MdOutlineDelete  size={35} />} 
                    text="Obrisani dokumenti" 
                    isActive={activeLink === '/recyclebin'} 
                    onClick={(event) => handleRecycleBinClick(event, '/recyclebin')}
                />
                {isAdmin && (
                    <NavLink 
                    to="/users" 
                    icon={<SlPeople size={35} />} 
                    text="Korisnici" 
                    isActive={activeLink === '/users'} 
                    onClick={() => handleLinkClick('/users')}
                    />
                )}
                {superAdmin && (
                    <NavLink 
                    to="/settings" 
                    icon={<AiOutlineSetting size={35} />} 
                    text="Podešavanja" 
                    isActive={activeLink === '/settings'} 
                    onClick={() => handleLinkClick('/settings')}
                    />
                )}
                {/*
                <NavLink 
                    to="/help" 
                    icon={<MdHelpOutline  size={35} />} 
                    text="Pomoć" 
                    isActive={activeLink === '/help'} 
                    onClick={() => handleLinkClick('/help')}
                />
                */}
            </ul>
        </div>
    )
}

const NavLink = ({ to, icon, text, isActive, onClick }) => {
    return (
      <Link to={to} onClick={onClick}>
        <li className={`py-1 flex flex-col items-center ${isActive ? 'text-teal-400' : 'text-color'}`}>
          <div className={`hover:bg-gray-200 rounded-full p-2`}>
            {icon}
          </div>
          <span className="flex-1 text-center">
          {text}
        </span>
        </li>
      </Link>
    );
  };

export default Sidebar;