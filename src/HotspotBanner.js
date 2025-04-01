import React, { useState, useEffect } from "react";
import { API_BASE } from "./config";

function HotspotBanner() {
  const [hotspots, setHotspots] = useState([]);
  const [index, setIndex] = useState(0);

  // 🚀 載入熱門景點資料
  useEffect(() => {
    fetch(`${API_BASE}/api/hotspots`)  
      .then((res) => res.json())
      .then((data) => {
        console.log("🔥 熱門景點資料：", data);  // ← 這裡加
        setHotspots(data);
        setIndex(0);  // 初始顯示第一筆
      })
      .catch((err) => {
        console.error("無法載入熱門景點：", err);
      });
  }, []);

  // 🔁 每 10 秒輪播下一則
  useEffect(() => {
    if (hotspots.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % hotspots.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [hotspots]);

  if (hotspots.length === 0) return null;

  const current = hotspots[index];

  console.log("目前 index:", index);
  console.log("目前顯示的景點資料：", hotspots[index]);
//   return (
//     <div style={{
//       backgroundColor: "red",
//       padding: "20px",
//       color: "white",
//       position: "relative",
//       zIndex: 999
//     }}>
//       <a href={current.url} target="_blank" rel="noopener noreferrer">
//         📍 [{current.city}] 熱門景點：{current.title}
//       </a>
//     </div>
//   );
  return (
    <div style={{
      backgroundColor: "#F5E8DC",
      padding: "12px 16px",
      textAlign: "center",
      fontSize: "1rem",
      borderBottom: "1px solid #E2C8C7",
      borderTop: "1px solid #E2C8C7"
    }}>
      <a
        href={current.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "#333" }}
      >
        📍 [{current.city}] 推薦：{current.title}
      </a>
    </div>
  );
}

export default HotspotBanner;
