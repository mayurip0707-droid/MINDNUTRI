import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

import LandingPage from "./LandingPage";
import Dashboard from "./Dashboard";
import StressAssessment from "./pages/StressAssessment";
import MoodJournal from "./MoodJournal";
import Nutrition from "./pages/NutritionLogger";
import SleepTracker from "./pages/SleepTracker";
import GoalsActionPlan from "./pages/GoalsActionPlan";
import WeeklyWellnessReport from "./pages/WeeklyWellnessReport";
import WellnessInsights from "./pages/WellnessInsights";
import WellnessAnalytics from "./pages/WellnessAnalytics";
import MenstrualWellness from "./pages/MenstrualWellness";
import { syncAccountData, startAccountAutoSync } from "./accountSync";
import { API_BASE_URL } from "./api";

import "./App.css";

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(
    location.state?.authMode === "login" ? "login" : "register"
  );

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "22",
    height: "168",
    weight: "62",
    gender: "Female",
    lifestyle: "Student / Academic",
    activity: "Moderately Active",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };
    
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let endpoint = "";
      let payload = {};

      if (mode === "register") {
        if (!form.fullName.trim() || !form.email.trim() || !form.password) {
          alert("Please fill all required fields.");
          return;
        }

        if (form.password.length < 6) {
          alert("Password must contain at least 6 characters.");
          return;
        }

        if (form.password !== form.confirmPassword) {
          alert("Passwords do not match.");
          return;
        }

        const profile = {
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          age: form.age,
          height: form.height,
          weight: form.weight,
          gender: form.gender,
          lifestyle: form.lifestyle,
          activity: form.activity,
        };

        endpoint = "/auth/register";

        payload = {
          fullName: profile.fullName,
          email: profile.email,
          password: form.password,
          profile,
        };
      } else {
        if (!form.email.trim() || !form.password) {
          alert("Please enter email and password.");
          return;
        }

        endpoint = "/auth/login";

        payload = {
          email: form.email.trim().toLowerCase(),
          password: form.password,
        };
      }

      const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        alert(result.message || "Authentication failed. Please try again.");
        return;
      }

      if (!result.token || !result.profile) {
        alert("The server response is incomplete. Please try again.");
        return;
      }

      // Save the authenticated session and account profile.
      localStorage.setItem("mindnutri_auth_token", result.token);

      localStorage.setItem(
        "mindnutri_user_profile",
        JSON.stringify(result.profile)
      );
      console.log("MINDNUTRI LOGIN SYNC STARTED");

      try {
        const syncResult = await syncAccountData(result.token);

        startAccountAutoSync();

        console.log("MINDNUTRI account sync completed:", syncResult);
      } catch (syncError) {
        console.error("MINDNUTRI account sync failed:", syncError);

        alert(
          "Login successful, but wellness data could not sync. " +
          "Your local records have been kept. Please check the backend and try again."
        );
      }

      alert(
        mode === "register"
          ? "Account created successfully!"
          : "Login successful!"
      );

      navigate("/dashboard");
    } catch (error) {
      console.error("MINDNUTRI authentication error:", error);

      alert(
        "Cannot connect to the MINDNUTRI backend. Please make sure Flask is running on port 5000."
      );
    }
  };


  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="brand">
          <div className="logo">♡</div>

          <div>
            <h1>MINDNUTRI</h1>
            <p>Your Mental & Nutritional Wellness Companion</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main-content">
        <section className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={mode === "login" ? "tab active" : "tab"}
              onClick={() => setMode("login")}
            >
              Sign in to MindNutri
            </button>

            <button
              className={mode === "register" ? "tab active" : "tab"}
              onClick={() => setMode("register")}
            >
              Create New Account
            </button>
          </div>

          <div className="form-container">
            {mode === "register" ? (
              <>
                <div className="heading">
                  <h2>Join MindNutri Wellness</h2>
                  <p>
                    Create your profile with lifestyle information to
                    personalize your wellness experience.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <div className="field">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        placeholder="e.g. Mayuri Patil"
                        value={form.fullName}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="field">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="field">
                      <label>Password *</label>
                      <input
                        type="password"
                        name="password"
                        placeholder="Min 6 characters"
                        value={form.password}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="field">
                      <label>Confirm Password *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Re-enter password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="section-title">
                    WELLNESS BASELINE
                    <span>(FOR PERSONALIZED WELLNESS INSIGHTS)</span>
                  </div>

                  <div className="three-grid">
                    <div className="field">
                      <label>Age (yrs)</label>
                      <input
                        type="number"
                        name="age"
                        value={form.age}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="field">
                      <label>Height (cm)</label>
                      <input
                        type="number"
                        name="height"
                        value={form.height}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="field">
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        name="weight"
                        value={form.weight}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="three-grid">
                    <div className="field">
                      <label>Gender</label>

                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                      >
                        <option>Female</option>
                        <option>Male</option>
                        <option>Other</option>
                        <option>Prefer not to say</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Lifestyle</label>

                      <select
                        name="lifestyle"
                        value={form.lifestyle}
                        onChange={handleChange}
                      >
                        <option>Student / Academic</option>
                        <option>Working Professional</option>
                        <option>Homemaker</option>
                        <option>Retired</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Activity Level</label>

                      <select
                        name="activity"
                        value={form.activity}
                        onChange={handleChange}
                      >
                        <option>Sedentary</option>
                        <option>Lightly Active</option>
                        <option>Moderately Active</option>
                        <option>Very Active</option>
                      </select>
                    </div>
                  </div>

                  <button className="submit-btn" type="submit">
                    Complete Registration & Start
                    <span>→</span>
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="login-form">
                <div className="heading">
                  <h2>Welcome Back to MindNutri</h2>

                  <p>
                    Sign in to continue your personalized wellness journey.
                  </p>
                </div>

                <div className="field">
                  <label>Email Address *</label>

                  <input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="field">
                  <label>Password *</label>

                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>

                <button className="submit-btn" type="submit">
                  Sign In
                  <span>→</span>
                </button>
              </form>
            )}
          </div>
        </section>

        <div className="notice">
          <div className="notice-icon">ⓘ</div>

          <div>
            <strong>Educational & Wellness Notice:</strong>

            <p>
              MindNutri provides educational wellness analytics, predictive
              estimates, and lifestyle recommendations. It is{" "}
              <b>
                not a substitute for professional medical, psychiatric, or
                diagnostic advice.
              </b>{" "}
              If you experience clinical symptoms or distress, please consult
              a qualified healthcare professional.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Dashboard />} />
        <Route
          path="/menstrual-wellness"
          element={<MenstrualWellness />}
        />
        <Route
          path="/stress-assessment"
          element={<StressAssessment />}
        />
        <Route
          path="/mood-journal"
          element={<MoodJournal />}
        />
        <Route
          path="/nutrition"
          element={<Nutrition />}
        />
        <Route 
          path="/sleep"  
          element={<SleepTracker />} 
        />
        <Route
          path="/wellness-analytics"
          element={<WellnessAnalytics />}
        />
        <Route
          path="/wellness-insights"
          element={<WellnessInsights />}
        />
        <Route
          path="/weekly-report"
          element={<WeeklyWellnessReport />}
        />
        <Route
          path="/goals-action-plan"
          element={<GoalsActionPlan />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
