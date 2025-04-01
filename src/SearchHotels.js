import React, { useState } from "react";
import axios from "axios";
import { API_BASE } from "./config";

function SearchHotels() {
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [results, setResults] = useState([]);

  const search = async () => {
    const response = await axios.get(
      `${API_BASE}/search_hotels?location=${location}&budget=${budget}`
    );
    setResults(response.data.results);
  };

  return (
    <div>
      <h2>找住宿</h2>
      <input type="text" placeholder="輸入地點" onChange={(e) => setLocation(e.target.value)} />
      <select onChange={(e) => setBudget(e.target.value)}>
        <option value="">選擇預算</option>
        <option value="low">💰 便宜</option>
        <option value="medium">💲 中等</option>
        <option value="high">💎 高級</option>
      </select>
      <button onClick={search}>搜尋</button>

      <ul>
        {results.map((r, index) => (
          <li key={index}>{r.name} - {r.rating} ⭐</li>
        ))}
      </ul>
    </div>
  );
}

export default SearchHotels;
