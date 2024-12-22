import React from 'react';
import '../App.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo"><a href="/">StreamFeed</a></div>
      <ul className="navbar-links">
        {/* <li><a href="/">Home</a></li> */}
        {/* <li><a href="/chat">Chat</a></li>
        <li><a href="/dashboard">Dashboard</a></li> */}
        <li><a href="/research">Research</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;
