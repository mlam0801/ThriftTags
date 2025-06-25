import './App.css';
import LoginPage from "./pages/login/LoginPage";
import React, {useState} from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import NavBar from "./pages/NavBar";
import HomeMap from "./pages/map/HomeMap";
import EventsPage from "./pages/EventsPage";
import ProfilePage from "./pages/ProfilePage";
import ReviewsPage from './pages/ReviewsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import FriendPage from './pages/FriendPage';
import AddReviewPage from './pages/AddReviewPage';
import FriendProfilePage from './pages/FriendProfilePage';
import FriendFriendsPage from './pages/FriendFriendsPage';

function AppContent() {
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    return (
        <>
            {location.pathname !== '/' && <NavBar/>}
            <Routes>
                <Route path="/" element={<LoginPage/>}/>
                <Route 
                    path="/home" 
                    element={
                        <ProtectedRoute>
                            <HomeMap />
                        </ProtectedRoute>
                    } 
                />
                <Route path="/events" element={<EventsPage/>}/>
                <Route path="/profile" element={<ProfilePage/>}/>
                <Route path="/reviews" element={<ReviewsPage/>}/>
                <Route path="/friends" element={<FriendPage/>}/>
                <Route path="/add-review" element={<AddReviewPage/>}/>
                <Route path="/friendprofile" element={<FriendProfilePage/>}/>
                <Route path="/friend-friends" element={<FriendFriendsPage/>}/>
            </Routes>
        </>
    );
}

function App() {
    return (
        <Router>
            <AppContent/>
        </Router>
    );
}

export default App;
export {HomeMap};