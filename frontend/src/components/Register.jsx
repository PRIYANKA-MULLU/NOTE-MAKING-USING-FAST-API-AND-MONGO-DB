// Register.js

import React from "react";

const Register = ({ handleRegister, togglePasswordVisibility, showPassword }) => {
  return (
    <div className="register-box">
      <h2 className="login-H">Register</h2>
      <form className="register-form" onSubmit={handleRegister}>
        <div>
          <label htmlFor="username">Username</label> <br />
          <input
            type="text"
            id="username"
            name="username"
            placeholder="enter your name"
            className="box-l"
            minLength={3}
            required
          />
        </div>
        <div>
          <label htmlFor="email">Email</label> <br />
          <input
            type="email"
            id="email"
            name="email"
            placeholder="enter email"
            className="box-l"
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label> <br />
          <div className="password-eye">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="enter password"
              className="box-2"
              required
            />
            <i
              className={`fa-solid fa-eye${showPassword ? "-slash" : ""} fa-xs`}
              onClick={togglePasswordVisibility}
              style={{ cursor: "pointer", marginLeft: "-15px" }}
            ></i>
          </div>
        </div>
        <button type="submit" className="login-b">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;