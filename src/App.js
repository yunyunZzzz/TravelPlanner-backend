import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./NaviBar";
import SearchRestaurants from "./SearchRestaurants";
import TripPlanner from "./SearchAttractions";
import HotspotBanner from "./HotspotBanner";


//css
const homeStyle = {
  textAlign: "center",
  marginTop: "100px", // 避免被 Navbar 擋住
};

const titleStyle = {
  fontSize: "48px", // 讓標題更大
  fontWeight: "bold",
  color: "#DFBED2", // 顏色可調整
  textShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)", // 增加立體感
};

const subtitleStyle = {
  fontSize: "20px",
  color: "#555",
  marginTop: "10px",
};

//

function Home() {
  return (
    <div style={homeStyle}>
      <h1 style={titleStyle}>旅遊規劃助手</h1>
      <p style={subtitleStyle}>讓我們一起探索美食、景點與住宿，打造完美旅行！</p>
    </div>
  );
}


function Stay() {
  return <h1 style={{ marginTop: "80px", textAlign: "center" }}>🏨 住什麼</h1>;
}

function App() {
  return (
    // <Provider>
      <Router>
        <Navbar />
        <div style={{
          position: "sticky",
          top: "50px", 
          zIndex: 1000
        }}>
          <HotspotBanner />
        </div>
        <div style={{ paddingTop: "60px", color: "#DFBED2"}}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/eat" element={<SearchRestaurants />} />
            <Route path="/play" element={<TripPlanner />} />
            <Route path="/stay" element={<Stay />} />
          </Routes>
        </div>
      </Router>
    // </Provider>    
  );
}

export default App;


