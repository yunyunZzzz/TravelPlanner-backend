import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "./config";

function SearchRestaurants() {
  const [location, setLocation] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  }, []);

  const search = async () => {
    if (!location) {
      alert("正在取得位置，請稍候...");
      return;
    }

    setLoading(true);
    //把經緯度傳給後端
    try { 
      const response = await axios.get(
        `${API_BASE}/search_restaurants?lat=${location.lat}&lng=${location.lng}`
      );
      setRestaurants(response.data.results);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  // 價位轉換（1-4 -> $-$$$$）
  const formatPriceLevel = (priceLevel) => {
    return priceLevel !== "N/A" ? "$".repeat(priceLevel) : "無價位資訊";
  };
  const formatDistance = (distanceMeters) => {
    if (!distanceMeters) return "未知距離";
    return (distanceMeters / 1000).toFixed(2) + " km";
  };


  return (
    <div style={{ padding: "20px" }}>
      <h2> Nearby Restaurants</h2>
      <button
        onClick={search}
        disabled={loading}
        style={{
          padding: "10px 15px",
          backgroundColor: "#D9BEAF",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        {loading ? "搜尋中..." : "Search"}
      </button>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        {restaurants.map((r, index) => (
          <div
            key={index}
            style={{
              width: "300px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)",
              backgroundColor: "#FFF5EB",
            }}
          >
            {/* 餐廳圖片 */}
            {r.photo ? (
              <img
                src={r.photo}
                alt={r.name}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "180px",
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                }}
              >
                📷 無照片
              </div>
            )}

            <h3>{r.name}</h3>
            <p>⭐ 評分: {r.rating} | 💰 價位: {formatPriceLevel(r.price_level)}</p>
            <p>📍 地址: {r.address}</p>
            <p> 距離: {formatDistance(r.distance_meters)}</p> {/* 新增距離顯示 */}

            <h4>評論：</h4>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "5px",
                padding: "10px",
                backgroundColor: "#f9f9f9",
              }}
            >
              {r.reviews.length > 0 ? (
                r.reviews.map((review, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "5px 0",
                      borderBottom: i < r.reviews.length - 1 ? "1px solid #ccc" : "none",
                    }}
                  >
                    {review}
                  </div>
                ))
              ) : (
                <p>沒有評論</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchRestaurants;
