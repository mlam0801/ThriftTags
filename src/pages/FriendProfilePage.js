import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import './FriendProfilePage.css';


const FriendProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const friendEmail = location.state?.email || "";

  const [friendData, setFriendData] = useState({
    username: "",
    email: "",
    joinDate: "",
    bio: "",
    location: "",
    favorites: [],
    reviews: 0,
    friends: 0,
    avatar: null
  });

  const handleReviewsClick = () => {
    navigate('/reviews', { state: { email: friendEmail } })
  };

  const handleFriendsClick = () => {
    navigate('/friend-friends', { state: { email: friendEmail, username: friendData.username } })
  };

  useEffect(() => {
    const fetchFriendData = async () => {
      if (!friendEmail) return;
      try {
        // Fetch friend document from Firestore
        const userDoc = await getDoc(doc(db, "users", friendEmail));
        // Count number of reviews by this user
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("userEmail", "==", friendEmail)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewCount = reviewsSnapshot.size;
        // Count number of friends from friend list
        let friendCount = 0;
        if (userDoc.exists()) {
          const data = userDoc.data();
          const friendsList = data.friends || [];
          friendCount = friendsList.length;
          // Set state with friend profile data
          setFriendData({
            username: data.username,
            email: data.email,
            joinDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "",
            bio: data.bio || "",
            location: data.location || "",
            favorites: data.favorites || [],
            reviews: reviewCount,
            friends: friendCount,
            avatar: data.avatar || null
          });
        }
      } catch (error) {
        console.error("Error fetching friend data:", error);
      }
    };

    fetchFriendData();
  }, [friendEmail]);

  return (
    <div className="profile-container">
      {/* Profile header with avatar and basic info */}
      <div className="profile-header">
        <div className="profile-avatar">
          {friendData.avatar ? (
            <img 
              src={friendData.avatar} 
              alt={`${friendData.username}'s avatar`} 
              className="avatar-image" 
            />
          ) : (
            <div className="avatar-circle">
              {friendData.username ? friendData.username.charAt(0).toUpperCase() : "?"}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h1>{friendData.username}</h1>
          <p>{friendData.email}</p>
          <div className="profile-stats">
            <div className="stat-item" onClick={handleReviewsClick} style={{ cursor: 'pointer' }}>
              <span className="stat-number">{friendData.reviews}</span>
              <span className="stat-label">Reviews</span>
            </div>
            <div className="stat-item" onClick={handleFriendsClick} style={{ cursor: 'pointer' }}>
              <span className="stat-number">{friendData.friends}</span>
              <span className="stat-label">Friends</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile details: Bio, Location, Join Date, Favorites */}
      <div className="profile-details">
        <div className="bio-section">
          <p><strong>Bio:</strong></p>
          <span>{friendData.bio}</span>
        </div>
        <div className="user-details">
          <p><strong>Location:</strong> <span>{friendData.location}</span></p>
          <p><strong>Member since:</strong> {friendData.joinDate}</p>
        </div>
        <div className="favorites-section">
          <h3>Favorite Categories</h3>
          <div className="favorites-tags">
            {friendData.favorites.length === 0 ? (
              <p style={{ fontStyle: "italic", color: "#777" }}>No categories yet</p>
            ) : (
              friendData.favorites.map((fav, idx) => (
                <span key={idx} className="favorite-tag">{fav}</span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendProfilePage;
