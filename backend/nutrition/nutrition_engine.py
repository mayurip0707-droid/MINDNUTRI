import re
import difflib
import unicodedata


# ============================================================
# MINDNUTRI LOCAL NUTRITION INTELLIGENCE ENGINE
# ============================================================
#
# Purpose:
# - Understand common food names
# - Handle spelling variations
# - Handle regional/common names
# - Match foods from local nutrition knowledge
# - Estimate nutrition without external AI APIs
#
# No OpenAI / Gemini / ChatGPT / Hugging Face API
# ============================================================


# ============================================================
# TEXT NORMALIZATION
# ============================================================

def normalize_text(text):
    """
    Convert user food input into a clean comparable form.
    """

    if not text:
        return ""

    text = str(text).strip().lower()

    # Remove accents
    text = unicodedata.normalize(
        "NFKD",
        text
    ).encode(
        "ascii",
        "ignore"
    ).decode(
        "ascii"
    )

    # Replace common separators
    text = text.replace("-", " ")
    text = text.replace("_", " ")

    # Remove special characters
    text = re.sub(
        r"[^a-z0-9\s]",
        " ",
        text
    )

    # Remove extra spaces
    text = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    return text


# ============================================================
# COMMON FOOD ALIASES
# ============================================================

FOOD_ALIASES = {

    # --------------------------------------------------------
    # DRINKS
    # --------------------------------------------------------

    "chai": "tea",
    "chaha": "tea",
    "cha": "tea",
    "milk chai": "tea",
    "milk tea": "tea",
    "indian tea": "tea",
    "masala chai": "tea",

    "coffee": "coffee",
    "kaapi": "coffee",
    "kapi": "coffee",

    "dahi": "curd",
    "yogurt": "curd",

    # --------------------------------------------------------
    # INDIAN BREAKFAST
    # --------------------------------------------------------

    "pohe": "poha",
    "poha": "poha",

    "upma": "upma",
    "uppuma": "upma",

    "sabudana khichdi": "sabudana khichdi",
    "sabudana kichdi": "sabudana khichdi",
    "sago khichdi": "sabudana khichdi",

    "thalipeeth": "thalipeeth",
    "thalipith": "thalipeeth",

    # --------------------------------------------------------
    # BREADS
    # --------------------------------------------------------

    "chapati": "chapati",
    "chapatti": "chapati",
    "roti": "roti",
    "rotis": "roti",

    "paratha": "paratha",
    "parantha": "paratha",

    "bhakri": "bhakri",
    "bhakari": "bhakri",

    "jowar bhakri": "jowar bhakri",
    "bajra bhakri": "bajra bhakri",

    # --------------------------------------------------------
    # PROTEIN
    # --------------------------------------------------------

    "anda": "egg",
    "eggs": "egg",

    "boiled egg": "boiled egg",
    "boil egg": "boiled egg",

    "paneer": "paneer",
    "cottage cheese": "paneer",

    # --------------------------------------------------------
    # FRUITS
    # --------------------------------------------------------

    "kela": "banana",
    "kele": "banana",

    "seb": "apple",

    "santra": "orange",
    "narangi": "orange",

    # --------------------------------------------------------
    # DAL / LEGUMES
    # --------------------------------------------------------

    "daal": "dal",
    "dal": "dal",

    "chana dal": "chana dal",
    "toor dal": "toor dal",
    "tuvar dal": "toor dal",

    "rajma": "rajma",
    "kidney beans": "rajma",

    "chole": "chole",
    "chana": "chole",
    "chickpeas": "chole",
}


# ============================================================
# FOOD TYPE KNOWLEDGE
# ============================================================
#
# This is NOT the nutrition database.
#
# This layer helps the engine understand what a food is.
# ============================================================

