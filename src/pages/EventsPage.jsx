import React, { useState, useEffect } from "react";
import '../eventsPage.css';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";
import { db } from '../firebase'; // Make sure you have this file set up with your Firebase config
import { useLocation } from 'react-router-dom';

const EventsPage = ({ onEvent }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isDetailsPopupOpen, setIsDetailsPopupOpen] = useState(false);
  const [isHistoryPopupOpen, setIsHistoryPopupOpen] = useState(false);
  const [isRestorePopupOpen, setIsRestorePopupOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventToRestore, setEventToRestore] = useState(null);
  const [restoreEventIndex, setRestoreEventIndex] = useState(null);
  const [eventName, setEventName] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventHost, setEventHost] = useState("");
  const [eventPrivacy, setEventPrivacy] = useState("Public");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [filterInput, setFilterInput] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Get location state for friend's email (similar to ReviewsPage)
  const location = useLocation();
  const friendEmail = location.state?.email || null;
  const friendName = location.state?.username || null;
  
  // State for event history
  const [eventHistory, setEventHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  
  // Fetch events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const email = friendEmail || sessionStorage.getItem('userEmail');

        if (!email) {
          console.log("No user email found");
          setLoading(false);
          return;
        }

        console.log("Fetching events for email:", email);

        // Create a query to fetch events for this user
        const q = query(
          collection(db, "events"), 
          where('userEmail', '==', email),
          // orderBy("date")
        );

        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id, // Store the document ID
          ...doc.data()
        }));

        console.log("Fetched events data:", eventsData);

        setEvents(eventsData);
        setFilteredEvents(eventsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching events: ", error);
        setLoading(false);
      }
    };

    fetchEvents();
  }, [friendEmail]);

  // Function to move event to history
  const moveToHistory = async (eventToMove, reason) => {
    // Generate a unique key for the event
    const eventKey = `${eventToMove.name}-${eventToMove.date}-${eventToMove.time}`;
    
    // Check if the event is already in history using the unique key
    const isAlreadyInHistory = eventHistory.some(histEvent => {
      const histEventKey = `${histEvent.name}-${histEvent.date}-${histEvent.time}`;
      return histEventKey === eventKey;
    });
    
    if (isAlreadyInHistory) return;
    
    // Create history record
    const timestamp = new Date().toLocaleString();
    const historyEvent = {
      ...eventToMove,
      removedOn: timestamp,
      reason: reason // "deleted" or "expired"
    };
    
    // Add to history - in a real app, you might want to store this in Firestore too
    setEventHistory(prevHistory => [...prevHistory, historyEvent]);
    
    // Remove from active events list if expired
    if (reason === "expired") {
      // If we have a document ID, delete from Firestore
      if (eventToMove.id) {
        try {
          await deleteDoc(doc(db, "events", eventToMove.id));
        } catch (error) {
          console.error("Error removing expired event: ", error);
        }
      }
      
      const updatedEvents = events.filter(event => event.id !== eventToMove.id);
      setEvents(updatedEvents);
      setFilteredEvents(updatedEvents);
      
      // Notify parent component if needed
      if (onEvent) {
        onEvent(updatedEvents);
      }
    }
  };

  // Countdown Component
  const Countdown = ({ event }) => {
    const [timeLeft, setTimeLeft] = useState({});
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
      const calculateTimeLeft = () => {
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        const difference = eventDateTime - new Date();

        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((difference / 1000 / 60) % 60);
          const seconds = Math.floor((difference / 1000) % 60);

          return { days, hours, minutes, seconds };
        }
        
        // If countdown ended and event not already marked as expired
        if (!isExpired) {
          setIsExpired(true);
          moveToHistory(event, "expired");
        }

        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      };

      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);

      // Initial calculation to handle already expired events
      setTimeLeft(calculateTimeLeft());

      return () => clearInterval(timer);
    }, [event, isExpired]);

    return (
      <div className="countdown">
        <h4>Countdown to Event</h4>
        <div className="countdown-display">
          <div><strong>{timeLeft.days}</strong> Days</div>
          <div><strong>{timeLeft.hours}</strong> Hours</div>
          <div><strong>{timeLeft.minutes}</strong> Minutes</div>
          <div><strong>{timeLeft.seconds}</strong> Seconds</div>
        </div>
      </div>
    );
  };

  const openPopup = () => {
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setEventName("");
    setEventLocation("");
    setEventHost("");
    setEventDate("");
    setEventTime("");
    setEventPrivacy("Public");
    setIsPopupOpen(false);
  };

  const openDetailsPopup = (event) => {
    setSelectedEvent(event);
    setIsDetailsPopupOpen(true);
  };

  const closeDetailsPopup = () => {
    setSelectedEvent(null);
    setIsDetailsPopupOpen(false);
  };

  // History popup functions
  const openHistoryPopup = () => {
    setIsHistoryPopupOpen(true);
  };

  const closeHistoryPopup = () => {
    setIsHistoryPopupOpen(false);
  };

  // Restore popup functions
  const openRestorePopup = (event, index) => {
    // Set initial values from the history event
    setEventToRestore(event);
    setRestoreEventIndex(index);
    setEventDate(event.date);
    setEventTime(event.time);
    setIsRestorePopupOpen(true);
  };

  const closeRestorePopup = () => {
    setEventToRestore(null);
    setRestoreEventIndex(null);
    setIsRestorePopupOpen(false);
  };

  const handleOutsideClick = (event) => {
    if (event.target.className === "popup") {
      closePopup();
      closeDetailsPopup();
      closeHistoryPopup();
      closeRestorePopup();
    }
  };

  const handleSubmit = async () => {
    if (eventName.trim() !== "") {
      // Get user email for the event creation
      const email = sessionStorage.getItem('userEmail');
      
      if (!email) {
        alert("You must be logged in to create an event");
        return;
      }
      
      const newEvent = {
        name: eventName,
        location: eventLocation || "TBD",
        host: eventHost || "Me",
        privacy: eventPrivacy === "Private" ? true : false, // Convert to boolean for Firestore
        date: eventDate || new Date().toISOString().split('T')[0],
        time: eventTime || "00:00",
        userEmail: email // Add the user email to the event
      };

      try {
        console.log("Creating new event:", newEvent);
        
        // Add document to Firestore
        const docRef = await addDoc(collection(db, "events"), newEvent);
        
        console.log("Event created with ID:", docRef.id);
        
        // Add the document ID to our event object
        const newEventWithId = { ...newEvent, id: docRef.id, privacy: eventPrivacy };
        
        const updatedEvents = [...events, newEventWithId];
        setEvents(updatedEvents);
        setFilteredEvents(updatedEvents);

        if (onEvent) {
          onEvent(updatedEvents);
        }

        closePopup();
      } catch (error) {
        console.error("Error adding document: ", error);
        alert("Error creating event. Please try again.");
      }
    }
  };

  const sortByProp = (propName, sortType) => {
    const sortedList = [...filteredEvents].sort((a, b) => {
      let valA = a[propName];
      let valB = b[propName];

      // Handle null or undefined values
      if (valA == null) valA = "";
      if (valB == null) valB = "";

      // If it's a dollar amount, remove '$' and ',' before converting to a number
      if (sortType === "currency") {
        valA = parseFloat(valA.replace(/[$,]/g, "")) || 0;
        valB = parseFloat(valB.replace(/[$,]/g, "")) || 0;
      } else if (sortType === "number") {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (sortType === "date") {
        valA = new Date(valA);
        valB = new Date(valB);
      } else { // Default to text sorting
        valA = valA.toString();
        valB = valB.toString();
      }

      return valA > valB ? 1 : valA < valB ? -1 : 0;
    });

    setFilteredEvents(sortedList);
  };

  // Sort history by date
  const sortHistory = (propName, sortType = "date") => {
    const sortedHistory = [...eventHistory].sort((a, b) => {
      if (sortType === "date") {
        const dateA = new Date(a.removedOn);
        const dateB = new Date(b.removedOn);
        return dateB - dateA; // Sort from newest to oldest
      }
      return a[propName] > b[propName] ? 1 : a[propName] < b[propName] ? -1 : 0;
    });
    
    setEventHistory(sortedHistory);
  };

  const doFilter = () => {
    const lowercasedFilter = filterInput.toLowerCase();
    const newList = events.filter(event =>
      event.name.toLowerCase().includes(lowercasedFilter) ||
      event.location.toLowerCase().includes(lowercasedFilter) ||
      event.host.toLowerCase().includes(lowercasedFilter) ||
      (typeof event.privacy === 'string' ? 
        event.privacy.toLowerCase().includes(lowercasedFilter) : 
        (event.privacy ? "private" : "public").includes(lowercasedFilter)) ||
      event.date.toLowerCase().includes(lowercasedFilter) ||
      event.time.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredEvents(newList);
  };

  const clearFilter = () => {
    setFilterInput("");
    setFilteredEvents(events);
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      setLocationMessage("Getting your location...");
      navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
          const lat = position.coords.latitude;
          const long = position.coords.longitude;

          // Use reverse geocoding to get city and state
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
              // Extract city and state from the response
              const city = data.address.city || data.address.town || data.address.village || '';
              const state = data.address.state || '';
              const country = data.address.country || '';

              // Format the location string
              const locationString = city && state ? `${city}, ${state}` :
                city ? `${city}, ${country}` :
                  state ? `${state}, ${country}` :
                    "Location found";

              // Update the location input
              setEventLocation(locationString);
              setLocationMessage("Location found!");
            })
            .catch(error => {
              console.error("Error fetching address:", error);
              setLocationMessage("Couldn't retrieve address. Using coordinates instead.");
              setEventLocation(`Near ${lat.toFixed(3)}, ${long.toFixed(3)}`);
            });
        },
        // Error callback
        (err) => {
          switch (err.code) {
            case 1:
              setLocationMessage("User denied the request for Geolocation.");
              break;
            case 2:
              setLocationMessage("Location information is unavailable.");
              break;
            case 3:
              setLocationMessage("The request to get user location timed out.");
              break;
            default:
              setLocationMessage("An unknown error occurred.");
              break;
          }
        }
      );
    } else {
      setLocationMessage("Geolocation is not supported by this browser.");
    }
  };

  // Function to check if an event is hosted by me
  const isMyEvent = (host) => {
    if (!host) return false;
    const hostLower = host.toLowerCase();
    return hostLower === "me" || hostLower === "myself";
  };

  const handleDeleteEvent = async (eventToDelete, index, e) => {
    // Stop the event from bubbling up to the row click handler
    e.stopPropagation();

    // Show confirmation dialog
    if (window.confirm(`Are you sure you want to delete "${eventToDelete.name}"?`)) {
      try {
        // Delete from Firestore if we have an ID
        if (eventToDelete.id) {
          await deleteDoc(doc(db, "events", eventToDelete.id));
          console.log("Deleted event with ID:", eventToDelete.id);
        }
        
        // Add to history before removing
        moveToHistory(eventToDelete, "deleted");
        
        const updatedEvents = events.filter(event => event.id !== eventToDelete.id);
        setEvents(updatedEvents);
        setFilteredEvents(updatedEvents.filter(event =>
          event.name.toLowerCase().includes(filterInput.toLowerCase()) ||
          event.location.toLowerCase().includes(filterInput.toLowerCase()) ||
          event.host.toLowerCase().includes(filterInput.toLowerCase()) ||
          (typeof event.privacy === 'string' ? 
            event.privacy.toLowerCase().includes(filterInput.toLowerCase()) : 
            (event.privacy ? "private" : "public").includes(filterInput.toLowerCase())) ||
          event.date.toLowerCase().includes(filterInput.toLowerCase()) ||
          event.time.toLowerCase().includes(filterInput.toLowerCase())
        ));

        // Notify parent component if needed
        if (onEvent) {
          onEvent(updatedEvents);
        }
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Error deleting event. Please try again.");
      }
    }
  };

  // Function to restore an event from history with option to update date/time
  const restoreEvent = async () => {
    if (!eventToRestore) return;
    
    // Get user email for the event restoration
    const email = sessionStorage.getItem('userEmail');
    
    if (!email) {
      alert("You must be logged in to restore an event");
      return;
    }
    
    try {
      // Create a new event object without history-specific properties and with updated date/time
      const { removedOn, reason, id, ...restoredEventBase } = eventToRestore;
      const restoredEvent = {
        ...restoredEventBase,
        date: eventDate,
        time: eventTime,
        privacy: typeof restoredEventBase.privacy === 'string' ? 
          restoredEventBase.privacy === "Private" : restoredEventBase.privacy,
        userEmail: email // Add the user email to the restored event
      };
      
      console.log("Restoring event:", restoredEvent);
      
      // Add back to Firestore
      const docRef = await addDoc(collection(db, "events"), restoredEvent);
      console.log("Restored event with ID:", docRef.id);
      
      // Add to local state with the new document ID
      const restoredEventWithId = { 
        ...restoredEvent, 
        id: docRef.id,
        privacy: typeof restoredEvent.privacy === 'boolean' ? 
          (restoredEvent.privacy ? "Private" : "Public") : restoredEvent.privacy
      };
      
      // Update state
      const updatedEvents = [...events, restoredEventWithId];
      setEvents(updatedEvents);
      setFilteredEvents(updatedEvents);
      
      // Remove from history
      const updatedHistory = eventHistory.filter((_, i) => i !== restoreEventIndex);
      setEventHistory(updatedHistory);
      
      // Notify parent if needed
      if (onEvent) {
        onEvent(updatedEvents);
      }
      
      // Close popup
      closeRestorePopup();
    } catch (error) {
      console.error("Error restoring event: ", error);
      alert("Error restoring event. Please try again.");
    }
  };

  // Remove duplicate events from history
  useEffect(() => {
    const uniqueEvents = [];
    const eventKeys = new Set();
    
    eventHistory.forEach(event => {
      const eventKey = `${event.name}-${event.date}-${event.time}-${event.host}`;
      if (!eventKeys.has(eventKey)) {
        eventKeys.add(eventKey);
        uniqueEvents.push(event);
      }
    });
    
    // Only update if we actually removed duplicates
    if (uniqueEvents.length !== eventHistory.length) {
      setEventHistory(uniqueEvents);
    }
  }, [eventHistory]);

  // Check for expired events on component mount and when events change
  useEffect(() => {
    const checkForExpiredEvents = async () => {
      const now = new Date();
      const expiredEventIds = [];
      
      events.forEach((event) => {
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        if (eventDateTime <= now) {
          expiredEventIds.push(event.id);
          
          // Only move to history if not already there
          moveToHistory(event, "expired");
        }
      });
      
      // Remove expired events from Firestore and local state
      if (expiredEventIds.length > 0) {
        console.log("Found expired events:", expiredEventIds);
        
        // Delete from Firestore
        for (const id of expiredEventIds) {
          if (id) {
            try {
              await deleteDoc(doc(db, "events", id));
              console.log("Removed expired event ID:", id);
            } catch (error) {
              console.error("Error removing expired event: ", error);
            }
          }
        }
        
        // Update local state
        const updatedEvents = events.filter((event) => !expiredEventIds.includes(event.id));
        setEvents(updatedEvents);
        setFilteredEvents(updatedEvents);
        
        // Notify parent if needed
        if (onEvent) {
          onEvent(updatedEvents);
        }
      }
    };
    
    // Check on mount
    checkForExpiredEvents();
    
    // Set up interval to check regularly
    const intervalId = setInterval(checkForExpiredEvents, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [events]);

  // Function to format privacy value for display
  const formatPrivacy = (privacy) => {
    if (typeof privacy === 'boolean') {
      return privacy ? "Private" : "Public";
    }
    return privacy;
  };

  // Set page title based on whether viewing a friend's events or own events
  const pageTitle = friendEmail 
    ? `${friendName || "Friend"}'s Events` 
    : "My Events";

  // Determine if the create event button should be visible
  // Only show it when viewing your own events, not a friend's
  const showCreateEventButton = !friendEmail;

  // Debug: Log events whenever they change
  useEffect(() => {
    console.log("Current events state:", events);
    console.log("Filtered events state:", filteredEvents);
  }, [events, filteredEvents]);

  if (loading) {
    return <div className="body-wrapper"><div className="eventsContainer">Loading events...</div></div>;
  }

  return (
    <div className="body-wrapper">
      <div className="eventsContainer">
        <div className="eventTitle">{pageTitle}</div>
        <input
          value={filterInput}
          onChange={(e) => setFilterInput(e.target.value)}
          placeholder="Search events..."
        />
        &nbsp;
        <button onClick={doFilter}>Search</button>
        &nbsp;
        <button onClick={clearFilter}>Clear Search</button>
        
        {/* Only show create button when viewing own events */}
        {showCreateEventButton && (
          <button className="createEventButton" onClick={openPopup}>Create Event</button>
        )}
        
        {/* Only show history button when viewing own events */}
        {showCreateEventButton && (
          <button className="historyButton" onClick={openHistoryPopup}>Event History</button>
        )}

        {/* Create Event Popup */}
        <div id="myPopup" className="popup" style={{ display: isPopupOpen ? "block" : "none" }} onClick={handleOutsideClick}>
          <div className="popup-content">
            <span className="close" onClick={closePopup}>&times;</span>
            <h3>Create New Event</h3>
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Event name"
            /> <br />
            <input
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Event Location"
            />
            <button type="button" onClick={getLocation}>Use my location</button>
            {locationMessage && <div className="location-message">{locationMessage}</div>}
            <input
              value={eventHost}
              onChange={(e) => setEventHost(e.target.value)}
              placeholder="Who's Hosting"
            /> <br />

            {/* Date and Time Inputs */}
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              placeholder="Event Date"
            />
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              placeholder="Event Time"
            />

            {/* Privacy selection with radio buttons */}
            <div className="privacy-options">
              <label>Privacy:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="privacy"
                    value="Public"
                    checked={eventPrivacy === "Public"}
                    onChange={() => setEventPrivacy("Public")}
                  />
                  Public
                </label>
                <label>
                  <input
                    type="radio"
                    name="privacy"
                    value="Private"
                    checked={eventPrivacy === "Private"}
                    onChange={() => setEventPrivacy("Private")}
                  />
                  Private
                </label>
              </div>
            </div>
            <br />

            <button onClick={handleSubmit}>Create</button>
          </div>
        </div>

        {/* Event Details Popup */}
        {isDetailsPopupOpen && selectedEvent && (
          <div className="popup" onClick={handleOutsideClick}>
            <div className="popup-content">
              <span className="close" onClick={closeDetailsPopup}>&times;</span>
              <h3>Event Details</h3>
              <div className="event-details">
                <p><strong>Event Name:</strong> {selectedEvent.name}</p>
                <p><strong>Location:</strong> {selectedEvent.location}</p>
                <p><strong>Host:</strong> {selectedEvent.host}</p>
                <p><strong>Privacy:</strong> {formatPrivacy(selectedEvent.privacy)}</p>
                <p><strong>Date:</strong> {selectedEvent.date}</p>
                <p><strong>Time:</strong> {selectedEvent.time}</p>
              </div>
              <Countdown event={selectedEvent} />
            </div>
          </div>
        )}

        {/* Event History Popup */}
        {isHistoryPopupOpen && (
          <div className="popup" onClick={handleOutsideClick}>
            <div className="popup-content history-popup">
              <span className="close" onClick={closeHistoryPopup}>&times;</span>
              <h3>Event History</h3>
              {eventHistory.length === 0 ? (
                <div className="no-history">No past events available.</div>
              ) : (
                <div className="history-container">
                  <div className="history-tabs">
                    <button onClick={() => sortHistory("removedOn")}>Sort by Date</button>
                    <button onClick={() => sortHistory("name", "text")}>Sort by Name</button>
                    <button onClick={() => sortHistory("reason", "text")}>Sort by Reason</button>
                  </div>
                  <div className="history-list">
                    {eventHistory.map((historyEvent, index) => (
                      <div key={index} className="history-item">
                        <div className="history-header">
                          <h4>{historyEvent.name}</h4>
                          <span className={`history-tag ${historyEvent.reason}`}>
                            {historyEvent.reason === "expired" ? "Completed" : "Deleted"}
                          </span>
                        </div>
                        <p><strong>Location:</strong> {historyEvent.location}</p>
                        <p><strong>Host:</strong> {historyEvent.host}</p>
                        <p><strong>Original Date/Time:</strong> {historyEvent.date} at {historyEvent.time}</p>
                        <p><strong>Removed On:</strong> {historyEvent.removedOn}</p>
                        <button onClick={() => openRestorePopup(historyEvent, index)}>
                          Restore Event
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Restore Event Popup with Date/Time editing */}
        {isRestorePopupOpen && eventToRestore && (
          <div className="popup" onClick={handleOutsideClick}>
            <div className="popup-content">
              <span className="close" onClick={closeRestorePopup}>&times;</span>
              <h3>Restore Event</h3>
              <div className="event-details">
                <p><strong>Event Name:</strong> {eventToRestore.name}</p>
                <p><strong>Location:</strong> {eventToRestore.location}</p>
                <p><strong>Host:</strong> {eventToRestore.host}</p>
                <p><strong>Privacy:</strong> {formatPrivacy(eventToRestore.privacy)}</p>
              </div>
              
              <div className="restore-date-time">
                <h4>Update Date and Time</h4>
                <div className="date-time-inputs">
                  <label>
                    New Date:
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </label>
                  <label>
                    New Time:
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                    />
                  </label>
                </div>
              </div>
              
              <button onClick={restoreEvent}>Restore with Updated Date/Time</button>
            </div>
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="no-events">
            {friendEmail ? 
              `${friendName || "This user"} doesn't have any events yet.` : 
              "You don't have any events yet."}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => sortByProp("name", "text")}>
                  <span style={{ cursor: "pointer" }}>⇅</span>Event Name</th>
                <th onClick={() => sortByProp("location", "text")}>
                  <span style={{ cursor: "pointer" }}>⇅</span>Event Location</th>
                <th onClick={() => sortByProp("host", "text")}>
                  <span style={{ cursor: "pointer" }}>⇅</span>Hosting</th>
                <th onClick={() => sortByProp("privacy", "text")}>
                  <span style={{ cursor: "pointer" }}>⇅</span>Private/Public</th>
                <th onClick={() => sortByProp("date", "date")}>
                  <span style={{ cursor: "pointer" }}>⇅</span>Date</th>
                <th onClick={() => sortByProp("time", "text")}>
                  <span style={{ cursor: "pointer" }}>⇅</span>Time</th>
                {/* Only show delete column for your own events */}
                {!friendEmail && <th>Delete</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event, index) => (
                <tr
                  key={event.id || index}
                  className={isMyEvent(event.host) ? "my-event-row" : ""}
                  onClick={() => openDetailsPopup(event)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{event.name}</td>
                  <td>{event.location}</td>
                  <td>{event.host}</td>
                  <td>{formatPrivacy(event.privacy)}</td>
                  <td>{event.date}</td>
                  <td>{event.time}</td>
                  {/* Only show delete buttons for your own events */}
                  {!friendEmail && (
                    <td className="delete-cell" onClick={(e) => handleDeleteEvent(event, index, e)}>
                      🗑️
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EventsPage;