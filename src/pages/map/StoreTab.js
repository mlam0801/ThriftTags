import React, {useEffect, useState} from "react";
import {db} from "../../firebase";
import {collection, doc, getDoc, getDocs} from 'firebase/firestore';
import {APIProvider, Map, AdvancedMarker, Pin, InfoWindow, MapCameraChangedEvent} from "@vis.gl/react-google-maps";
import "./StoreTab.css";

export default function StoreTab({ selectedStoreId, selectedStore, stores }) {
    const [isStoreTabOpen, setIsStoreTabOpen] = useState(false);

    const toggleStoreTab = () => {
        setIsStoreTabOpen(!isStoreTabOpen);
    };

    const fetchStores = async () => {
        try {
            const storesCollection = collection(db, "stores");
            const storeSnapshot = await getDocs(storesCollection);
            const storeList = storeSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error fetching stores: ", error);
        }
    };

    useEffect(() => {
        if (selectedStoreId) {
            setIsStoreTabOpen(true);
        }
    }, [selectedStoreId]);

    useEffect(() => {
        fetchStores();
    }, []);

    return (
        <div className={`store-tab-container ${isStoreTabOpen ? 'open' : ''}`}>
            <button className="store-tab-toggle-button" onClick={toggleStoreTab}>
                {isStoreTabOpen ? '❮' : '❯'}
            </button>

            <div className="store-header">
                <h3>{selectedStore ? "Store Details" : "Stores"}</h3>
            </div>
            <div className="store-content">
                {selectedStore ? (
                    <div className="individual-store" key={selectedStore.id}>
                        <div className="image-container">
                            <img
                                src={process.env.PUBLIC_URL + selectedStore["imgLink"]}
                                alt="Thrift Store"
                            />
                        </div>
                        <div className="store-info">
                            <h4>{selectedStore["Business Name"]}</h4>
                            <p><strong>Rating:</strong> {selectedStore["Rating"]}</p>
                            <p><strong>Address:</strong> {selectedStore["Address"]}</p>
                            {selectedStore["Phone"] && <p><strong>Phone:</strong> {selectedStore["Phone"]}</p>}
                            {selectedStore["Email"] && <p><strong>Email:</strong> {selectedStore["Email"]}</p>}
                            {selectedStore["Reviews"] && <p><strong>Reviews:</strong> {selectedStore["Reviews"]}</p>}
                        </div>
                    </div>
                ) : stores.length > 0 ? (
                    stores.map((store) => (
                        <div key={store.id} className="individual-store">
                            <div className="image-container">
                                <img
                                    src={process.env.PUBLIC_URL + store["imgLink"]}
                                    alt="Thrift Store"
                                />
                            </div>
                            <div className="store-info">
                                <h4>{store["Business Name"]}</h4>
                                <p><strong>Rating:</strong> {store["Rating"]}</p>
                                <p><strong>Address:</strong> {store["Address"]}</p>
                                {store["Phone"] && <p><strong>Phone:</strong> {store["Phone"]}</p>}
                                {store["Email"] && <p><strong>Email:</strong> {store["Email"]}</p>}
                                {store["Reviews"] && <p><strong>Reviews:</strong> {store["Reviews"]}</p>}
                            </div>
                        </div>
                    ))
                ) : (
                    <div>No stores available.</div>
                )}
            </div>
        </div>
    );
}