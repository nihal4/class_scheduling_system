import React, { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/firebase";
import "../styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [userIP, setUserIP] = useState("");
  const navigate = useNavigate();

  const MAX_ATTEMPTS = 3;
  const BLOCK_DURATION = 300; // In seconds
  const DOCUMENT_ID = process.env.REACT_APP_CLASS_ID_2;

  // Fetch User IP Address
  useEffect(() => {
    const fetchIP = async () => {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      setUserIP(data.ip);
    };
    fetchIP();
  }, []);

  // Check Block Status for the Current IP
  const checkBlockStatus = async () => {
    if (!userIP) return;

    const userRef = doc(db, "classes", DOCUMENT_ID);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentTime = Date.now();

      // Find block entry for the current IP
      const blockedEntry = data.blockedIPs?.find((entry) => entry.ip === userIP);

      if (blockedEntry) {
        if (blockedEntry.blockUntil.seconds * 1000 > currentTime) {
          setIsBlocked(true);
          setTimeRemaining(
            Math.floor((blockedEntry.blockUntil.seconds * 1000 - currentTime) / 1000)
          );
          setErrorMessage("Your IP address is blocked. Please try again later.");
        } else {
          await resetUserAttempts(); // Remove expired block
        }
      }
    }
  };

  useEffect(() => {
    if (userIP) {
      checkBlockStatus();
    }
  }, [userIP]);

  useEffect(() => {
    let timer;
    if (isBlocked && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsBlocked(false);
            setTimeRemaining(0);
            resetUserAttempts();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBlocked, timeRemaining]);

  const resetUserAttempts = async () => {
    const userRef = doc(db, "classes", DOCUMENT_ID);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();

      // Filter out the current IP from blockedIPs
      const updatedBlockedIPs =
        data.blockedIPs?.filter((entry) => entry.ip !== userIP) || [];

      await setDoc(
        userRef,
        {
          blockedIPs: updatedBlockedIPs,
        },
        { merge: true }
      );
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isBlocked) {
      setErrorMessage(`Too many failed attempts. Please try again in ${timeRemaining} seconds.`);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      await resetUserAttempts(); // Reset attempts and unblock IP
      navigate("/admin");
    } catch (error) {
      const userRef = doc(db, "classes", DOCUMENT_ID);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const currentTime = Date.now();

        // Find the current IP in blockedIPs
        const blockedEntry = data.blockedIPs?.find((entry) => entry.ip === userIP);

        let newFailedAttempts = blockedEntry ? blockedEntry.failedAttempts + 1 : 1;

        if (newFailedAttempts >= MAX_ATTEMPTS) {
          const blockUntil = Timestamp.fromMillis(currentTime + BLOCK_DURATION * 1000);

          const updatedBlockedIPs = blockedEntry
            ? data.blockedIPs.map((entry) =>
                entry.ip === userIP ? { ...entry, blockUntil, failedAttempts: newFailedAttempts } : entry
              )
            : [...(data.blockedIPs || []), { ip: userIP, blockUntil, failedAttempts: newFailedAttempts }];

          await setDoc(
            userRef,
            {
              blockedIPs: updatedBlockedIPs,
            },
            { merge: true }
          );

          setIsBlocked(true);
          setTimeRemaining(BLOCK_DURATION);
          setErrorMessage(`Too many failed attempts. Your IP is blocked for ${BLOCK_DURATION} seconds.`);
        } else {
          const updatedBlockedIPs = blockedEntry
            ? data.blockedIPs.map((entry) =>
                entry.ip === userIP ? { ...entry, failedAttempts: newFailedAttempts } : entry
              )
            : [...(data.blockedIPs || []), { ip: userIP, failedAttempts: newFailedAttempts }];

          await setDoc(
            userRef,
            {
              blockedIPs: updatedBlockedIPs,
            },
            { merge: true }
          );

          setErrorMessage("Invalid email or password.");
        }
      } else {
        await setDoc(
          userRef,
          {
            blockedIPs: [{ ip: userIP, failedAttempts: 1 }],
          },
          { merge: true }
        );
        setErrorMessage("Invalid email or password.");
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={isBlocked}>
            Login
          </button>
        </form>
        {errorMessage && <p>{errorMessage}</p>}
      </div>
    </div>
  );
};

export default Login;
