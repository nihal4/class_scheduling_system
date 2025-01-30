import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import "../styles/user.css"; // Import the CSS file

const EndUserPage = () => {
  const [classData, setClassData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null); // Time left for countdown
  const [showJoinButton, setShowJoinButton] = useState(false); // To control join button visibility
  const classId = process.env.REACT_APP_CLASS_ID; // Your actual document ID

  useEffect(() => {
    const fetchClassData = async () => {
      const docRef = doc(db, "classes", classId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setClassData(data);
      } else {
        console.log("No such document!");
      }
    };

    fetchClassData();
  }, [classId]); // Re-fetch if the classId changes

  useEffect(() => {
    if (!classData) return; // Don't do anything if classData is not loaded yet

    const { startTime } = classData;

    // Convert Firestore timestamp to a Date object
    const classStartTime = new Date(startTime.seconds * 1000);

    // Set an interval to update the countdown every second
    const interval = setInterval(() => {
      const currentTime = new Date();
      const timeDifference = classStartTime - currentTime;

      if (timeDifference <= 0) {
        clearInterval(interval); // Stop the countdown when time is up
        setShowJoinButton(true); // Show the Join button
      } else {
        setTimeLeft(timeDifference);
      }
    }, 1000);

    return () => clearInterval(interval); // Clean up the interval when the component unmounts
  }, [classData]); // Re-run the effect if classData changes

  if (!classData) {
    return <div className="loading">Loading...</div>;
  }

  const { title, topics, startTime, meetingLink, showSection, message, showMessage } = classData;

  // Format time left as HH:mm:ss
  const formatTimeLeft = (timeLeft) => {
    const hours = Math.floor(timeLeft / 3600000); // Hours
    const minutes = Math.floor((timeLeft % 3600000) / 60000); // Minutes
    const seconds = Math.floor((timeLeft % 60000) / 1000); // Seconds

    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="end-user-page">
      <h2>{title}</h2>

      {/* Show Topic Message */}
      {showSection && (
        <p className="topic-message">In this class, we will cover the following topics:</p>
      )}

      {/* Show Topics */}
      {showSection && (
        <ul className="class-topics">
          {topics && topics.map((topic, index) => (
            <li key={index}>{topic}</li>
          ))}
        </ul>
      )}

      {/* Show Urgent Countdown Message */}
      { showSection && <div className="urgent-message">
      {timeLeft > 0 ? (
          <p>Time left: {formatTimeLeft(timeLeft)}</p>
        ) : (
          <p>Click below to join.</p>
        )}
      </div>}

      {/* Show Join button after countdown finishes */}
      {showSection && showJoinButton && (
        <button className="join-button" onClick={() => window.location.href = meetingLink}>Join Class</button>
      )}

      {/* Show Message if showMessage is true */}
      {showMessage && (
        <p className="message">{message}</p>
      )}
    </div>
  );
};

export default EndUserPage;
