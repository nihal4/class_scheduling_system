// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AdminPanel from "./components/AdminPanel";
import Login from "./components/Login";
import ClassDisplay from "./components/ClassDisplay";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ClassDisplay />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
};

export default App;
