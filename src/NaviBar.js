import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "flex-start",
        padding: "15px 20px",
        backgroundColor: "#ECD4D3",
        color: "#66503C",
        position: "fixed",
        zIndex: 9999,
        width: "100%",
        top: 0,
        left: 0,
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Link to="/" style={linkStyle}> Travel Planner</Link>
      <Link to="/eat" style={linkStyle}> EAT</Link>
      <Link to="/play" style={linkStyle}> DO</Link>
      <Link to="/stay" style={linkStyle}> STAY</Link>
    </nav>
  );
}

const linkStyle = {
  color: "#66503C",
  textDecoration: "none",
  marginRight: "20px",
  fontSize: "18px",
  fontWeight: "bold",
};

export default Navbar;