FOOD_TYPES = {

    "tea": {
        "category": "beverage",
        "description": "common Indian milk tea",
        "serving": "1 cup",
    },

    "coffee": {
        "category": "beverage",
        "description": "common milk coffee",
        "serving": "1 cup",
    },

    "poha": {
        "category": "breakfast",
        "description": "Indian flattened rice breakfast",
        "serving": "1 serving",
    },

    "upma": {
        "category": "breakfast",
        "description": "semolina based Indian breakfast",
        "serving": "1 serving",
    },

    "sabudana khichdi": {
        "category": "breakfast",
        "description": "sago based Indian meal",
        "serving": "1 serving",
    },

    "paratha": {
        "category": "bread",
        "description": "Indian flatbread prepared with wheat flour and cooking fat",
        "serving": "1 piece",
    },

    "roti": {
        "category": "bread",
        "description": "Indian wheat flatbread",
        "serving": "1 piece",
    },

    "chapati": {
        "category": "bread",
        "description": "Indian wheat flatbread",
        "serving": "1 piece",
    },

    "bhakri": {
        "category": "bread",
        "description": "traditional Indian millet/jowar/bajra flatbread",
        "serving": "1 piece",
    },

    "paneer": {
        "category": "dairy_protein",
        "description": "Indian cottage cheese",
        "serving": "100 g",
    },

    "egg": {
        "category": "protein",
        "description": "whole egg",
        "serving": "1 egg",
    },

    "boiled egg": {
        "category": "protein",
        "description": "boiled whole egg",
        "serving": "1 egg",
    },

    "banana": {
        "category": "fruit",
        "description": "banana",
        "serving": "1 medium fruit",
    },

    "apple": {
        "category": "fruit",
        "description": "apple",
        "serving": "1 medium fruit",
    },

    "curd": {
        "category": "dairy",
        "description": "plain curd/yogurt",
        "serving": "100 g",
    },

    "dal": {
        "category": "legume",
        "description": "cooked lentil preparation",
        "serving": "1 serving",
    },

    "rajma": {
        "category": "legume",
        "description": "kidney bean preparation",
        "serving": "1 serving",
    },

    "chole": {
        "category": "legume",
        "description": "chickpea preparation",
        "serving": "1 serving",
    },
}


# ============================================================
# NORMALIZE USING ALIASES
# ============================================================

def resolve_alias(food_name):

    normalized = normalize_text(
        food_name
    )

    if normalized in FOOD_ALIASES:
        return FOOD_ALIASES[
            normalized
        ]

    return normalized


# ============================================================
# DIRECT KNOWLEDGE MATCH
# ============================================================

def find_known_food(food_name):

    normalized = resolve_alias(
        food_name
    )

    if normalized in FOOD_TYPES:
        return {
            "canonical_name": normalized,
            "match_type": "knowledge",
            "confidence": 0.98,
        }

    return None


# ============================================================
# FUZZY MATCH
# ============================================================

def fuzzy_match_food(
    food_name,
    available_food_names,
    cutoff=0.72
):

    normalized = normalize_text(
        food_name
    )

    if not normalized:
        return None

    normalized_names = {
        normalize_text(name): name
        for name in available_food_names
    }

    matches = difflib.get_close_matches(
        normalized,
        list(normalized_names.keys()),
        n=1,
        cutoff=cutoff
    )

    if not matches:
        return None

    matched_normalized = matches[0]

    original_name = normalized_names[
        matched_normalized
    ]

    ratio = difflib.SequenceMatcher(
        None,
        normalized,
        matched_normalized
    ).ratio()

    return {
        "canonical_name": original_name,
        "match_type": "fuzzy",
        "confidence": round(
            min(ratio, 0.95),
            3
        ),
    }


# ============================================================
# PARTIAL / COMPONENT MATCH
# ============================================================

def component_match(
    food_name,
    available_food_names
):

    normalized = normalize_text(
        food_name
    )

    if not normalized:
        return None

    words = normalized.split()

    if len(words) < 2:
        return None

    candidates = []

    for original_name in available_food_names:

        candidate = normalize_text(
            original_name
        )

        candidate_words = set(
            candidate.split()
        )

        matching_words = [
            word
            for word in words
            if word in candidate_words
        ]

        if matching_words:

            score = (
                len(matching_words)
                / len(words)
            )

            candidates.append(
                (
                    score,
                    original_name
                )
            )

    if not candidates:
        return None

    candidates.sort(
        key=lambda item: item[0],
        reverse=True
    )

    score, name = candidates[0]

    if score < 0.5:
        return None

    return {
        "canonical_name": name,
        "match_type": "component",
        "confidence": round(
            min(score * 0.85, 0.85),
            3
        ),
    }


