from flask import Flask, jsonify, request
from flask_cors import CORS
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import requests
import random
import json
import time
import os
# from dotenv import load_dotenv
# load_dotenv()



random.seed(time.time())

app = Flask(__name__)
CORS(app)  # 只允許來自 http://localhost:3000 的請求

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

###########

CACHE_FILE = "hotspots.json"
CACHE_LIFETIME = timedelta(hours=24)

def crawl_yam_hotspots():
    city_urls = {
        "台北": "https://travel.yam.com/info/%E5%8F%B0%E5%8C%97%E6%99%AF%E9%BB%9E/",
        "新北": "https://travel.yam.com/info/%E6%96%B0%E5%8C%97%E6%99%AF%E9%BB%9E/"
    }

    hotspots = []

    for city, url in city_urls.items():
        res = requests.get(url)
        soup = BeautifulSoup(res.text, "html.parser")

        for a in soup.select("div.article_list_box_info h2 a")[:5]:
            title = a.get_text(strip=True)
            link = "https://travel.yam.com" + a["href"]
            hotspots.append({
                "city": city,
                "title": title,
                "url": link
            })

    # 更新快取
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump({
            "updated_at": datetime.now().isoformat(),
            "data": hotspots
        }, f, ensure_ascii=False, indent=2)

    return hotspots
    


@app.route("/api/hotspots", methods=["GET"])
def get_hotspots():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, encoding="utf-8") as f:
            cache = json.load(f)
            updated_at = datetime.fromisoformat(cache["updated_at"])
            if datetime.now() - updated_at < CACHE_LIFETIME:
                # 如果還沒過期就直接回傳快取
                return jsonify(cache["data"])

    # 如果沒有快取或過期，就重新爬
    try:
        data = crawl_yam_hotspots()
        return jsonify(data)
    except Exception as e:
        print(f"爬蟲失敗：{e}")
        # 若爬失敗，但快取存在，也可回傳舊資料
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, encoding="utf-8") as f:
                cache = json.load(f)
                return jsonify(cache["data"])
        else:
            return jsonify([]), 500



###########

# 模擬「吃什麼」的 API
@app.route('/search_restaurants', methods=['GET'])
def search_restaurants():
    lat = request.args.get('lat') #從網址拿到經緯度
    lng = request.args.get('lng')

    if not lat or not lng:
        return jsonify({"error": "Missing latitude or longitude"}), 400

    # 請求Google Places API 搜尋附近餐廳
    places_url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius=1000&type=restaurant&language=zh-TW&key={GOOGLE_API_KEY}"
    places_response = requests.get(places_url)
    places_data = places_response.json()

    # 從api回傳資料提取有用的資訊
    restaurants = []
    destination_coords = []  # 用來存放所有餐廳的座標
    for place in places_data.get("results", []):
        place_id = place.get("place_id")
        name = place.get("name")
        rating = place.get("rating", "N/A")
        price_level = place.get("price_level", "N/A")
        address = place.get("vicinity", "N/A")

        # 獲取餐廳座標
        restaurant_lat = place["geometry"]["location"]["lat"]
        restaurant_lng = place["geometry"]["location"]["lng"]
        destination_coords.append(f"{restaurant_lat},{restaurant_lng}")

        # 獲取餐廳照片
        photo_reference = None
        if "photos" in place:
            photo_reference = place["photos"][0]["photo_reference"]
        photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={GOOGLE_API_KEY}" if photo_reference else None

        # 獲取評論
        details_url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=name,rating,price_level,reviews&language=zh-TW&key={GOOGLE_API_KEY}"
        details_response = requests.get(details_url)
        details_data = details_response.json()

        reviews = []
        if "result" in details_data and "reviews" in details_data["result"]:
            for review in details_data["result"]["reviews"][:3]:  # 取前三則評論
                text = review.get("text", "沒有評論")
                reviews.append(text[:50] + "...")  # 讓評論最多顯示 50 字，避免過長

        restaurants.append({
            "name": name,
            "rating": rating,
            "price_level": price_level,
            "address": address,
            "photo": photo_url,
            "reviews": reviews,
            "lat": restaurant_lat,
            "lng": restaurant_lng,
        })

    if destination_coords:
        distance_url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={lat},{lng}&destinations={'|'.join(destination_coords)}&mode=walking&language=zh-TW&key={GOOGLE_API_KEY}"
        distance_response = requests.get(distance_url)
        distance_data = distance_response.json()

        if "rows" in distance_data and len(distance_data["rows"]) > 0:
            elements = distance_data["rows"][0].get("elements", [])
            for i, element in enumerate(elements):
                if "distance" in element:
                    restaurants[i]["distance_meters"] = element["distance"]["value"]
                    restaurants[i]["distance_text"] = element["distance"]["text"]
                else:
                    restaurants[i]["distance_meters"] = None
                    restaurants[i]["distance_text"] = "未知距離"
    
    restaurants.sort(key=lambda x: x["distance_meters"])

    return jsonify({"results": restaurants})




