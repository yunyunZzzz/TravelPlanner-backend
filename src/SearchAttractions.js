import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "./config";

//css
const dropdownStyle = {
    margin: "0 10px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
  };
  
const buttonStyle = {
    marginTop: "10px",
    padding: "10px 20px",
    backgroundColor: "#FFB7B2",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    transition: "all 0.3s",
};
const buttonHoverStyle = {
    backgroundColor: "#FF9AA2", // 深一點的粉紅
};


//css
  
const TripPlanner = () => {
    const [city, setCity] = useState("台北市");
    const [style, setStyle] = useState("室內");
    const [foodType, setFoodType] = useState("");
    const [itinerary, setItinerary] = useState(null);
    const [places, setPlaces] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [currLocation, setLocation] = useState(null);
    const [hover, setHover] = useState(false);

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

    const handleSearch = async () => {
        try {
            // 發送請求給後端，搜尋景點和餐廳資料
            const response = await axios.get(`${API_BASE}/search_places`, {
                params: { city, style, current_lat: currLocation.lat, current_lng: currLocation.lng } //當前經緯度
            });
            const placesData = response.data;

            setPlaces(placesData);

        } catch (error) {
            console.error("Error fetching itinerary", error);
        }
    };

    const handleSelectPlace = async (place) => {
        try {
            // 設定選中的景點
            setSelectedPlace(place);
    
            // 根據選中的景點搜尋餐廳
            const restaurantResponse = await axios.get(`${API_BASE}/search_restaurants_fortrip`, {
                params: { lat: place.lat, lng: place.lng, food_type: foodType.trim(), current_lat: currLocation.lat, current_lng: currLocation.lng }
            });
            const restaurantsData = restaurantResponse.data;
    
            // 隨機排序餐廳資料並選擇前三間
            const randomRestaurants = restaurantsData.sort(() => Math.random() - 0.5).slice(0, 3);
    
            // 更新行程資料
            setItinerary({ place, restaurants: randomRestaurants });
        } catch (error) {
            console.error("Error fetching restaurants", error);
        }
    };

    const handleAddNearbyPlace = async () => {
        if (selectedPlace) {
            try {
                // 根據當前景點的位置隨機選擇新的附近景點
                const response = await axios.get(`${API_BASE}/search_nearby_place`, {
                    params: { lat: selectedPlace.lat, lng: selectedPlace.lng, current_lat: currLocation.lat, current_lng: currLocation.lng}
                });
                const newPlacesData = response.data;
                // 隨機選擇一個新的景點
                const newPlace = newPlacesData[Math.floor(Math.random() * newPlacesData.length)];

                // // 查詢新選景點附近的餐廳
                // const restaurantResponse = await axios.get("/search_restaurants_fortrip", {
                //     params: { lat: newPlace.lat, lng: newPlace.lng }
                // });
                // const restaurantsData = restaurantResponse.data;

                // 更新行程，加入新的景點和餐廳
                setItinerary(prevState => ({
                    ...prevState,
                    additionalPlace: newPlace,
                }));
            } catch (error) {
                console.error("Error adding nearby place", error);
            }
        }
    };

    const formatPriceLevel = (priceLevel) => {
        return priceLevel !== "N/A" ? "$".repeat(priceLevel) : "無價位資訊";
      };
    const formatDistance = (distanceMeters) => {
        if (!distanceMeters) return "未知距離";
        return (distanceMeters / 1000).toFixed(2) + " km";
      };

    return (
        <div style={{
            maxWidth: "1040px",
            margin: "60px auto 0 auto", 
            padding: "40px 20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            fontFamily: "'Segoe UI'",
            backgroundColor: "rgba(253, 226, 228, 0.65)",
            backdropFilter: "blur(4px)"
        }}>
            <h1 style={{ textAlign: "center", color: "#66503C" }}>🌸 一日旅遊行程推薦</h1>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                {/* 城市選擇下拉選單 */}
                <select value={city} onChange={(e) => setCity(e.target.value)} style={dropdownStyle}>
                    <option value="台北市">台北市</option>
                    <option value="新北市">新北市</option>
                    <option value="基隆市">基隆市</option>
                </select>
                {/* 風格選擇下拉選單 */}
                <select value={style} onChange={(e) => setStyle(e.target.value)} style={dropdownStyle}>
                    <option value="室內">室內</option>
                    <option value="探險">探險</option>
                    <option value="大自然">大自然</option>
                </select>
                {/* 食物類型輸入框 */}
                <input
                    type="text"
                    value={foodType}  // 當前的食物類型值
                    onChange={(e) => setFoodType(e.target.value)}  // 更新食物類型
                    placeholder="輸入食物類型"
                    style={{ ...dropdownStyle, width: "200px" }}
                />

                {/* 產生行程的按鈕 */}
                <button onClick={handleSearch} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{...buttonStyle, ...(hover ? buttonHoverStyle : {})}}>產生行程</button>
            </div>

            {places && (
            <div style={{margin: "50px auto"}}>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "20px",
                        justifyContent: "center"
                    }}
                >
                    {/* 顯示五個隨機選擇的景點卡片 */}
                    {places.map((place, index) => (
                        <div
                            key={index}
                            style={{
                                width: "300px",
                                border: "1px solid #ddd",
                                borderRadius: "10px",
                                padding: "15px",
                                boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)",
                                backgroundColor: "#FFF5EB",
                                transition: "transform 0.2s",
                                cursor: "pointer"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                            onClick={() => handleSelectPlace(place)}
                        >
                            {/* 顯示景點的照片 */}
                            {place.photo ? (
                                <img
                                    src={place.photo}
                                    alt={place.name}
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
                            <h3>{place.name}</h3>
                            <p>⭐ 評分: {place.rating}</p> 
                            <p>📍 地址: {place.address}</p>
                            <p> 距離: {formatDistance(place.distance_meters)}</p> {/* 景點距離 */}
                        </div>
                    ))}
                </div>
                <button onClick={handleSearch} style={{display: "block", margin: "20px auto", padding: "10px 20px", backgroundColor: "#ECD4D3", color: "#66503C", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer"}}>重新推薦</button>
            </div>
            )}

            {itinerary && (
            <div>
                <h2>推薦行程</h2>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "20px",
                    }}
                >
                    {/* 顯示景點卡片 */}
                    <div
                        style={{
                            width: "300px",
                            border: "1px solid #ddd",
                            borderRadius: "10px",
                            padding: "15px",
                            boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)",
                            backgroundColor: "#FFF5EB",
                            transition: "transform 0.2s",
                            cursor: "pointer"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                        {/* 顯示景點的照片 */}
                        {itinerary.place.photo ? (
                            <img
                                src={itinerary.place.photo}
                                alt={itinerary.place.name}
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
                        <h3>{itinerary.place.name}</h3>
                        <p>⭐ 評分: {itinerary.place.rating}</p>
                        <p>📍 地址: {itinerary.place.address}</p>
                        <p> 距離: {formatDistance(itinerary.place.distance_meters)}</p> {/* 景點距離 */}

                    </div>
                    
                    {/* 顯示餐廳卡片 */}
                    {itinerary.restaurants.map((r, index) => (
                        <div
                            key={index}
                            style={{
                                width: "300px",
                                border: "1px solid #ddd",
                                borderRadius: "10px",
                                padding: "15px",
                                boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)",
                                backgroundColor: "#FFF5EB",
                                transition: "transform 0.2s",
                                cursor: "pointer"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
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
                            <p>距離: {formatDistance(r.distance_meters)}</p>

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

                    {itinerary.additionalPlace && (
                        <div
                            style={{
                                width: "300px",
                                border: "1px solid #ddd",
                                borderRadius: "10px",
                                padding: "15px",
                                boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)",
                                backgroundColor: "#E3F4F4", // 讓新增的景點有點不同的背景
                            }}
                        >
                            {/* 顯示新增景點的照片 */}
                            {itinerary.additionalPlace.photo ? (
                                <img
                                    src={itinerary.additionalPlace.photo}
                                    alt={itinerary.additionalPlace.name}
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
                            <h3>{itinerary.additionalPlace.name}</h3>
                            <p>⭐ 評分: {itinerary.additionalPlace.rating}</p>
                            <p>📍 地址: {itinerary.additionalPlace.address}</p>
                            <p>距離: {formatDistance(itinerary.additionalPlace.distance_meters)}</p>
                        </div>
                    )}

                </div>
                <button onClick={handleAddNearbyPlace} style={{display: "block", margin: "20px auto", padding: "10px 20px", backgroundColor: "#ECD4D3", color: "#66503C", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer"}}>新增附近景點</button>
            </div>
        )}

        </div>
    );
};

export default TripPlanner;
