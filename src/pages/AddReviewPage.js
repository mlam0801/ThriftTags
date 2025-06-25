import React, { useState } from 'react';
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import './AddReviewPage.css';

const AddReviewPage = () => {
    const navigate = useNavigate();
    const [review, setReview] = useState({
        storeName: '',
        rating: 5,
        content: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const userEmail = sessionStorage.getItem('userEmail');
            if (!userEmail) {
                return;
            }

            await addDoc(collection(db, "reviews"), {
                userEmail,
                storeName: review.storeName,
                rating: Number(review.rating),
                content: review.content,
                date: new Date().toISOString()
            });

            navigate('/reviews');
        } catch (error) {
            console.error("Error adding review:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="add-review-container">
            <h1>Write a Review</h1>
            <form onSubmit={handleSubmit} className="review-form">
                <div className="form-group">
                    <label htmlFor="storeName">Store Name:</label>
                    <input
                        type="text"
                        id="storeName"
                        value={review.storeName}
                        onChange={(e) => setReview({ ...review, storeName: e.target.value })}
                        required
                        placeholder="Enter store name"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="rating">Rating:</label>
                    <select
                        id="rating"
                        value={review.rating}
                        onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}
                    >
                        <option value="5">5 Stars</option>
                        <option value="4.5">4.5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3.5">3.5 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2.5">2.5 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1.5">1.5 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="content">Review:</label>
                    <textarea
                        id="content"
                        value={review.content}
                        onChange={(e) => setReview({ ...review, content: e.target.value })}
                        required
                        rows="5"
                        placeholder="Write your review here..."
                    />
                </div>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </form>
        </div>
    );
};

export default AddReviewPage; 