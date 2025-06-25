import React, {useState} from 'react';
import {Link, useMatch, useResolvedPath, useNavigate} from "react-router-dom"
import './NavBar.css';

export default function NavBar() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('userEmail');
        navigate('/');
    };

    return (
        <nav className="nav">
            <div className="title-block">
                <Link to="/home" className="site-title">
                    ThriftTags
                </Link>
            </div>
            <div className={`menu-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
                <div className={`hamburger ${isMenuOpen ? 'active' : ''}`}></div>
                <div className={`hamburger ${isMenuOpen ? 'active' : ''}`}></div>
                <div className={`hamburger ${isMenuOpen ? 'active' : ''}`}></div>
            </div>
            <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                <CustomLink to="/events">Events</CustomLink>
                <CustomLink to="/friends">Friends</CustomLink>
                <CustomLink to="/add-review">Add Review</CustomLink>
                <CustomLink to="/reviews">Reviews</CustomLink>
                <CustomLink to="/profile">Profile</CustomLink>
                <li>
                    <button className="logout-button" onClick={handleLogout}>Logout</button>
                </li>
            </ul>
        </nav>
    )
}

function CustomLink({to, children, ...props}){
    const resolvedPath = useResolvedPath(to)
    const isActive = useMatch({path: resolvedPath.pathname, end:true})
    return(
        <li className={isActive ? "active" : ""}>
            <Link to={to}{...props}>
                {children}
            </Link>
        </li>
    )
}
