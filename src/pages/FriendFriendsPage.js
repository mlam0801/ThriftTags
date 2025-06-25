import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import './FriendFriendsPage.css';

const FriendFriendsPage = () => {
    const location = useLocation();
    const friendEmail = location.state?.email || "";
    const friendName = location.state?.username || "";
    const currentUserEmail = sessionStorage.getItem('userEmail');

    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myFriends, setMyFriends] = useState([]);
    const [sentRequests, setSentRequests] = useState(new Set());

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                if (!friendEmail) {
                    console.log("No friend email found");
                    setLoading(false);
                    return;
                }

                // Fetch current user's friends list
                if (currentUserEmail) {
                    const currentUserDoc = await getDoc(doc(db, "users", currentUserEmail));
                    if (currentUserDoc.exists()) {
                        const currentUserData = currentUserDoc.data();
                        setMyFriends(currentUserData.friends || []);
                    }
                }

                const userDoc = await getDoc(doc(db, "users", friendEmail));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const friendsList = userData.friends || [];
                    
                    // Fetch details for each friend
                    const friendsWithDetails = await Promise.all(
                        friendsList.map(async (friendEmail) => {
                            const friendDoc = await getDoc(doc(db, "users", friendEmail));
                            if (friendDoc.exists()) {
                                return {
                                    email: friendEmail,
                                    username: friendDoc.data().username,
                                    avatar: friendDoc.data().avatar
                                };
                            }
                            return null;
                        })
                    );

                    setFriends(friendsWithDetails.filter(Boolean));
                }
            } catch (error) {
                console.error("Error fetching friends:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFriends();
    }, [friendEmail, currentUserEmail]);

    const sendFriendRequest = async (toEmail) => {
        try {
            const toRef = doc(db, "users", toEmail);
            await updateDoc(toRef, {
                friendRequests: arrayUnion(currentUserEmail)
            });
            setSentRequests(prev => new Set([...prev, toEmail]));
        } catch (error) {
            console.error("Error sending friend request:", error);
        }
    };

    if (loading) {
        return <div className="friends-container">Loading...</div>;
    }

    const displayTitle = friendEmail 
        ? `${friendName || "This user"}'s Friends` 
        : "My Friends";

    const emptyMessage = friendEmail 
        ? `${friendName || "This user"} hasn't added any friends yet.` 
        : "You haven't added any friends yet.";

    return (
        <div className="friends-container">
            <h1>{displayTitle}</h1>
            {friends.length === 0 ? (
                <p className="no-friends">{emptyMessage}</p>
            ) : (
                <div className="friends-list">
                    {friends.map((friend) => (
                        <div key={friend.email} className="friend-card">
                            <div className="friend-content">
                                {friend.avatar ? (
                                    <img 
                                        src={friend.avatar} 
                                        alt={`${friend.username}'s avatar`} 
                                        className="friend-avatar" 
                                    />
                                ) : (
                                    <div className="friend-avatar-circle">
                                        {friend.username ? friend.username.charAt(0).toUpperCase() : "?"}
                                    </div>
                                )}
                                <div className="friend-info">
                                    <h3 className="friend-username">{friend.username}</h3>
                                    <p className="friend-email">{friend.email}</p>
                                </div>
                                {currentUserEmail && 
                                 currentUserEmail !== friend.email && 
                                 !myFriends.includes(friend.email) && (
                                    <button 
                                        className={`add-friend-button ${sentRequests.has(friend.email) ? 'requested' : ''}`}
                                        onClick={() => sendFriendRequest(friend.email)}
                                        disabled={sentRequests.has(friend.email)}
                                    >
                                        {sentRequests.has(friend.email) ? 'Requested' : 'Add'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FriendFriendsPage; 