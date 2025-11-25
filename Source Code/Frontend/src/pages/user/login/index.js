"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./style.scss"

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // MOCK USER DATA — dữ liệu tĩnh
  const mockUser = {
    username: "admin",
    password: "123456",
    name: "Administrator",
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.username) {
      newErrors.username = "Username is required"
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    }
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length === 0) {
      setLoading(true)
      try {
        // MOCK LOGIN (thay thế API)
        await new Promise((res) => setTimeout(res, 1000)) // mô phỏng delay API

        if (
          formData.username === mockUser.username &&
          formData.password === mockUser.password
        ) {
          console.log("[Mock Login] Success ✅")
          localStorage.setItem("user", JSON.stringify(mockUser))
          navigate("/dashboard") // chuyển hướng sang dashboard
        } else {
          setErrors({ submit: "Invalid username or password" })
        }
      } catch (error) {
        console.error("[Mock Login] Unexpected error:", error)
        setErrors({ submit: "Something went wrong" })
      } finally {
        setLoading(false)
      }
    } else {
      setErrors(newErrors)
    }
  }

  // SVG Icons
  const MessageCircleIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  )

  const UserIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  )

  const LockIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  )

  const EyeIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  )

  const EyeOffIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  )

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="logo-section">
          <div className="logo-container">
            <MessageCircleIcon />
          </div>
          <h1>SmartDoor</h1>
        </div>

        <div className="login-card">
          <form onSubmit={handleSubmit}>
            {errors.submit && <p className="error-message">{errors.submit}</p>}

            <div className="form-group">
              <div className="form-field">
                <label htmlFor="username">Username</label>
                <div className="input-container">
                  <div className="input-icon">
                    <UserIcon />
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={errors.username ? "error" : ""}
                    placeholder="Enter your username"
                  />
                </div>
                {errors.username && <p className="error-message">{errors.username}</p>}
              </div>
            </div>

            <div className="form-group">
              <div className="form-field">
                <label htmlFor="password">Password</label>
                <div className="input-container">
                  <div className="input-icon">
                    <LockIcon />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? "error" : ""}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && <p className="error-message">{errors.password}</p>}
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-link">
                Forgot Password?
              </a>
            </div>

            <div className="form-group">
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          <p className="signup-link">
            Don’t have an account? <a href="/signup">Sign up now</a>
          </p>
        </div>

        <p className="footer">© 2025 SmartDoor. All rights reserved.</p>
      </div>
    </div>
  )
}

export default LoginPage