# 模擬「玩什麼」的 API
@app.route('/search_places', methods=['GET'])
def search_places():
    city = request.args.get('city')
    style = request.args.get('style')
    current_lat = request.args.get('current_lat')  # 當前位置的經緯度
    current_lng = request.args.get('current_lng')  
    
    try:
        google_results = search_google_places(city, style)
        filtered_results = filter_places(google_results, current_lat, current_lng)
        return jsonify(filtered_results)
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    #tripadvisor_results = search_tripadvisor_places(city, style)
    
def search_google_places(city, style):
    query = f"{city} {style} 景點"
    url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={query}&language=zh-TW&key={GOOGLE_API_KEY}"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Google Places API returned an error: {response.status_code}")
    
    return response.json()


def filter_places(google_results, current_lat, current_lng): #改成只回傳五個景點！！！
    next_page_token = google_results.get("next_page_token")
    if next_page_token:
        print("yes")
    results = google_results.get("results", [])
    print(f"Total results fetched: {len(results)}")
    if not results:
        raise Exception("No results found from Google Places.")
    # 過濾評分小於 3.0 的景點
    filtered_places = [place for place in results if place.get("rating", 0) >= 3.0]
    num_places = len(filtered_places)
    print(f"Filtered places count: {num_places}")
    
    # 隨機選擇 100 個符合條件的景點
    random_places = random.sample(filtered_places, min(100, len(filtered_places)))

    filtered_places2 = []
    destination_coords = []  # 用來存放景點的座標

    for place in random_places:
        place_lat = place.get("geometry", {}).get("location", {}).get("lat")
        place_lng = place.get("geometry", {}).get("location", {}).get("lng") 
        destination_coords.append(f"{place_lat},{place_lng}")

        photo_reference = None
        if "photos" in place:
            photo_reference = place["photos"][0]["photo_reference"]

        # 若有圖片參照，生成圖片 URL
        if photo_reference:
            place_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={GOOGLE_API_KEY}"
        else:
            place_url = None  # 若無圖片參照，設為 None

        filtered_places2.append({
            "name": place.get("name", ""),
            "rating": place.get("rating", "N/A"),
            "review_count": place.get("user_ratings_total", 0),
            "address": place.get("formatted_address", "N/A"),
            "photo": place_url,
            "lat": place_lat,
            "lng": place_lng
        })
    
    if destination_coords:
        distance_url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={current_lat},{current_lng}&destinations={'|'.join(destination_coords)}&mode=walking&language=zh-TW&key={GOOGLE_API_KEY}"
        distance_response = requests.get(distance_url)
        distance_data = distance_response.json()

        if "rows" in distance_data and len(distance_data["rows"]) > 0:
            elements = distance_data["rows"][0].get("elements", [])
            for i, element in enumerate(elements):
                if "distance" in element:
                    filtered_places2[i]["distance_meters"] = element["distance"]["value"]
                    filtered_places2[i]["distance_text"] = element["distance"]["text"]
                else:
                    filtered_places2[i]["distance_meters"] = None
                    filtered_places2[i]["distance_text"] = "未知距離"
    
    def calculate_score(place, max_review_count):
        rating_weight = 0.7
        review_count_weight = 0.3
        rating = place.get("rating", 0)
        review_count = place.get("review_count", 0)

        # 避免除以零
        normalized_review_count = (review_count / max_review_count) if max_review_count > 0 else 0

        return (rating * rating_weight) + (normalized_review_count * review_count_weight)

    # 確保 filtered_places2 不為空
    if filtered_places2:
        # 取得最大評論數，避免 sort() 內部對全域變數的依賴
        max_review_count = max((p.get("review_count", 0) for p in filtered_places2), default=1)
        # 根據加權分數排序
        filtered_places2.sort(key=lambda p: calculate_score(p, max_review_count), reverse=True)

    percentage = 0.7  # 選擇前 70% 的景點
    top_percent_places = filtered_places2[:int(len(filtered_places2) * percentage)]

    # 隨機選擇 5 個景點
    random_places2 = random.sample(top_percent_places, min(5, len(top_percent_places)))



        
    return random_places2


