import React, { useEffect, useMemo, useState } from "react";
import "./MyProfile.css";

const PROFILE_KEY = "mindnutri_user_profile";

const STORAGE_KEYS = {
mood: "mindnutri_mood_history",
stress: "mindnutri_stress_history",
latestStress: "mindnutri_stress_result",
sleep: "mindnutri_sleep_history",
latestSleep: "mindnutri_sleep_data",
nutrition: "mindnutri_nutrition_history",
water: "mindnutri_water",
waterHistory: "mindnutri_water_history",
};

const readStorage = (key, fallback = null) => {
try {
const value = localStorage.getItem(key);
return value === null ? fallback : JSON.parse(value);
} catch {
return fallback;
}
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

const formatValue = (value, suffix = "") => {
if (value === null || value === undefined || value === "") {
return "Not available";
}
return `${value}${suffix}`;
};

const getDateKey = () => {
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
return `${year}-${month}-${day}`;
};

function MyProfile() {
const [profile, setProfile] = useState(() =>
readStorage(PROFILE_KEY, {})
);
const [form, setForm] = useState(() =>
readStorage(PROFILE_KEY, {})
);
const [isEditing, setIsEditing] = useState(false);
const [message, setMessage] = useState("");
const [messageType, setMessageType] = useState("success");
const [refreshKey, setRefreshKey] = useState(0);

useEffect(() => {
const reloadProfile = () => {
const savedProfile = readStorage(PROFILE_KEY, {});
setProfile(savedProfile || {});
setForm(savedProfile || {});
setRefreshKey((previous) => previous + 1);
};

window.addEventListener("focus", reloadProfile);
window.addEventListener("storage", reloadProfile);
window.addEventListener("mindnutri-profile-updated", reloadProfile);

return () => {
  window.removeEventListener("focus", reloadProfile);
  window.removeEventListener("storage", reloadProfile);
  window.removeEventListener(
    "mindnutri-profile-updated",
    reloadProfile
  );
};

}, []);

const getInitials = (name) => {
const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
if (parts.length === 0) return "U";
if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const updateField = (event) => {
const { name, value } = event.target;
setForm((previous) => ({ ...previous, [name]: value }));
setMessage("");
};

const handleSave = (event) => {
event.preventDefault();

const fullName = String(form.fullName || "").trim();
const email = String(form.email || "").trim();

if (!fullName || !email) {
  setMessageType("error");
  setMessage("Full name and email are required.");
  return;
}

const age = Number(form.age);
const height = Number(form.height);
const weight = Number(form.weight);

if (form.age !== "" && (!Number.isFinite(age) || age < 1 || age > 120)) {
  setMessageType("error");
  setMessage("Please enter an age between 1 and 120.");
  return;
}

if (
  form.height !== "" &&
  (!Number.isFinite(height) || height < 50 || height > 250)
) {
  setMessageType("error");
  setMessage("Please enter a height between 50 and 250 cm.");
  return;
}

if (
  form.weight !== "" &&
  (!Number.isFinite(weight) || weight < 10 || weight > 500)
) {
  setMessageType("error");
  setMessage("Please enter a weight between 10 and 500 kg.");
  return;
}

const updatedProfile = {
  ...profile,
  ...form,
  fullName,
  email,
  age: form.age === "" ? "" : String(age),
  height: form.height === "" ? "" : String(height),
  weight: form.weight === "" ? "" : String(weight),
};

try {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
  setProfile(updatedProfile);
  setForm(updatedProfile);
  setIsEditing(false);
  setMessageType("success");
  setMessage("Your profile has been saved successfully.");
  window.dispatchEvent(new Event("mindnutri-profile-updated"));
} catch (error) {
  console.error("Unable to save profile:", error);
  setMessageType("error");
  setMessage("Unable to save your profile on this device.");
}

};

const handleCancel = () => {
setForm(profile);
setIsEditing(false);
setMessage("");
};

const wellnessData = useMemo(() => {
const moodHistory = safeArray(readStorage(STORAGE_KEYS.mood, []));
const stressHistory = safeArray(readStorage(STORAGE_KEYS.stress, []));
const sleepHistory = safeArray(readStorage(STORAGE_KEYS.sleep, []));
const nutritionHistory = safeArray(readStorage(STORAGE_KEYS.nutrition, []));
const waterHistory = safeArray(readStorage(STORAGE_KEYS.waterHistory, []));

const latestStress = readStorage(STORAGE_KEYS.latestStress, null);
const latestSleep = readStorage(STORAGE_KEYS.latestSleep, null);
const savedWater = readStorage(STORAGE_KEYS.water, null);

const sleepEntries = sleepHistory.filter((entry) => {
  const duration = Number(entry?.duration);
  return Number.isFinite(duration) && duration > 0;
});

const averageSleep =
  sleepEntries.length > 0
    ? sleepEntries.reduce(
        (total, entry) => total + Number(entry.duration),
        0
      ) / sleepEntries.length
    : null;

const today = getDateKey();
const todayNutrition = nutritionHistory.filter(
  (entry) => entry?.date === today
);

const waterNumber =
  savedWater !== null && savedWater !== ""
    ? Number(savedWater)
    : null;

const validWater =
  waterNumber !== null && Number.isFinite(waterNumber)
    ? waterNumber
    : null;

return {
  moodCount: moodHistory.length,
  stressCount: stressHistory.length || (latestStress ? 1 : 0),
  sleepCount: sleepHistory.length || (latestSleep ? 1 : 0),
  nutritionCount: nutritionHistory.length,
  todayNutritionCount: todayNutrition.length,
  waterCount: waterHistory.length,
  averageSleep,
  latestStress,
  latestSleep,
  todayWater: validWater,
};

}, [refreshKey]);

const heightInMeters = Number(profile.height) / 100;
const weightInKg = Number(profile.weight);

const bmi =
heightInMeters > 0 &&
weightInKg > 0 &&
Number.isFinite(heightInMeters) &&
Number.isFinite(weightInKg)
? weightInKg / (heightInMeters * heightInMeters)
: null;

const bmiCategory = (() => {
if (bmi === null) return "Add height and weight";
if (bmi < 18.5) return "Below standard adult range";
if (bmi < 25) return "Within standard adult range";
if (bmi < 30) return "Above standard adult range";
return "Higher adult BMI range";
})();

const recordCards = [
{
icon: "💭",
label: "Mood Journal Entries",
value: wellnessData.moodCount,
detail: "Saved journal records",
},
{
icon: "🧠",
label: "Stress Assessments",
value: wellnessData.stressCount,
detail: "Recorded assessments",
},
{
icon: "🌙",
label: "Sleep Records",
value: wellnessData.sleepCount,
detail: "Saved sleep entries",
},
{
icon: "🥗",
label: "Nutrition Entries",
value: wellnessData.nutritionCount,
detail: `${wellnessData.todayNutritionCount} logged today`,
},
{
icon: "💧",
label: "Water Intake Today",
value:
wellnessData.todayWater === null
? "No data yet"
: `${wellnessData.todayWater} glasses`,
detail: "From your saved hydration value",
},
{
icon: "📈",
label: "Average Sleep",
value:
wellnessData.averageSleep === null
? "No data yet"
: `${wellnessData.averageSleep.toFixed(1)} hrs`,
detail: "Calculated from saved sleep history",
},
];

return ( <div className="my-profile-page"> <section className="profile-page-heading"> <div> <span className="profile-eyebrow">YOUR ACCOUNT</span> <h1>My Profile</h1> <p>
Manage your personal details and view your saved wellness activity. </p> </div>

    <div className="profile-heading-avatar">
      {getInitials(profile.fullName)}
    </div>
  </section>

  {message && (
    <div
      className={`profile-message ${
        messageType === "error" ? "error" : "success"
      }`}
      role="status"
    >
      {message}
    </div>
  )}

  <section className="profile-personal-card">
    <div className="profile-card-heading">
      <div className="profile-section-icon">👤</div>
      <div>
        <h2>Personal Information</h2>
        <p>Your details saved during registration</p>
      </div>
      {!isEditing && (
        <button
          type="button"
          className="profile-edit-button"
          onClick={() => {
            setForm(profile);
            setIsEditing(true);
            setMessage("");
          }}
        >
          ✏️ Edit Profile
        </button>
      )}
    </div>

    {isEditing ? (
      <form className="profile-edit-form" onSubmit={handleSave}>
        <label>
          Full Name
          <input
            type="text"
            name="fullName"
            value={form.fullName || ""}
            onChange={updateField}
            maxLength={100}
            required
          />
        </label>

        <label>
          Email Address
          <input
            type="email"
            name="email"
            value={form.email || ""}
            onChange={updateField}
            maxLength={150}
            required
          />
        </label>

        <label>
          Age
          <input
            type="number"
            name="age"
            value={form.age ?? ""}
            onChange={updateField}
            min="1"
            max="120"
          />
        </label>

        <label>
          Gender
          <select
            name="gender"
            value={form.gender || ""}
            onChange={updateField}
          >
            <option value="">Select gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </label>

        <label>
          Height (cm)
          <input
            type="number"
            name="height"
            value={form.height ?? ""}
            onChange={updateField}
            min="50"
            max="250"
            step="0.1"
          />
        </label>

        <label>
          Weight (kg)
          <input
            type="number"
            name="weight"
            value={form.weight ?? ""}
            onChange={updateField}
            min="10"
            max="500"
            step="0.1"
          />
        </label>

        <label>
          Lifestyle
          <select
            name="lifestyle"
            value={form.lifestyle || ""}
            onChange={updateField}
          >
            <option value="">Select lifestyle</option>
            <option value="Student / Academic">Student / Academic</option>
            <option value="Working Professional">Working Professional</option>
            <option value="Homemaker">Homemaker</option>
            <option value="Self-employed">Self-employed</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          Activity Level
          <select
            name="activity"
            value={form.activity || ""}
            onChange={updateField}
          >
            <option value="">Select activity level</option>
            <option value="Sedentary">Sedentary</option>
            <option value="Lightly Active">Lightly Active</option>
            <option value="Moderately Active">Moderately Active</option>
            <option value="Very Active">Very Active</option>
          </select>
        </label>

        <div className="profile-form-actions">
          <button type="button" className="profile-cancel-button" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="profile-save-button">
            Save Changes
          </button>
        </div>
      </form>
    ) : (
      <div className="profile-info-grid">
        <div className="profile-info-item">
          <span>Full Name</span>
          <strong>{formatValue(profile.fullName)}</strong>
        </div>
        <div className="profile-info-item">
          <span>Email Address</span>
          <strong>{formatValue(profile.email)}</strong>
        </div>
        <div className="profile-info-item">
          <span>Age</span>
          <strong>{formatValue(profile.age, profile.age ? " years" : "")}</strong>
        </div>
        <div className="profile-info-item">
          <span>Gender</span>
          <strong>{formatValue(profile.gender)}</strong>
        </div>
        <div className="profile-info-item">
          <span>Height</span>
          <strong>{formatValue(profile.height, profile.height ? " cm" : "")}</strong>
        </div>
        <div className="profile-info-item">
          <span>Weight</span>
          <strong>{formatValue(profile.weight, profile.weight ? " kg" : "")}</strong>
        </div>
        <div className="profile-info-item">
          <span>Lifestyle</span>
          <strong>{formatValue(profile.lifestyle)}</strong>
        </div>
        <div className="profile-info-item">
          <span>Activity Level</span>
          <strong>{formatValue(profile.activity)}</strong>
        </div>
      </div>
    )}
  </section>

  <section className="profile-bmi-card">
    <div className="profile-bmi-icon">⚖️</div>
    <div className="profile-bmi-content">
      <span className="profile-eyebrow">PERSONAL CALCULATION</span>
      <h2>Body Mass Index (BMI)</h2>
      <p>
        Calculated from the height and weight saved in your profile.
      </p>
      <small>
        BMI is a general screening measure, not a diagnosis. Adult ranges
        may not apply to children, teenagers, pregnancy, or every individual.
      </small>
    </div>
    <div className="profile-bmi-result">
      <strong>{bmi === null ? "--" : bmi.toFixed(1)}</strong>
      <span>{bmiCategory}</span>
    </div>
  </section>

  <section className="profile-activity-section">
    <div className="profile-section-title">
      <div>
        <span className="profile-eyebrow">YOUR SAVED DATA</span>
        <h2>Wellness Tracking Summary</h2>
        <p>
          A summary calculated from records stored in this browser.
        </p>
      </div>
    </div>

    <div className="profile-record-grid">
      {recordCards.map((card) => (
        <article className="profile-record-card" key={card.label}>
          <div className="profile-record-icon">{card.icon}</div>
          <div className="profile-record-value">{card.value}</div>
          <h3>{card.label}</h3>
          <p>{card.detail}</p>
        </article>
      ))}
    </div>
  </section>

  <section className="profile-latest-section">
    <div className="profile-section-title">
      <div>
        <span className="profile-eyebrow">LATEST SAVED RESULTS</span>
        <h2>Recent Wellness Details</h2>
      </div>
    </div>

    <div className="profile-latest-grid">
      <article className="profile-latest-card">
        <span className="profile-latest-icon">🧠</span>
        <div>
          <span>Latest Stress Result</span>
          <strong>
            {wellnessData.latestStress?.prediction ||
              "No assessment yet"}
          </strong>
          <p>
            {wellnessData.latestStress?.stressScore !== undefined &&
            wellnessData.latestStress?.stressScore !== null
              ? `Stress score: ${wellnessData.latestStress.stressScore}/10`
              : "Complete a stress assessment to record a result."}
          </p>
          {wellnessData.latestStress?.date && (
            <small>
              Date: {wellnessData.latestStress.date}
            </small>
          )}
        </div>
      </article>

      <article className="profile-latest-card">
        <span className="profile-latest-icon">🌙</span>
        <div>
          <span>Latest Sleep Record</span>
          <strong>
            {wellnessData.latestSleep?.duration !== undefined
              ? `${wellnessData.latestSleep.duration} hours`
              : "No sleep record yet"}
          </strong>
          <p>
            {wellnessData.latestSleep?.quality !== undefined
              ? `Sleep quality: ${wellnessData.latestSleep.quality}/5`
              : "Record your sleep to view details here."}
          </p>
          {wellnessData.latestSleep?.date && (
            <small>Date: {wellnessData.latestSleep.date}</small>
          )}
        </div>
      </article>
    </div>
  </section>

  <div className="profile-privacy-note">
    <span>🔒</span>
    <p>
      Your profile and summary are read from local browser storage.
      This page does not display passwords or send your profile to an
      external AI service.
    </p>
  </div>
</div>

);
}

export default MyProfile;
