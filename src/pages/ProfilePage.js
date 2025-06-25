import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import { useNavigate } from 'react-router-dom';
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

const ProfilePage = () => {
    const navigate = useNavigate();

    const [userData, setUserData] = useState({
        username: "",
        email: "",
        joinDate: "",
        bio: "",
        location: "",
        favorites: [],
        reviews: 0,
        friends: 0,
        events: 0,
        userEvents: 0,
        avatar: null
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editedBio, setEditedBio] = useState("");
    const [editedLocation, setEditedLocation] = useState("");
    const [editedFavorites, setEditedFavorites] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const email = sessionStorage.getItem('userEmail');
                if (!email) return;

                // Fetch user data
                const userDoc = await getDoc(doc(db, "users", email));
                
                // Fetch review count
                const reviewsQuery = query(
                    collection(db, "reviews"),
                    where("userEmail", "==", email)
                );
                const reviewsSnapshot = await getDocs(reviewsQuery);
                const reviewCount = reviewsSnapshot.size;

                // Fetch friend count
                let friendCount = 0;

                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  const friends = userData.friends || [];
                  friendCount = friends.length;
                }
 
                // FIX: Query the events collection instead of reviews
                const eventsQuery = query(
                    collection(db, "events"), 
                    where("userEmail", "==", email)
                );
                const eventsSnapshot = await getDocs(eventsQuery);
                const eventCount = eventsSnapshot.size;

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData({
                        username: data.username,
                        email: data.email,
                        joinDate: new Date(data.createdAt).toLocaleDateString(),
                        bio: data.bio || "",
                        location: data.location || "",
                        favorites: data.favorites || [],
                        reviews: reviewCount, // Use actual review count
                        friends: friendCount,
                        events: eventCount, // Use actual event count from events collection
                        avatar: data.avatar || null
                    });

                    setEditedBio(data.bio || "");
                    setEditedLocation(data.location || "");
                    setEditedFavorites(data.favorites || []);
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };

        fetchUserData();
    }, []);

    const handleSaveProfile = async () => {
        const email = sessionStorage.getItem('userEmail');
        if (!email) return;

        try {
            await updateDoc(doc(db, "users", email), {
                bio: editedBio,
                location: editedLocation,
                favorites: editedFavorites,
                avatar: userData.avatar || null
            });

            setUserData(prev => ({
                ...prev,
                bio: editedBio,
                location: editedLocation,
                favorites: editedFavorites
            }));

            setIsEditing(false);
            alert("Profile updated!");
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to save changes.");
        }
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserData(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleReviewsClick = () => {
        navigate('/reviews');
    };

    const handleFriendsClick = () => {
        navigate('/friends');
    }

    const handleEventsClick = () => {
        navigate('/events');
    }

    const handleFavoriteChange = (index, value) => {
        const updated = [...editedFavorites];
        updated[index] = value;
        setEditedFavorites(updated);
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-avatar">
                    {userData.avatar ? (
                        <img src={userData.avatar} alt="Profile" className="avatar-image" />
                    ) : (
                        <div className="avatar-circle">
                            {userData.username ? userData.username.charAt(0) : "?"}
                        </div>
                    )}
                    <label className="avatar-upload">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                        />
                        Change Photo
                    </label>
                </div>
                <div className="profile-info">
                    <h1>{userData.username}</h1>
                    <p>{userData.email}</p>
                    <div className="profile-stats">
                        <div className="stat-item" onClick={handleReviewsClick} style={{ cursor: 'pointer' }}>
                            <span className="stat-number">{userData.reviews}</span>
                            <span className="stat-label">Reviews</span>
                        </div>
                        <div className="stat-item" onClick={handleFriendsClick} style={{ cursor: 'pointer' }}>
                            <span className="stat-number">{userData.friends}</span>
                            <span className="stat-label">Friends</span>
                        </div>
                        <div className="stat-item" onClick={handleEventsClick} style={{ cursor: 'pointer' }}>
                            <span className="stat-number">{userData.events}</span>
                            <span className="stat-label">Events</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-details">
                {/* Bio */}
                <div className="bio-section">
                    <p><strong>Bio:</strong></p>
                    {isEditing ? (
                        <textarea
                            value={editedBio}
                            onChange={(e) => setEditedBio(e.target.value)}
                            className="bio-edit"
                        />
                    ) : (
                        <span>{userData.bio}</span>
                    )}
                </div>

                {/* Location */}
                <div className="user-details">
                    <p><strong>Location:</strong> {!isEditing && <span>{userData.location}</span>}</p>
                    {isEditing && (
                        <textarea
                            value={editedLocation}
                            onChange={(e) => setEditedLocation(e.target.value)}
                            className="location-edit"
                        />
                    )}
                    <p><strong>Member since:</strong> {userData.joinDate}</p>
                </div>

                {/* Favorites */}
                <div className="favorites-section">
                    <h3>Favorite Categories</h3>
                    {isEditing ? (
                        <div className="favorites-editing">
                            {editedFavorites.map((fav, idx) => (
                                <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                                    <input
                                        type="text"
                                        value={fav}
                                        onChange={(e) => handleFavoriteChange(idx, e.target.value)}
                                        placeholder="Enter a category"
                                        className="favorite-input"
                                        style={{
                                            flex: "1",
                                            padding: "6px 10px",
                                            borderRadius: "8px",
                                            border: "1px solid #ccc",
                                            backgroundColor: "#f9f9f9",
                                            marginRight: "10px"
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const updated = editedFavorites.filter((_, i) => i !== idx);
                                            setEditedFavorites(updated);
                                        }}
                                        style={{
                                            backgroundColor: "transparent",
                                            border: "none",
                                            color: "red",
                                            fontSize: "16px",
                                            cursor: "pointer"
                                        }}
                                        title="Remove"
                                    >
                                        ❌
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setEditedFavorites([...editedFavorites, ""])}
                                style={{
                                    marginTop: "10px",
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    backgroundColor: "#4a6cf7",
                                    color: "white",
                                    border: "none",
                                    cursor: "pointer"
                                }}
                            >
                                + Add Category
                            </button>
                        </div>
                    ) : (
                        <div className="favorites-tags" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {userData.favorites.length === 0 ? (
                                <p style={{ fontStyle: "italic", color: "#777" }}>No categories yet</p>
                            ) : (
                                userData.favorites.map((fav, idx) => (
                                    <span key={idx} className="favorite-tag" style={{
                                        backgroundColor: "#e0e0e0",
                                        padding: "5px 10px",
                                        borderRadius: "20px",
                                        fontSize: "14px"
                                    }}>
                                        {fav}
                                    </span>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit/Save Button */}
            <div className="edit-save-button-container" style={{ textAlign: "center", marginTop: "20px" }}>
                {isEditing ? (
                    <button onClick={handleSaveProfile} className="save-button" style={{
                        padding: "10px 20px",
                        backgroundColor: "#4a6cf7",
                        color: "white",
                        border: "none",
                        borderRadius: "20px",
                        cursor: "pointer",
                        fontSize: "16px"
                    }}>
                        Save
                    </button>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="edit-button" style={{
                        padding: "10px 20px",
                        backgroundColor: "#aaa",
                        color: "white",
                        border: "none",
                        borderRadius: "20px",
                        cursor: "pointer",
                        fontSize: "16px"
                    }}>
                        Edit
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;