@app.route('/search_restaurants_fortrip', methods=['GET'])
def search_restaurants_fortrip():
    lat = request.args.get('lat') #random出的景點的經緯度
    lng = request.args.get('lng')
    food_type = request.args.get('food_type')
    current_lat = request.args.get('current_lat')  # 當前位置的經緯度
    current_lng = request.args.get('current_lng')  
    google_restaurants = search_google_restaurants(lat, lng, food_type)
    filtered_restaurants = filter_restaurants(google_restaurants, lat, lng, current_lat, current_lng)
    # tripadvisor_restaurants = search_tripadvisor_restaurants(lat, lng)

    return jsonify(filtered_restaurants)

def search_google_restaurants(lat, lng, food_type):
    base_url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius=2000&type=restaurant&language=zh-TW&key={GOOGLE_API_KEY}"
    if food_type:
        base_url+="&keyword={food_type}"
    response = requests.get(base_url)
    return response.json()


# 過濾低評價餐廳（只有google）, 去掉重複的餐廳
def filter_restaurants(google_restaurants, lat, lng, current_lat, current_lng, rating_threshold=4.0):
    filtered_restaurants = []
    destination_coords = []  # 用來存放所有餐廳的座標
    for restaurant in google_restaurants.get("results", []):
        if restaurant.get("rating", 0) >= rating_threshold:  
            restaurant_id = restaurant.get("place_id")
            restaurant_lat = restaurant.get("geometry", {}).get("location", {}).get("lat")
            restaurant_lng = restaurant.get("geometry", {}).get("location", {}).get("lng") 
            destination_coords.append(f"{restaurant_lat},{restaurant_lng}")  # 記錄座標

            #獲取圖片
            photo_reference = None
            if restaurant.get("photos"):
                photo_reference = restaurant["photos"][0].get("photo_reference", None)

            # 然後你可以使用 photo_reference
            photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={GOOGLE_API_KEY}" if photo_reference else None
            
            # 獲取評論
            details_url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={restaurant_id}&fields=name,rating,price_level,reviews&language=zh-TW&key={GOOGLE_API_KEY}"
            details_response = requests.get(details_url)
            details_data = details_response.json()

            reviews = []
            if "result" in details_data and "reviews" in details_data["result"]:
                for review in details_data["result"]["reviews"][:3]:  # 取前三則評論
                    text = review.get("text", "沒有評論")
                    reviews.append(text[:50] + "...")  # 讓評論最多顯示 50 字，避免過長
            
            filtered_restaurants.append({
                "name": restaurant.get("name", ""),
                "rating": restaurant.get("rating", "N/A"),
                "address": restaurant.get("vicinity", "N/A"),
                "photo": photo_url,
                "price_level": restaurant.get("price_level", "N/A"),
                "lat": restaurant_lat,
                "lng": restaurant_lng,
                "reviews": reviews,
            })

    if destination_coords:
        distance_url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={current_lat},{current_lng}&destinations={'|'.join(destination_coords)}&mode=walking&language=zh-TW&key={GOOGLE_API_KEY}"
        distance_response = requests.get(distance_url)
        distance_data = distance_response.json()

        if "rows" in distance_data and len(distance_data["rows"]) > 0:
            elements = distance_data["rows"][0].get("elements", [])
            for i, element in enumerate(elements):
                if "distance" in element:
                    filtered_restaurants[i]["distance_meters"] = element["distance"]["value"]
                    filtered_restaurants[i]["distance_text"] = element["distance"]["text"]
                else:
                    filtered_restaurants[i]["distance_meters"] = None
                    filtered_restaurants[i]["distance_text"] = "未知距離"
    return filtered_restaurants

