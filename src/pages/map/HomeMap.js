import React, {useEffect, useState} from "react";
import "./HomeMap.css";
import {db} from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import NavBar from "../NavBar";
import StoreTab from "./StoreTab";

function getDistanceInMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function FilterPanel({ filters, setFilters }) {
  const handleRatingChange = (e) => {
    setFilters((prev) => ({ ...prev, minRating: parseFloat(e.target.value) }));
  };

  const handleRadiusChange = (e) => {
    setFilters((prev) => ({ ...prev, radius: parseFloat(e.target.value) }));
  };

  return (
    <div className="filter-panel">
      <h3>Filter Stores</h3>
      <label>
        Minimum Rating:
        <select value={filters.minRating} onChange={handleRatingChange}>
          <option value={0}>All</option>
          <option value={4.5}>4.5+</option>
          <option value={4.0}>4.0+</option>
          <option value={3.5}>3.5+</option>
        </select>
      </label>
      <br /><br />
      <label>
        Radius (miles):
        <select value={filters.radius} onChange={handleRadiusChange}>
          <option value={9999}>All</option>
          <option value={1}>1 mile</option>
          <option value={5}>5 miles</option>
          <option value={10}>10 miles</option>
          <option value={25}>25 miles</option>
        </select>
      </label>
    </div>
  );
}

export default function HomeMap() {
    const [userPosition, setUserPosition] = useState({ lat: 39.9526, lng: -75.1652});
    const [mapLoaded, setMapLoaded] = useState(false);
    const [activeStoreId, setActiveStoreId] = useState(null);
    const [stores, setStores] = useState([]);
    const [filters, setFilters] = useState({ minRating: 0, radius: 9999 });
    

    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setUserPosition(userPos);
                },
                () => {
                    setUserPosition({ lat: 39.9526, lng: -75.1652});
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
            setUserPosition({ lat: 39.9526, lng: -75.1652});
        }
    };

    const fetchStores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "stores"));
        const storeData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const filteredStores = stores.filter((store) => store.Rating >= filters.minRating);
          const rawLat = data.Latitude?.trim?.();
          const rawLng = data.Longitude?.trim?.();
          const lat = parseFloat(rawLat);
          const lng = parseFloat(rawLng);

          if (isNaN(lat) || isNaN(lng)) {
            console.warn("Skipping store with invalid coordinates:", data);
            return null;
          }

          return {
            id: doc.id,
            ...data,
            lat,
            lng,
          };
        });

        const validStores = storeData.filter(Boolean);
        console.log("Valid stores:", validStores);
        setStores(validStores);
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    };

    useEffect(() => {
        getUserLocation();
        fetchStores();
    }, []);
    

    const ratingFilteredStores = stores.filter((store) => store.Rating >= filters.minRating);
    
    const filteredStores = ratingFilteredStores.filter((store) => {
      const distance = getDistanceInMiles(
        userPosition.lat,
        userPosition.lng,
        store.lat,
        store.lng
      );
      return distance <= filters.radius;
    });

    const handleMarkerClick = (storeId) => {
      setActiveStoreId(storeId);
      const element = document.getElementById(`store-${storeId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    return (
        <div className="home-map-container">
            <div className="city-title">
                <h2>Philadelphia</h2>
                <p>PA</p>
            </div>

            <div className="content-container">
                <FilterPanel filters={filters} setFilters={setFilters} />
                <StoreTab
                    selectedStoreId={activeStoreId}
                    selectedStore={stores.find((store) => store.id === activeStoreId)}
                    stores={filteredStores}
                />

                <div className="map-container">
                    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                        <Map zoom={12} defaultCenter={userPosition} className="google-map"
                             mapId={process.env.REACT_APP_GOOGLE_MAPS_MAP_ID} onLoad={() => setMapLoaded(true)}>
                            <AdvancedMarker
                                position={userPosition}
                                title="Your Location">
                              <Pin background="#3366cc" borderColor="#003399" glyphColor="white" />
                            </AdvancedMarker>
                            {filteredStores.map((store) => (
                                <AdvancedMarker
                                    key={store.id}
                                    position={{ lat: store.lat, lng: store.lng }}
                                    title={store["Business Name"]}
                                    onClick={() =>
                                        setActiveStoreId((prev) => (prev === store.id ? null : store.id))
                                    }
                                >
                                    <Pin />
                                </AdvancedMarker>
                            ))}
                            {filteredStores.map((store) => {
                              if (activeStoreId === store.id) {
                                return (
                                  <InfoWindow
                                    key={`info-${store.id}`}
                                    position={{ lat: store.lat, lng: store.lng }}
                                    onCloseClick={() => setActiveStoreId(null)}
                                  >
                                    <div>{store["Business Name"]}</div>
                                  </InfoWindow>
                                );
                              }
                              return null;
                            })}
                            <InfoWindow position={userPosition}>
                                <div>Your Current Location</div>
                            </InfoWindow>
                        </Map>
                    </APIProvider>
                    {mapLoaded && (
                        <button
                            className="current-location-btn" onClick={getUserLocation}>
                            Pan to Current Location
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}