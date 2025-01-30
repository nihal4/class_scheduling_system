import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../styles/AdminPanel.css'; // Import the CSS file

const AdminPanel = () => {
  const [title, setTitle] = useState("");
  const [topics, setTopics] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [showSection, setShowSection] = useState(true);
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Use hardcoded document ID (replace 'XuqxEBr90S9oebaLqwAj' with the actual ID)
  const classId = "XuqxEBr90S9oebaLqwAj";

  // Step 1: Check for the current user's authentication
  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/login"); // Redirect to login if not authenticated
      } else {
        setUser(currentUser);
      }
    });
  }, [navigate]);

  // Step 2: If we're editing an existing class, fetch data from Firestore
  useEffect(() => {
    const docRef = doc(db, "classes", classId); // Use the hardcoded classId
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title);
        setTopics(data.topics || []);
        setStartTime(data.startTime.toDate().toISOString().slice(0, 16)); // Format date
        setMeetingLink(data.meetingLink);
        setShowSection(data.showSection);
        setMessage(data.message);
        setShowMessage(data.showMessage);
      } else {
        console.log("No such document!");
      }
    }).catch((error) => {
      console.error("Error getting document:", error);
    });
  }, [classId]);

  const handleAddTopic = () => {
    setTopics([...topics, ""]);  // Add an empty topic for the user to fill
  };

  const handleRemoveTopic = (index) => {
    const newTopics = topics.filter((_, i) => i !== index);
    setTopics(newTopics); // Remove the topic from the list
  };

  const handleTopicChange = (e, index) => {
    const newTopics = [...topics];
    newTopics[index] = e.target.value;
    setTopics(newTopics); // Update the specific topic
  };

  const handleSaveClass = async () => {
    try {
      const docRef = doc(db, "classes", classId); // Use the hardcoded classId to reference the document
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Only update if document exists
        await updateDoc(docRef, {
          title,
          topics,
          startTime: new Date(startTime),
          meetingLink,
          showSection,
          message,
          showMessage
        });
        console.log("Document updated!");
      } else {
        console.log("Document not found, no update");
      }
    } catch (error) {
      console.error("Error saving class:", error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth).then(() => {
      console.log("User signed out!");
      navigate("/login"); // Redirect to login after logout
    }).catch((error) => {
      console.error("Error signing out:", error);
    });
  };

  return (
    <div className="admin-panel">
      <h2>Edit Class</h2>
      <p>Welcome, {user ? user.email : "Guest"}</p>
      
      <input
        type="text"
        placeholder="Class Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      
      <div className="topics-section">
        <h3>Topics</h3>
        {topics.map((topic, index) => (
          <div key={index}>
            <input
              type="text"
              placeholder={`Topic ${index + 1}`}
              value={topic}
              onChange={(e) => handleTopicChange(e, index)}
            />
            <button onClick={() => handleRemoveTopic(index)}>Remove</button>
          </div>
        ))}
        <button onClick={handleAddTopic}>Add Topic</button>
      </div>
      
      <input
        type="datetime-local"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
      />
      
      <input
        type="text"
        placeholder="Meeting Link"
        value={meetingLink}
        onChange={(e) => setMeetingLink(e.target.value)}
      />
      
      <textarea
        placeholder="Class Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      
      <div className="checkbox-section">
        <label className="checkbox-label">
          Show Section
          <input
            type="checkbox"
            checked={showSection}
            onChange={(e) => setShowSection(e.target.checked)}
          />
        </label>
        
        <label className="checkbox-label">
          Show Message
          <input
            type="checkbox"
            checked={showMessage}
            onChange={(e) => setShowMessage(e.target.checked)}
          />
        </label>
      </div>

      <button onClick={handleSaveClass}>Save Class</button>

      {/* Logout Button */}
      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default AdminPanel;