# ============================================================
# MAIN FOOD UNDERSTANDING
# ============================================================

def estimate_food_category(food_name):
    """Infer a broad food category from common food words."""
    name = normalize_text(food_name)

    categories = {
        "vegetable": [
            "vegetable", "sabzi", "bhaji", "palak", "spinach",
            "carrot", "gajar", "potato", "aloo", "tomato",
            "onion", "kanda", "broccoli", "cauliflower",
            "cabbage", "cucumber", "beetroot", "brinjal"
        ],
        "fruit": [
            "fruit", "banana", "kela", "apple", "mango",
            "orange", "guava", "papaya", "watermelon",
            "grapes", "pineapple", "strawberry", "avocado"
        ],
        "grain": [
            "rice", "roti", "chapati", "wheat", "oats",
            "bread", "poha", "upma", "quinoa", "corn"
        ],
        "protein": [
            "egg", "chicken", "fish", "paneer", "tofu",
            "dal", "lentil", "beans", "chickpea", "rajma"
        ],
    }

    for category, keywords in categories.items():
        if any(word in name for word in keywords):
            return category

    return None


def estimate_generic_nutrition(food_name):
    """
    Conservative fallback estimates per 100 g.
    These are category-level estimates, not verified values
    for a specific food. Do not use for mixed dishes.
    """
    category = estimate_food_category(food_name)

    estimates = {
        "vegetable": {
            "calories": 35,
            "protein": 2.0,
            "carbs": 7.0,
            "fat": 0.3,
            "fiber": 2.5,
        },
        "fruit": {
            "calories": 60,
            "protein": 0.8,
            "carbs": 15.0,
            "fat": 0.3,
            "fiber": 2.5,
        },
        "grain": {
            "calories": 150,
            "protein": 4.0,
            "carbs": 30.0,
            "fat": 2.0,
            "fiber": 3.0,
        },
        "protein": {
            "calories": 150,
            "protein": 15.0,
            "carbs": 8.0,
            "fat": 6.0,
            "fiber": 2.0,
        },
    }

    if not category:
        return None

    return {
        **estimates[category],
        "basis": "estimated category average per 100 g",
        "is_estimate": True,
        "category": category,
    }


