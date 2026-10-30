import { API_BASE_URL } from "../api";
import { useEffect, useMemo, useState } from "react";
import "./NutritionLogger.css";
import foodDatabase from "../data/indianFoodDatabase.json";
import { useNavigate } from "react-router-dom";

const NUTRITION_HISTORY_KEY = "mindnutri_nutrition_history";
const WATER_KEY = "mindnutri_water";
const WATER_HISTORY_KEY = "mindnutri_water_history";
const PROFILE_KEY = "mindnutri_user_profile";

const mealTypes = ["Breakfast", "Lunch", "Evening Snack", "Dinner"];

const categories = [
  "All",
  "Rice & Grains",
  "Roti & Bread",
  "Dal & Curries",
  "Vegetables",
  "Maharashtrian",
  "Non-Veg",
  "Dairy",
  "Fruits",
  "Snacks",
  "Indian Sweets",
  "Bhakri",
];

const findFood = (words) => {
  const list = Array.isArray(foodDatabase) ? foodDatabase : [];
  return list.find((food) =>
    words.some((word) => String(food.name || "").toLowerCase().includes(word))
  );
};

function NutritionLogger() {
  const navigate = useNavigate();
  const [selectedMeal, setSelectedMeal] = useState("Breakfast");
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAllCategoryFoods, setShowAllCategoryFoods] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [foodRecognition, setFoodRecognition] = useState(null);
  const [recognitionLoading, setRecognitionLoading] = useState(false);
  const [recognitionError, setRecognitionError] = useState("");
  const [history, setHistory] = useState([]);
  const [water, setWater] = useState(0);
  const [waterUnit, setWaterUnit] = useState("glasses");
  const [litreInput, setLitreInput] = useState("");
  const [workoutStatus, setWorkoutStatus] = useState("");
  const [nutritionGoal, setNutritionGoal] = useState("");
  const [showMoreRecommendations, setShowMoreRecommendations] = useState(false);
  const [customFoodOpen, setCustomFoodOpen] = useState(false);
  const [customFoodName, setCustomFoodName] = useState("");
  const [customFoodIngredients, setCustomFoodIngredients] = useState("");
  const [customNutrition, setCustomNutrition] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
  });
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  const targets = useMemo(() => {
    if (workoutStatus === "Yes" && nutritionGoal === "Build Muscle") {
      return { calories: 2200, protein: 100, carbs: 275, fat: 70, fiber: 32, water: 8 };
    }
    if (workoutStatus === "Yes" && nutritionGoal === "Improve Energy") {
      return { calories: 2100, protein: 90, carbs: 270, fat: 65, fiber: 30, water: 8 };
    }
    if (workoutStatus === "Yes") {
      return { calories: 2100, protein: 90, carbs: 260, fat: 65, fiber: 30, water: 8 };
    }
    if (nutritionGoal === "Build Muscle") {
      return { calories: 2100, protein: 85, carbs: 260, fat: 65, fiber: 30, water: 8 };
    }
    if (nutritionGoal === "Improve Energy") {
      return { calories: 2000, protein: 75, carbs: 250, fat: 65, fiber: 30, water: 8 };
    }
    return { calories: 2000, protein: 80, carbs: 250, fat: 65, fiber: 30, water: 8 };
  }, [workoutStatus, nutritionGoal]);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem(NUTRITION_HISTORY_KEY) || "[]");
      if (Array.isArray(savedHistory)) setHistory(savedHistory);

      const savedWater = Number(localStorage.getItem(WATER_KEY));
      if (Number.isFinite(savedWater)) setWater(Math.max(0, Math.min(8, savedWater)));

      const savedProfile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
      if (savedProfile) setProfile(savedProfile);
    } catch (error) {
      console.error("Unable to load nutrition data:", error);
    }
  }, []);

  const todayHistory = useMemo(
    () => history.filter((entry) => entry?.date === today),
    [history, today]
  );

  const totals = useMemo(
    () =>
      todayHistory.reduce(
        (sum, item) => ({
          calories: sum.calories + Number(item.calories || 0),
          protein: sum.protein + Number(item.protein || 0),
          carbs: sum.carbs + Number(item.carbs || 0),
          fat: sum.fat + Number(item.fat || 0),
          fiber: sum.fiber + Number(item.fiber || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      ),
    [todayHistory]
  );

  const categoryCount = useMemo(
    () => new Set(todayHistory.map((item) => item.category)).size,
    [todayHistory]
  );

  const categoryMatches = (food, category) => {
    if (category === "All") return true;

    const name = String(food.name || "").toLowerCase();
    const dbCategory = String(food.category || "").toLowerCase();

    if (category === "Rice & Grains") {
      return (
        dbCategory === "rice & grains" ||
        name.includes("rice") ||
        name.includes("poha") ||
        name.includes("upma") ||
        name.includes("dalia")
      );
    }

    if (category === "Roti & Bread") {
      return (
        dbCategory === "roti & bread" ||
        name.includes("roti") ||
        name.includes("chapati") ||
        name.includes("paratha") ||
        name.includes("bread")
      );
    }

    if (category === "Dal & Curries") {
      return (
        dbCategory === "dal & curries" ||
        name.includes("dal") ||
        name.includes("rajma") ||
        name.includes("chole") ||
        name.includes("curry")
      );
    }

    if (category === "Vegetables") {
      return dbCategory === "vegetables";
    }

    if (category === "Maharashtrian") {
      return dbCategory === "maharashtrian";
    }

    if (category === "Non-Veg") {
      return (
        dbCategory === "non-veg" ||
        name.includes("egg") ||
        name.includes("chicken") ||
        name.includes("fish") ||
        name.includes("mutton")
      );
    }

    if (category === "Dairy") {
      return (
        dbCategory === "dairy" ||
        name.includes("milk") ||
        name.includes("curd") ||
        name.includes("paneer") ||
        name.includes("lassi") ||
        name.includes("buttermilk") ||
        name.includes("shrikhand")
      );
    }

    if (category === "Fruits") {
      return dbCategory === "fruits";
    }

    if (category === "Snacks") {
      return dbCategory === "snacks";
    }

    if (category === "Indian Sweets") {
      return dbCategory === "indian sweets";
    }

    if (category === "Bhakri") {
      return name.includes("bhakri");
    }

    return false;
  };

  
  const filteredFoods = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    const databaseResults = foodDatabase.filter((food) => {
      const categoryMatch = categoryMatches(food, selectedCategory);

      const foodName = String(food.name || "").toLowerCase();
      const foodCategory = String(food.category || "").toLowerCase();

      const searchMatch =
        !search ||
        foodName.includes(search) ||
        foodCategory.includes(search);

      return categoryMatch && searchMatch;
    });

    // Add the recognized food to search results if it is
    // missing from the local Indian food database.
    const recognizedName = String(
      foodRecognition?.recognized_food || ""
    ).trim().toLowerCase();

    if (
      search &&
      foodRecognition?.status === "success" &&
      recognizedName &&
      (recognizedName.includes(search) || search.includes(recognizedName))
    ) {
      const alreadyExists = databaseResults.some(
        (food) => String(food.name || "").trim().toLowerCase() === recognizedName
      );

      if (!alreadyExists && foodRecognition.nutrition_available) {
        databaseResults.unshift({
          name: foodRecognition.recognized_food,
          
        emoji: (() => {
          const name = foodRecognition.recognized_food.toLowerCase();

          if (/sweet potato|shakarkand|ratale/.test(name)) return "🍠";
          if (/broccoli/.test(name)) return "🥦";
          if (/strawberr/.test(name)) return "🍓";
          if (/beetroot|beet/.test(name)) return "🫜";

          if (/banana|kela|kele/.test(name)) return "🍌";
          if (/apple|seb/.test(name)) return "🍎";
          if (/mango|aam|amba/.test(name)) return "🥭";
          if (/orange|santra/.test(name)) return "🍊";
          if (/grape|draksha|angoor/.test(name)) return "🍇";
          if (/watermelon|tarbuj|kalingad/.test(name)) return "🍉";
          if (/pineapple|ananas/.test(name)) return "🍍";
          if (/papaya|papita/.test(name)) return "🍈";
          if (/guava|peru|amrood/.test(name)) return "🍐";
          if (/pomegranate|dalimb|anar/.test(name)) return "❤️";

          if (/potato|aloo|alu|batata/.test(name)) return "🥔";
          if (/tomato|tamatar/.test(name)) return "🍅";
          if (/carrot|gajar/.test(name)) return "🥕";
          if (/onion|kanda|pyaz/.test(name)) return "🧅";
          if (/spinach|palak/.test(name)) return "🥬";
          if (/cauliflower|gobi/.test(name)) return "🥦";
          if (/cabbage|patta gobi/.test(name)) return "🥬";
          if (/cucumber|kakdi|kheera/.test(name)) return "🥒";
          if (/brinjal|baingan|vangi|eggplant|aubergine/.test(name)) return "🍆";
          if (/corn|maize/.test(name)) return "🌽";
          if (/peas|matar/.test(name)) return "🫛";

          if (/rice|poha/.test(name)) return "🍚";
          if (/roti|chapati|paratha/.test(name)) return "🫓";
          if (/dal|lentil|beans|rajma|chana/.test(name)) return "🥣";
          if (/egg/.test(name)) return "🥚";
          if (/milk|curd|yogurt|paneer|cheese/.test(name)) return "🥛";
          if (/chicken|fish|salmon|meat/.test(name)) return "🍗";
          if (/almond|nut|peanut|cashew/.test(name)) return "🥜";
          if (/oat/.test(name)) return "🥣";

          return "🍽️";
        })(),

          category: "Vegetables",
          calories: foodRecognition.nutrition_per_100g.calories,
          protein: foodRecognition.nutrition_per_100g.protein,
          carbs: foodRecognition.nutrition_per_100g.carbs,
          fat: foodRecognition.nutrition_per_100g.fat,
          fiber: foodRecognition.nutrition_per_100g.fiber,
          serving: "100g",
          recognizedByLocalEngine: true,
        });
      }
    }

    return databaseResults;
  }, [searchText, selectedCategory, foodRecognition]);

  
  const mealFoods = useMemo(() => {
    const searchActive = searchText.trim().length > 0;
    const categoryActive = selectedCategory !== "All";

    if (!searchActive && !categoryActive) {
      const preferred = [
        findFood(["oat"]),
        findFood(["boiled egg", "egg"]),
        findFood(["banana"]),
      ].filter(Boolean);

      return showAllCategoryFoods
        ? filteredFoods
        : preferred.slice(0, 3);
    }

    return showAllCategoryFoods
      ? filteredFoods
      : filteredFoods.slice(0, 3);
  }, [
    filteredFoods,
    searchText,
    selectedCategory,
    showAllCategoryFoods,
  ]);

  const recommendedFoods = useMemo(() => {
    const preferredFoods =
      nutritionGoal === "Build Muscle"
        ? [
            { label: "Paneer", words: ["paneer"] },
            { label: "Eggs", words: ["egg"] },
            { label: "Chicken", words: ["chicken"] },
            { label: "Fish", words: ["fish"] },
            { label: "Milk", words: ["milk"] },
            { label: "Curd", words: ["curd", "yogurt"] },
            { label: "Tofu", words: ["tofu"] },
            { label: "Soya Chunks", words: ["soya chunks", "soy chunks"] },
            { label: "Soybeans", words: ["soybean", "soy beans"] },
            { label: "Dal", words: ["dal", "lentils"] },
            { label: "Chickpeas", words: ["chickpea", "chana", "chole"] },
            { label: "Rajma", words: ["rajma", "kidney beans"] },
            { label: "Sprouts", words: ["sprouts", "sprout"] },
            { label: "Peanuts", words: ["peanut", "groundnut"] },
            { label: "Almonds", words: ["almond"] },
            { label: "Pumpkin Seeds", words: ["pumpkin seed"] },
          ]
        : nutritionGoal === "Improve Energy"
          ? [
              { label: "Oats", words: ["oats", "oat"] },
              { label: "Banana", words: ["banana"] },
              { label: "Apple", words: ["apple"] },
              { label: "Orange", words: ["orange"] },
              { label: "Poha", words: ["poha"] },
              { label: "Upma", words: ["upma"] },
              { label: "Brown Rice", words: ["brown rice"] },
              { label: "Whole Wheat Roti", words: ["whole wheat roti", "chapati", "roti"] },
              { label: "Jowar", words: ["jowar"] },
              { label: "Bajra", words: ["bajra"] },
              { label: "Sweet Potato", words: ["sweet potato"] },
              { label: "Potato", words: ["potato"] },
              { label: "Corn", words: ["corn", "maize"] },
              { label: "Dalia", words: ["dalia", "broken wheat"] },
              { label: "Dates", words: ["dates", "date"] },
              { label: "Raisins", words: ["raisins", "raisin"] },
              { label: "Peanuts", words: ["peanut", "groundnut"] },
            ]
          : [
              { label: "Eggs", words: ["egg"] },
              { label: "Dal", words: ["dal", "lentils"] },
              { label: "Sprouts", words: ["sprouts", "sprout"] },
              { label: "Curd", words: ["curd", "yogurt"] },
              { label: "Paneer", words: ["paneer"] },
              { label: "Tofu", words: ["tofu"] },
              { label: "Chickpeas", words: ["chickpea", "chana", "chole"] },
              { label: "Rajma", words: ["rajma", "kidney beans"] },
              { label: "Oats", words: ["oats", "oat"] },
              { label: "Brown Rice", words: ["brown rice"] },
              { label: "Whole Wheat Roti", words: ["whole wheat roti", "chapati", "roti"] },
              { label: "Seasonal Fruits", words: ["fruit", "apple", "banana", "orange"] },
              { label: "Green Vegetables", words: ["spinach", "broccoli", "green vegetable"] },
              { label: "Carrots", words: ["carrot"] },
              { label: "Nuts", words: ["almond", "peanut", "cashew", "walnut"] },
              { label: "Seeds", words: ["seed", "pumpkin seed", "chia"] },
            ];

    const isAvailableForGoal = (item) => {
      return preferredFoods.some((preferredFood) =>
        item.words.some((foodWord) =>
          preferredFood.words.some(
            (word) =>
              foodWord.toLowerCase().includes(word.toLowerCase()) ||
              word.toLowerCase().includes(foodWord.toLowerCase())
          )
        )
      );
    };

    return preferredFoods
      .filter(isAvailableForGoal)
      .map((item) => {
        const food = foodDatabase.find(
          (entry) => String(entry.name || "").trim().toLowerCase() === item.label.toLowerCase()
        ) || foodDatabase.find((entry) =>
          item.words.some((word) =>
            String(entry.name || "").toLowerCase().includes(word)
          )
        );

        return food ? { ...food, recommendationLabel: item.label } : null;
      })
      .filter(Boolean)
      .filter((food, index, list) =>
        list.findIndex((item) => item.id === food.id || item.name === food.name) === index
      )
      .filter((food) => {
        const alreadyLogged = todayHistory.some(
          (item) => String(item.food || "").toLowerCase() === String(food.name || "").toLowerCase()
        );
        return !alreadyLogged;
      });
  }, [nutritionGoal, todayHistory]);

  const quickMealIdeas = useMemo(() => {
    const candidates = [
      ["Oats Bowl", ["oat"]],
      ["Banana Smoothie", ["banana"]],
      ["Veg Sandwich", ["sandwich", "vegetable"]],
      ["Paneer Salad", ["paneer"]],
      ["Roti + Dal", ["roti", "dal"]],
    ];
    return candidates
      .map(([label, words]) => ({ label, food: findFood(words) }))
      .filter((item) => item.food)
      .slice(0, 5);
  }, []);

  const nutritionScore = useMemo(() => {
    if (!todayHistory.length) return 0;
    const calorieScore = Math.min((totals.calories / targets.calories) * 100, 100);
    const proteinScore = Math.min((totals.protein / targets.protein) * 100, 100);
    const fiberScore = Math.min((totals.fiber / targets.fiber) * 100, 100);
    const hydrationScore = Math.min((water / targets.water) * 100, 100);
    const varietyScore = Math.min(categoryCount * 20, 100);
    return Math.round(
      calorieScore * 0.3 + proteinScore * 0.2 + fiberScore * 0.15 + hydrationScore * 0.15 + varietyScore * 0.2
    );
  }, [todayHistory, totals, targets, water, categoryCount]);

  const nutritionInsight = useMemo(() => {
    if (!todayHistory.length) {
      return {
        title: "Start your nutrition journey",
        text: "Log your first meal to see an insight based on your actual nutrition data.",
        highlights: ["No meals logged yet", "Your daily targets are ready", "Start with one balanced meal"],
      };
    }

    const highlights = [
      `Protein intake: ${totals.protein.toFixed(1)} g (${Math.round((totals.protein / targets.protein) * 100)}% of target)`,
      `Calorie intake: ${Math.round(totals.calories)} kcal (${Math.round((totals.calories / targets.calories) * 100)}% of target)`,
    ];

    if (totals.protein < targets.protein * 0.6) {
      return {
        title: "Your protein intake is slightly low today.",
        text: "Try adding a protein-rich food such as eggs, paneer, sprouts, dal, curd or milk to your next meal.",
        highlights: [...highlights, "Add a protein-rich food to your next meal"],
      };
    }

    if (totals.calories < targets.calories * 0.6) {
      return {
        title: "Your calorie intake is still low today.",
        text: "A balanced meal with a grain, protein source, vegetables and healthy fats can help you move toward your target.",
        highlights: [...highlights, "Add a balanced meal rather than only a snack"],
      };
    }

    return {
      title: "You're doing great!",
      text: "Your logged nutrition is progressing well. Keep meals varied and continue choosing nutrient-rich foods.",
      highlights: [...highlights, "Good balance of your logged nutrients"],
    };
  }, [todayHistory, totals, targets]);

  const customFoodMatches = useMemo(() => {
    const ingredients = customFoodIngredients
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    return ingredients
      .map((ingredient) =>
        foodDatabase.find((food) => String(food.name || "").toLowerCase() === ingredient) ||
        foodDatabase.find((food) => String(food.name || "").toLowerCase().includes(ingredient))
      )
      .filter(Boolean);
  }, [customFoodIngredients]);

  const estimatedCustomNutrition = useMemo(() => {
    if (!customFoodMatches.length) return null;
    return customFoodMatches.reduce(
      (sum, food) => ({
        calories: sum.calories + Number(food.calories || 0),
        protein: sum.protein + Number(food.protein || 0),
        carbs: sum.carbs + Number(food.carbs || 0),
        fat: sum.fat + Number(food.fat || 0),
        fiber: sum.fiber + Number(food.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [customFoodMatches]);

  const saveHistory = (updated) => {
    localStorage.setItem(NUTRITION_HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const addFood = (food, meal = selectedMeal) => {
    if (!food) return;
    const safeQuantity = Math.max(1, Math.min(10, Math.round(Number(quantity) || 1)));
    const entry = {
      id: Date.now() + Math.random(),
      date: today,
      meal,
      foodId: food.id,
      food: food.name,
      emoji: food.emoji,
      category: food.category,
      quantity: safeQuantity,
      calories: Math.round(Number(food.calories || 0) * safeQuantity),
      protein: Number((Number(food.protein || 0) * safeQuantity).toFixed(1)),
      carbs: Number((Number(food.carbs || 0) * safeQuantity).toFixed(1)),
      fat: Number((Number(food.fat || 0) * safeQuantity).toFixed(1)),
      fiber: Number((Number(food.fiber || 0) * safeQuantity).toFixed(1)),
      timestamp: new Date().toISOString(),
    };
    try {
      saveHistory([entry, ...history].slice(0, 100));
      setSelectedFood(null);
      setQuantity(1);
      setMessage(`${food.name} added to ${meal}.`);
    } catch (error) {
      console.error("Unable to save food:", error);
      setMessage("Unable to save this food on your device.");
    }
  };
  
  const handleRecognizeFood = async () => {
    const foodName = searchText.trim();

    if (!foodName) {
      setRecognitionError("Please enter a food name.");
      setFoodRecognition(null);
      return;
    }

    setRecognitionLoading(true);
    setRecognitionError("");
    setFoodRecognition(null);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-food`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ food_name: foodName }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Food recognition failed.");
      }

      if (result.status === "success") {
        setFoodRecognition(result);

        if (!result.nutrition_available) {
          setRecognitionError(
            result.message || "Food recognized, but nutrition data is unavailable."
          );
        }
      } else {
        setRecognitionError(
          result.message || "Food could not be recognized. Try another name."
        );
      }
    } catch (error) {
      setRecognitionError(
        error.message || "Could not connect to the local nutrition server."
      );
    } finally {
      setRecognitionLoading(false);
    }
  };


  const handleAddSelectedFood = () => {
    if (!selectedFood) {
      setMessage("Select a food first.");
      return;
    }
    addFood(selectedFood);
  };

  const deleteFood = (id) => {
    try {
      saveHistory(history.filter((item) => item.id !== id));
      setMessage("Food entry removed.");
    } catch (error) {
      console.error(error);
    }
  };

  const updateWater = (value) => {
    const newWater = Math.max(0, Number(value) || 0);

    setWater(newWater);

    try {
      localStorage.setItem(WATER_KEY, String(newWater));

      const oldHistory = JSON.parse(
        localStorage.getItem(WATER_HISTORY_KEY) || "[]"
      );

      const safeHistory = Array.isArray(oldHistory) ? oldHistory : [];

      const entry = {
        date: today,
        glasses: newWater,
        litres: Number((newWater * 0.25).toFixed(2)),
        timestamp: new Date().toISOString(),
      };

      const updated = safeHistory.some((item) => item.date === today)
        ? safeHistory.map((item) =>
            item.date === today ? entry : item
          )
        : [entry, ...safeHistory];

      localStorage.setItem(
        WATER_HISTORY_KEY,
        JSON.stringify(updated.slice(0, 90))
      );
    } catch (error) {
      console.error("Unable to save water:", error);
    }
  };

  const handleAddCustomFood = () => {
    const name = customFoodName.trim();
    if (!name) {
      setMessage("Please enter a custom food name.");
      return;
    }

    const nutrition = estimatedCustomNutrition || {
      calories: Number(customNutrition.calories),
      protein: Number(customNutrition.protein),
      carbs: Number(customNutrition.carbs),
      fat: Number(customNutrition.fat),
      fiber: Number(customNutrition.fiber),
    };

    if ([nutrition.calories, nutrition.protein, nutrition.carbs, nutrition.fat, nutrition.fiber].some((value) => !Number.isFinite(value) || value < 0)) {
      setMessage("Add matching ingredients or enter valid nutrition values.");
      return;
    }

    const entry = {
      id: Date.now() + Math.random(),
      date: today,
      meal: selectedMeal,
      foodId: `custom-${Date.now()}`,
      food: name,
      emoji: "🍽️",
      category: "Custom Food",
      quantity: 1,
      calories: Math.round(nutrition.calories),
      protein: Number(nutrition.protein.toFixed(1)),
      carbs: Number(nutrition.carbs.toFixed(1)),
      fat: Number(nutrition.fat.toFixed(1)),
      fiber: Number(nutrition.fiber.toFixed(1)),
      nutritionSource: estimatedCustomNutrition ? "Estimated from matched local ingredients" : "User provided",
      timestamp: new Date().toISOString(),
    };

    try {
      saveHistory([entry, ...history].slice(0, 100));
      setCustomFoodOpen(false);
      setCustomFoodName("");
      setCustomFoodIngredients("");
      setCustomNutrition({ calories: "", protein: "", carbs: "", fat: "", fiber: "" });
      setMessage(`${name} added to ${selectedMeal}.`);
    } catch (error) {
      console.error(error);
      setMessage("Unable to save custom food.");
    }
  };

  const initials = String(profile?.name || profile?.fullName || "MP")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const displayName = profile?.name || profile?.fullName || "Mayuri Patil";
  const progress = (value, target) => Math.min(100, Math.max(0, Math.round((value / target) * 100)));
  const dateLabel = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="nutrition-page">
      <div className="nutrition-container">
        <header className="nutrition-header">
          <div className="nutrition-brand">
            <div className="nutrition-brand-mark">🌿</div>
            <div>
              <h1>Nutrition</h1>
              <p>Track <span>•</span> Understand <span>•</span> Improve</p>
            </div>
          </div>
          
          <div className="nutrition-header-actions">
            <button
              type="button"
              className="back-to-dashboard-btn"
              onClick={() => navigate("/dashboard")}
            >
              <span aria-hidden="true">←</span>
              Back to Dashboard
            </button>
          </div>

        </header>

        <section className="nutrition-overview">
          <div className="overview-heading">
            <div>
              <div className="section-title-row"><span className="section-target-icon">◎</span><div><h2>Today's Nutrition Overview</h2><p>Your daily nutrition at a glance</p></div></div>
            </div>
            <button className="target-button" type="button">Daily Targets <span>⌄</span></button>
          </div>

          <div className="nutrition-stat-grid">
            {[
              ["Calories", totals.calories, targets.calories, "kcal", "🔥", "#4f9d75"],
              ["Protein", totals.protein, targets.protein, "g", "💪", "#8a67d4"],
              ["Carbs", totals.carbs, targets.carbs, "g", "🌾", "#e9a72e"],
              ["Fat", totals.fat, targets.fat, "g", "💧", "#e45a78"],
              ["Water", water, targets.water, "glasses", "💧", "#298be8"],
            ].map(([label, value, target, unit, emoji, accent]) => (
              <div className="nutrition-stat-card" key={label}>
                <div className="stat-ring" style={{ "--ring": accent, "--value": `${progress(value, target)}%` }}>
                  <div className="stat-ring-inner"><span>{emoji}</span><strong>{label === "Calories" ? Math.round(value) : Number(value).toFixed(label === "Water" ? 0 : 0)}</strong><small>/ {target}</small><em>{unit}</em></div>
                </div>
                <div className="stat-progress"><span style={{ width: `${progress(value, target)}%`, background: accent }} /></div>
                <b>{progress(value, target)}%</b>
                <h3>{label}</h3>
              </div>
            ))}
          </div>
        </section>

        <div className="nutrition-main-grid">
          <section className="nutrition-card meal-card">
            <div className="card-title-line">
              <div>
                <h2>🍴 &nbsp;Log Your Meal</h2>
              </div>
            </div>
            <div className="meal-tabs">
              {mealTypes.map((meal) => <button key={meal} type="button" className={selectedMeal === meal ? "active" : ""} onClick={() => setSelectedMeal(meal)}>{meal === "Evening Snack" ? "Snack" : meal}</button>)}
            </div>
            
            <div className="food-search-wrap">
              <span>⌕</span>
              <input
                value={searchText}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchText(value);
                  setSelectedFood(null);

                  if (!value.trim()) {
                    setFoodRecognition(null);
                    setRecognitionError("");
                  }
                }}
                placeholder="Search for food..."
              />
              <span>≡</span>
            </div>

            <div className="food-recognition-panel">
              <button
                type="button"
                className="food-recognition-button"
                onClick={handleRecognizeFood}
                disabled={recognitionLoading || !searchText.trim()}
              >
                {recognitionLoading ? "Recognizing..." : "Recognize Food"}
              </button>

              {recognitionError && (
                <p className="food-recognition-message">{recognitionError}</p>
              )}

              {foodRecognition && (
                <div className="food-recognition-result">
                  <strong>
                    Recognized: {foodRecognition.recognized_food}
                  </strong>

                  <p>
                    Match type: Local Food Match
                    {" · "}
                    Confidence:{" "}
                    {Math.round((foodRecognition.confidence || 0) * 100)}%
                  </p>

                  {!foodRecognition.nutrition_available && (
                    <p>Nutrition information is not available in the local database.</p>
                  )}
                </div>
              )}
            </div>

            <div className="food-category-list compact">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={selectedCategory === category ? "active" : ""}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedFood(null);
                    setShowAllCategoryFoods(false);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="food-list-heading">
              <span>
                {selectedCategory === "All"
                  ? searchText.trim()
                    ? "Search Results"
                    : "Popular Foods"
                  : selectedCategory}
              </span>

              {filteredFoods.length > 3 && (
                <button
                  type="button"
                  className="food-expand-arrow"
                  onClick={() =>
                    setShowAllCategoryFoods((previous) => !previous)
                  }
                  aria-label={
                    showAllCategoryFoods
                      ? "Show fewer foods"
                      : "Show more foods"
                  }
                  title={
                    showAllCategoryFoods
                      ? "Show fewer foods"
                      : "Show more foods"
                  }
                >
                  {showAllCategoryFoods ? "⌃" : "›"}
                </button>
              )}
            </div>
            <div className="meal-food-grid">
              {mealFoods.length > 0 ? (
                mealFoods.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    className={`meal-food ${
                      selectedFood?.id === food.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedFood(food)}
                  >
                    <span className="meal-food-image">
                      {food.emoji || "🍽️"}
                    </span>

                    <strong>{food.name}</strong>

                    <small>
                      {food.calories} kcal • {food.protein}g P
                    </small>

                    <i>+</i>
                  </button>
                ))
              ) : (
                <div className="no-food-results">
                  <span>🔎</span>
                  <b>No food found</b>
                  <small>
                    Try another food name or select a different category.
                  </small>
                </div>
              )}
            </div>
            {selectedFood && <div className="selected-food-row"><div><b>{selectedFood.emoji} {selectedFood.name}</b><span>{selectedFood.calories} kcal / serving</span></div><div className="quantity-control"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button></div><button className="add-selected" type="button" onClick={handleAddSelectedFood}>Add Meal</button></div>}
            <button type="button" className="custom-food-row" onClick={() => setCustomFoodOpen(true)}><span>+</span><div><b>Add Custom Food</b><small>Can't find your food? Add it here and get nutrition info!</small></div><strong>›</strong></button>
            {message && <p className="nutrition-message">{message}</p>}
          </section>

          <section className="nutrition-card guide-card">
            <div className="card-title-line"><div><h2>✨ &nbsp;Your Nutrition Guide</h2><p>Personalized suggestions based on your goals and activity.</p></div><button type="button" className="edit-guide">↗ Edit</button></div>
            <label className="guide-label">Do you work out or go to the gym?</label>
            <div className="workout-grid">
              <button type="button" className={workoutStatus === "Yes" ? "active" : ""} onClick={() => setWorkoutStatus("Yes")}>🏋️ &nbsp; Yes, I work out</button>
              <button type="button" className={workoutStatus === "No" ? "active" : ""} onClick={() => setWorkoutStatus("No")}>🌿 &nbsp; No, I don't</button>
            </div>
            <label className="guide-label">What is your main goal?</label>
            <div className="goal-grid">
              {["Build Muscle", "Improve Energy", "Maintain Fitness"].map((goal) => <button key={goal} type="button" className={nutritionGoal === goal ? "active" : ""} onClick={() => setNutritionGoal(goal)}>{goal === "Build Muscle" ? "♧" : goal === "Improve Energy" ? "⚡" : "♟"} &nbsp; {goal}<small>{goal === "Build Muscle" ? "(Higher Protein)" : ""}</small></button>)}
            </div>
            <div className="guide-recommendations">
              <div className="guide-recommendation-heading">
                <b>Recommended Foods for You</b>

                <button
                  type="button"
                  className="recommendations-view-more"
                  onClick={() => setShowMoreRecommendations((previous) => !previous)}
                >
                  {showMoreRecommendations ? "View Less ↑" : "View More →"}
                </button>
              </div>
              <div className="recommended-row">
                {recommendedFoods.length ? (
                  recommendedFoods
                    .slice(0, showMoreRecommendations ? recommendedFoods.length : 5)
                    .map((food) => (
                      <button
                        key={food.id || food.name}
                        type="button"
                        title={`Select ${food.recommendationLabel || food.name}`}
                        onClick={() => {
                          setSelectedFood(food);
                          setSearchText("");
                        }}
                      >
                        <span>{food.emoji || "🍽️"}</span>
                        <b>{food.recommendationLabel || food.name}</b>
                      </button>
                    ))
                ) : (
                  <p>
                    No matching foods are available in your local database for this goal yet.
                  </p>
                )}
              </div>
            </div>
            <div className="guide-insight"><span>💡</span><div><b>{totals.protein < targets.protein * 0.6 ? "Your protein intake is slightly low today." : "Your nutrition is progressing well today."}</b><p>{totals.protein < targets.protein * 0.6 ? "Try adding protein-rich foods like eggs, paneer, sprouts or milk to your next meal." : "Keep your meals varied and continue choosing nutrient-rich foods."}</p></div></div>
          </section>
        </div>

        <section className="nutrition-insight-card">
          <div className="insight-heading"><span>💡</span><div><h2>Today's Nutrition Insight</h2><p>Based on your actual logged nutrition data</p></div></div>
          <div className="insight-content">
            <div className="insight-main"><div className="insight-target">◎</div><div><b>{nutritionInsight.title}</b><p>{nutritionInsight.text}</p></div></div>
            <div className="key-highlights"><h3>Key Highlights</h3>{nutritionInsight.highlights.map((item) => <p key={item}>● &nbsp;{item}</p>)}</div>
            <div className="insight-note">Better food<br />Better mood<br /><span>♥</span></div>
          </div>
        </section>

        <div className="bottom-wellness-grid">
          <section className="hydration-card">

            <h2>💧 Hydration</h2>

            <div className="hydration-goal">
              <p>Today's Goal</p>

              <div className="hydration-unit-toggle">
                <button
                  type="button"
                  className={waterUnit === "glasses" ? "active" : ""}
                  onClick={() => setWaterUnit("glasses")}
                >
                  Glasses
                </button>

                <button
                  type="button"
                  className={waterUnit === "litres" ? "active" : ""}
                  onClick={() => setWaterUnit("litres")}
                >
                  Litres
                </button>
              </div>

              {waterUnit === "glasses" ? (
                <div>
                  <strong>{water}</strong>
                  <span> / {targets.water} glasses</span>
                  <p>{(water * 0.25).toFixed(2)} litres consumed</p>
                </div>
              ) : (
                <div>
                  <strong>{(water * 0.25).toFixed(2)} L</strong>
                  <p>{water} glasses consumed</p>

                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={litreInput}
                    onChange={(e) => setLitreInput(e.target.value)}
                    placeholder="Enter litres consumed"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const litres = Number(litreInput);
                      if (litreInput.trim() !== "" && Number.isFinite(litres) && litres >= 0) {
                        updateWater(Math.round(litres * 4));
                        setLitreInput("");
                      }
                    }}
                  >
                    Save Litres
                  </button>
                </div>
              )}
            </div>

            <div className="hydration-progress"><span style={{ width: `${progress(water, targets.water)}%` }} /></div><b className="hydration-percent">{progress(water, targets.water)}%</b>
            <div className="hydration-controls">
              <button
                type="button"
                onClick={() => updateWater(Math.max(0, water - 1))}
                disabled={water <= 0}
                aria-label="Remove one glass of water"
              >
                −
              </button>

              <button
                type="button"
                onClick={() => updateWater(water + 1)}
                aria-label="Add one glass of water"
              >
                ＋ Add Glass
              </button>
            </div>
            <div className="hydration-note"><span>💧</span><div><b>{water >= 5 ? "Great! You're on track." : "Keep sipping!"}</b><p>Small, regular water breaks help you stay hydrated.</p></div></div>
          </section>
          <section className="food-hero-card"><div className="hero-leaves">🌿</div><div className="hero-bowl">🥗</div><div className="hero-copy"><b>Good food<br />fuels your goals</b><p>Eat well &nbsp;·&nbsp; Feel better &nbsp;·&nbsp; Be your best</p><span>♥</span></div></section>
        </div>

        {todayHistory.length > 0 && (
          <details className="logged-meals-details"><summary>Today's logged meals ({todayHistory.length})</summary><div>{todayHistory.map((item) => <article key={item.id}><span>{item.emoji || "🍽️"}</span><b>{item.food}</b><small>{item.meal} · {item.quantity} serving · {item.calories} kcal</small><button type="button" onClick={() => deleteFood(item.id)}>Remove</button></article>)}</div></details>
        )}

        {customFoodOpen && (
          <div className="custom-food-overlay" role="dialog" aria-modal="true">
            <div className="custom-food-modal">
              <div className="custom-modal-head"><div><span>ADD CUSTOM FOOD</span><h2>Add your own food</h2><p>Use local database ingredients for an estimated calculation. No random nutrition values are generated.</p></div><button type="button" onClick={() => setCustomFoodOpen(false)}>×</button></div>
              <label>Food name</label><input value={customFoodName} onChange={(e) => setCustomFoodName(e.target.value)} placeholder="e.g. Homemade Paneer Sandwich" />
              <label>Ingredients, comma separated</label><input value={customFoodIngredients} onChange={(e) => setCustomFoodIngredients(e.target.value)} placeholder="e.g. Paneer, Roti, Tomato" />
              {estimatedCustomNutrition ? <div className="estimate-box"><b>Estimated from matched local ingredients</b><small>{customFoodMatches.map((food) => food.name).join(" + ")}</small><div>{Math.round(estimatedCustomNutrition.calories)} kcal · {estimatedCustomNutrition.protein.toFixed(1)}g P · {estimatedCustomNutrition.carbs.toFixed(1)}g C · {estimatedCustomNutrition.fat.toFixed(1)}g F · {estimatedCustomNutrition.fiber.toFixed(1)}g fiber</div></div> : <div className="manual-grid">{[["calories","Calories (kcal)"],["protein","Protein (g)"],["carbs","Carbs (g)"],["fat","Fat (g)"],["fiber","Fiber (g)"]].map(([key, label]) => <label key={key}>{label}<input type="number" min="0" step="0.1" value={customNutrition[key]} onChange={(e) => setCustomNutrition((prev) => ({ ...prev, [key]: e.target.value }))} /></label>)}</div>}
              <div className="custom-modal-note">ⓘ Values are estimated only when ingredients match your local food database. Otherwise, enter the nutrition information yourself.</div>
              <div className="custom-modal-actions"><button type="button" onClick={() => setCustomFoodOpen(false)}>Cancel</button><button type="button" onClick={handleAddCustomFood}>Add to {selectedMeal}</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NutritionLogger;