@app.route('/search_nearby_place', methods=['GET'])
def search_nearby_place():
    lat = request.args.get('lat') #拿到使用者滿意的景點的經緯度
    lng = request.args.get('lng')
    current_lat = request.args.get('current_lat')  # 當前位置的經緯度
    current_lng = request.args.get('current_lng')  


    if not lat or not lng:
        return jsonify({"error": "Missing latitude or longitude"}), 400

    # 請求Google Places API 搜尋附近景點
    in_outdoor_places_url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius=2000&type=point_of_interest&language=zh-TW&key={GOOGLE_API_KEY}"
 
    in_outdoor_response = requests.get(in_outdoor_places_url).json()

    # 從api回傳資料提取有用的資訊
    places = []
    destination_coords = []  
    for place in in_outdoor_response.get("results", []):
        rating = place.get("rating", "N/A")
        if rating > 3.0:
            place_id = place.get("place_id")
            name = place.get("name")
            address = place.get("vicinity", "N/A")

            # 獲取nearby的景點的座標
            place_lat = place["geometry"]["location"]["lat"]
            place_lng = place["geometry"]["location"]["lng"]
            destination_coords.append(f"{place_lat},{place_lng}")

            # 獲取景點照片
            photo_reference = None
            if "photos" in place:
                photo_reference = place["photos"][0]["photo_reference"]
            photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={GOOGLE_API_KEY}" if photo_reference else None


            places.append({
                "name": name,
                "rating": rating,
                "address": address,
                "photo": photo_url,
                "lat": place_lat,
                "lng": place_lng,
            })

    if destination_coords:
        distance_url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={current_lat},{current_lng}&destinations={'|'.join(destination_coords)}&mode=walking&language=zh-TW&key={GOOGLE_API_KEY}"
        distance_response = requests.get(distance_url)
        distance_data = distance_response.json()

        if "rows" in distance_data and len(distance_data["rows"]) > 0:
            elements = distance_data["rows"][0].get("elements", [])
            for i, element in enumerate(elements):
                if "distance" in element:
                    places[i]["distance_meters"] = element["distance"]["value"]
                    places[i]["distance_text"] = element["distance"]["text"]
                else:
                    places[i]["distance_meters"] = None
                    places[i]["distance_text"] = "未知距離"
    

    return jsonify({"results": places})












# 模擬「住什麼」的 API
@app.route('/search_hotels', methods=['GET'])
def search_hotels():
    budget = request.args.get('budget', 'all')  # 可選的預算
    location = request.args.get('location', 'all')  # 可選的地點

    fake_hotels = [
        {"name": "豪華大飯店", "budget": "高", "location": "台北"},
        {"name": "商務旅館", "budget": "中", "location": "高雄"},
        {"name": "背包客棧", "budget": "低", "location": "台中"},
        {"name": "商務大飯店", "budget": "中", "location": "台北"},
        {"name": "高雄溫泉酒店", "budget": "高", "location": "高雄"}
    ]

    # 根據預算和地點篩選
    result = [h for h in fake_hotels 
              if (budget == 'all' or h["budget"] == budget) and 
                 (location == 'all' or h["location"] == location)]

    return jsonify(results=result)

# 啟動 Flask 伺服器
if __name__ == '__main__':
    app.run(port=5001, debug=True)