def understand_food(food_name, available_food_names=None):
    if not food_name or not str(food_name).strip():
        return {
            "status": "error",
            "message": "Food name is required."
        }

    normalized = normalize_text(food_name)

    # 1. Exact local food database match first.
    if available_food_names:
        normalized_names = {
            normalize_text(name): name
            for name in available_food_names
        }

        if normalized in normalized_names:
            return {
                "status": "success",
                "canonical_name": normalized_names[normalized],
                "match_type": "exact",
                "confidence": 1.0
            }

    # 2. Exact known food / alias match.
    known = find_known_food(food_name)
    if known:
        return {
            "status": "success",
            **known
        }
        # Recognize Dal Bati and Fried Rice aliases.
        mixed_dish_aliases = {
            "dal bati": [
                "dal bhati",
                "dal baati",
                "daal bati",
                "daal bhati",
                "dal baati churma",
                "dal bhati churma"
            ],
            "fried rice": [
                "veg fried rice",
                "vegetable fried rice"
            ]
        }

        for canonical, aliases in mixed_dish_aliases.items():
            if normalized in [
                normalize_text(name)
                for name in [canonical] + aliases
            ]:
                if available_food_names and canonical in available_food_names:
                    return {
                        "status": "success",
                        "canonical_name": canonical,
                        "match_type": "local_food_alias",
                        "confidence": 0.98
                    }

    # 3. Recognize mixed dishes BEFORE component matching.
    dish_patterns = [
        ("vegetable sandwich", ["vegetable sandwich", "veggie sandwich"]),
        ("paneer curry", ["paneer curry", "paneer masala"]),
        ("chicken curry", ["chicken curry", "chicken masala"]),
        ("vegetable curry", ["vegetable curry", "veg curry"]),
        ("fried rice", ["fried rice", "veg fried rice"]),
        ("biryani", ["biryani", "veg biryani", "chicken biryani"]),
        ("sandwich", ["sandwich"]),
        ("paratha", ["paratha", "paratha"]),
        ("rice dish", ["rice"]),
        ("curry", ["curry", "sabzi", "bhaji"]),
    ]

    for canonical, phrases in dish_patterns:
        for phrase in phrases:
            if normalized == normalize_text(phrase):
                return {
                    "status": "success",
                    "canonical_name": canonical,
                    "match_type": "food_pattern",
                    "category": "prepared_food",
                    "confidence": 0.85
                }

    # 4. Avoid matching a mixed dish to a single ingredient.
    mixed_dish_terms = {
        "curry", "sandwich", "salad", "biryani",
        "pulao", "soup", "pasta", "noodles",
        "wrap", "burger", "pizza", "sabzi",
        "bhaji", "masala"
    }

    is_mixed_dish = any(
        term in normalized.split()
        for term in mixed_dish_terms
    )

    if available_food_names and not is_mixed_dish:
        fuzzy = fuzzy_match_food(food_name, available_food_names)

        if fuzzy and fuzzy.get("confidence", 0) >= 0.85:
            return {
                "status": "success",
                **fuzzy
            }

        component = component_match(food_name, available_food_names)

        if component and component.get("confidence", 0) >= 0.70:
            return {
                "status": "success",
                **component
            }

    # 5. Recognize known fruit and vegetable aliases.
    food_aliases = {
        "sweet potato": ["ratale", "shakarkand", "sweet potatoes"],
        "potato": ["aloo", "alu", "batata", "potatoes"],
        "tomato": ["tamatar", "tomatoes"],
        "onion": ["kanda", "pyaz", "onions"],
        "carrot": ["gajar", "carrots"],
        "spinach": ["palak"],
        "cauliflower": ["phool gobi", "gobi"],
        "cabbage": ["patta gobi"],
        "cucumber": ["kakdi", "kheera"],
        "brinjal": ["baingan", "vangi", "eggplant", "aubergine"],
        "beetroot": ["beet", "chukandar"],
        "broccoli": [],
        "banana": ["kele", "kela", "bananas"],
        "apple": ["seb", "apples"],
        "mango": ["aam", "amba", "mangos", "mangoes"],
        "orange": ["santra", "oranges"],
        "guava": ["peru", "amrood"],
        "papaya": ["papita"],
        "watermelon": ["tarbuj", "kalingad"],
        "grapes": ["draksha", "angoor"],
        "pineapple": ["ananas"],
        "pomegranate": ["dalimb", "anar"],
        "strawberry": ["strawberries"],
        # --------------------------------------------------------
        # MIXED INDIAN DISHES
        # --------------------------------------------------------

        "vegetable pulao": "veg pulao",
        "vegetable rice": "veg pulao",

        "daal khichdi": "dal khichdi",
        "lentil khichdi": "dal khichdi",

        "palak paneer": "palak paneer",
        "spinach paneer": "palak paneer",

        "paneer masala": "paneer curry",

        "misal": "misal pav",
        "misal paav": "misal pav",

        "veg fried rice": "fried rice",
        "vegetable fried rice": "fried rice",
    }

    for canonical, aliases in food_aliases.items():
        if normalized in [normalize_text(canonical)] + [
            normalize_text(alias) for alias in aliases
        ]:
            category = (
                "fruit"
                if canonical in {
                    "banana", "apple", "mango", "orange", "guava",
                    "papaya", "watermelon", "grapes", "pineapple",
                    "pomegranate", "strawberry"
                }
                else "vegetable"
            )
            return {
                "status": "success",
                "canonical_name": canonical,
                "match_type": "local_food_vocabulary",
                "category": category,
                "confidence": 0.95
            }

    return {
        "status": "needs_more_context",
        "canonical_name": None,
        "confidence": 0.0,
        "message": "This food could not be matched confidently."
    }
