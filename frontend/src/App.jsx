// App.js

import React, { useState } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import Cookie from "js-cookie";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    console.log("Login data:", data);
    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (response.status === 200) {
        const responseData = await response.json();
        const { access_token } = responseData;
        Cookie.set("access_token", access_token);
        // Redirect or handle successful login
        navigate("/dashboard"); // Example redirection
      } else {
        // Handle login failure
        console.error("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    console.log("Register data:", data);
    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (response.status === 200) {
        const responseData = await response.json();
        const { access_token } = responseData;
        Cookie.set("access_token", access_token);
        // Redirect or handle successful registration
        navigate("/dashboard"); // Example redirection
      } else {
        // Handle registration failure
        console.error("Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return (

      <div className="frontapp">
        <h1 className="ppb"></h1>
        <div className="frontapp1">
          <div>
            <img src="image.png" alt="" className="img1" />
          </div>
          <Routes>
            <Route
              path="/login"
              element={
                <>
                  <Login
                    handleLogin={handleLogin}
                    togglePasswordVisibility={togglePasswordVisibility}
                    showPassword={showPassword}
                  />
                  <p className="note">
                    Don't have an account?{" "}
                    <Link to="/register" className="toggle-link">
                      Register here
                    </Link>
                  </p>
                </>
              }
            ></Route>
            <Route
              path="/register"
              element={
                <>
                  <Register
                    handleRegister={handleRegister}
                    togglePasswordVisibility={togglePasswordVisibility}
                    showPassword={showPassword}
                  />
                  <p className="note">
                    Already have an account?{" "}
                    <Link to="/login" className="toggle-link">
                      Log in here
                    </Link>
                  </p>
                </>
              }
            ></Route>
            <Route
              path="/"
              element={
                <>
                  <Login
                    handleLogin={handleLogin}
                    togglePasswordVisibility={togglePasswordVisibility}
                    showPassword={showPassword}
                  />
                  <p className="note">
                    Don't have an account?{" "}
                    <Link to="/register" className="toggle-link">
                      Register here
                    </Link>
                  </p>
                </>
              }
            ></Route>
            <Route element = {<ProtectedRoute />}>
            <Route path="/login" element = {<Login />}></Route>
            <Route path="/dashboard" element = {<Dashboard />}></Route>
            </Route>
          </Routes>
        </div>
      </div>
  );
};

export default App;
