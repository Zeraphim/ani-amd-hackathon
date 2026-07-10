import os
import json
import base64
import numpy as np
from typing import TypedDict
from pydantic import BaseModel
from openai import OpenAI
from langgraph.graph import StateGraph, START, END
from pathlib import Path

# Setup clients (Using Fireworks for both vision/chat and embeddings per prototype)
FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY", "")
client = OpenAI(
    base_url="https://api.fireworks.ai/inference/v1",
    api_key=FIREWORKS_API_KEY
)

# 1. Load the most recent wholesale market opportunities
import csv

DATA_DIR = Path(__file__).parent.parent / "data"
CSV_PATH = DATA_DIR / "ncr_prices.csv"

# Pre-calculate embeddings for buyers
def get_embedding(text: str) -> np.ndarray:
    response = client.embeddings.create(
        model="nomic-ai/nomic-embed-text-v1.5",
        input=text
    )
    return np.array(response.data[0].embedding)

# Parse CSV and extract only the latest date
BUYERS = []
try:
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        all_rows = [row for row in reader if row and not row[0].startswith("#")]
        
    if all_rows:
        # Since our dataset is sorted by date descending, the first row's date is the latest.
        latest_date = all_rows[0][4]
        latest_rows = [r for r in all_rows if r[4] == latest_date]
        
        print(f"[LANGGRAPH] Pre-calculating embeddings for {len(latest_rows)} market opportunities on {latest_date}...")
        for row in latest_rows:
            market, commodity, price, demand, date = row
            # Create a descriptive profile for the vector search
            profile = f"{market} wholesale market needs {commodity}. Price is {price} PHP/kg. Demand is {demand}."
            
            BUYERS.append({
                "market": market,
                "commodity": commodity,
                "price_php_per_kg": int(price),
                "demand": demand,
                "date": date,
                "requirement_profile": profile,
                "vector": get_embedding(profile)
            })
except Exception as e:
    print(f"[LANGGRAPH] Error loading CSV: {e}")

# 3. LangGraph State
class HarvestState(TypedDict, total=False):
    crop_type: str
    quantity: int
    image_data: str
    location: str

    is_crop: bool
    error_message: str

    grade: str
    score: float
    ripeness: str
    shelfLifeHours: int
    freshnessWindow: str
    freshnessFill: int
    urgency: str
    suggestion: str
    cropId: str
    crop: str
    source: str

    buyers: list
    matched_buyer: str
    
    dispatch: dict

# 4. Schemas for API Extraction
class GraderOutput(BaseModel):
    is_crop: bool
    error_message: str
    grade: str
    score: float
    ripeness: str
    shelfLifeHours: int
    freshnessWindow: str
    freshnessFill: int
    urgency: str
    suggestion: str

class RouterOutput(BaseModel):
    to: str
    eta: str
    load: str

# 5. Nodes
def harvest_grader_node(state: HarvestState):
    print(f"Grader Agent: AI is visually inspecting the {state['crop_type']}...")

    image_str = state.get("image_data", "")
    if "," in image_str:
        image_str = image_str.split(",")[-1]

    # If no image is provided, we can't use vision properly. 
    # For robust fallback, if image_str is empty, we fall back to a text-only prompt.
    prompt = (
        f"You are an expert crop grader for Philippine highland vegetables. "
        f"We have {state['quantity']}kg of {state['crop_type']}. "
        f"First, critically verify if the image provided actually contains a crop, vegetable, or fruit. "
        f"If the image is NOT a crop (e.g. a picture of a dog, car, completely unrelated object), set 'is_crop' to false, "
        f"provide an 'error_message' explaining that the system only processes crops, and set all other fields to default/empty values. "
        f"If it IS a crop, set 'is_crop' to true, leave 'error_message' empty, and evaluate its quality. Return a JSON object with: "
        f"grade (A, B, C), score (0-100), ripeness (short description), "
        f"shelfLifeHours (integer), freshnessWindow (e.g. '3 days'), "
        f"freshnessFill (0-100 integer representing remaining freshness), "
        f"urgency (high, mid, low), and a one-sentence suggestion for the farmer."
    )

    messages = [{"role": "user", "content": []}]
    messages[0]["content"].append({"type": "text", "text": prompt})
    
    if image_str:
        messages[0]["content"].append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{image_str}"}
        })

    response = client.chat.completions.create(
        model="accounts/fireworks/models/minimax-m3",
        messages=messages,
        response_format={"type": "json_object", "schema": GraderOutput.model_json_schema()},
        temperature=0.1
    )

    ai_result = json.loads(response.choices[0].message.content)
    
    return {
        **ai_result, 
        "cropId": state['crop_type'].lower().replace(" ", "-"),
        "crop": state['crop_type'],
        "source": "langgraph"
    }

def demand_oracle_node(state: HarvestState):
    print(f"Oracle Agent: Finding buyers for Grade {state['grade']} {state['crop_type']} from {state.get('location', 'Unknown')}...")

    harvest_text = f"We have {state['quantity']}kg of Grade {state['grade']} {state['crop_type']} located in {state.get('location', 'Unknown')}."
    harvest_vector = get_embedding(harvest_text)

    scored_buyers = []
    for buyer in BUYERS:
        score = np.dot(harvest_vector, buyer["vector"]) / (np.linalg.norm(harvest_vector) * np.linalg.norm(buyer["vector"]))
        scored_buyers.append({"buyer": buyer, "score": score})
        
    scored_buyers.sort(key=lambda x: x["score"], reverse=True)
    top_3 = scored_buyers[:3]

    formatted_buyers = []
    for i, match in enumerate(top_3):
        b = match["buyer"]
        formatted_buyers.append({
            "buyer": f"{b['market']} Wholesale",
            "sub": f"Top market match based on current demand",
            "pricePerKg": b["price_php_per_kg"],
            "trend": b["demand"],
            "fit": f"{int(match['score'] * 100)}% fit",
            "first": (i == 0)
        })

    return {
        "buyers": formatted_buyers,
        "matched_buyer": top_3[0]["buyer"]["market"] if top_3 else "Unknown"
    }

def logistics_router_node(state: HarvestState):
    print(f"Router Agent: Planning route to {state['matched_buyer']}...")

    origin = state.get('location', 'Unknown')
    prompt = f"""
    You are an expert logistics router in the Philippines.
    We are sending {state['quantity']}kg of {state['crop_type']} from {origin} to {state['matched_buyer']}.
    
    Calculate realistic transit details and return a JSON object with:
    'to': the city or market destination (e.g. 'Balintawak' or 'Makati')
    'eta': the time and transport cost (e.g. '6h · ₱44/kg')
    'load': a short description of the load (e.g. '{state['quantity']/1000}t matched')
    """

    response = client.chat.completions.create(
        model="accounts/fireworks/models/minimax-m3",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object", "schema": RouterOutput.model_json_schema()},
        temperature=0.4
    )

    dispatch_data = json.loads(response.choices[0].message.content)

    return {
        "dispatch": dispatch_data
    }

# 6. Compile Graph
def grade_is_crop(state: HarvestState):
    DATA_DIR = Path(__file__).parent.parent / "data"
    CSV_PATH = DATA_DIR / "ncr_prices.csv"

# Pre-calculate embeddings for buyers
def get_embedding(text: str) -> np.ndarray:
    response = client.embeddings.create(
        model="nomic-ai/nomic-embed-text-v1.5",
        input=text
    )
    return np.array(response.data[0].embedding)

# Parse CSV and extract only the latest date
BUYERS = []
try:
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        all_rows = [row for row in reader if row and not row[0].startswith("#")]
        
    if all_rows:
        # Since our dataset is sorted by date descending, the first row's date is the latest.
        latest_date = all_rows[0][4]
        latest_rows = [r for r in all_rows if r[4] == latest_date]
        
        print(f"[LANGGRAPH] Pre-calculating embeddings for {len(latest_rows)} market opportunities on {latest_date}...")
        for row in latest_rows:
            market, commodity, price, demand, date = row
            # Create a descriptive profile for the vector search
            profile = f"{market} wholesale market needs {commodity}. Price is {price} PHP/kg. Demand is {demand}."
            
            BUYERS.append({
                "market": market,
                "commodity": commodity,
                "price_php_per_kg": int(price),
                "demand": demand,
                "date": date,
                "requirement_profile": profile,
                "vector": get_embedding(profile)
            })
except Exception as e:
    print(f"[LANGGRAPH] Error loading CSV: {e}")

# 3. LangGraph State
class HarvestState(TypedDict, total=False):
    crop_type: str
    quantity: int
    image_data: str
    location: str

    is_crop: bool
    error_message: str

    grade: str
    score: float
    ripeness: str
    shelfLifeHours: int
    freshnessWindow: str
    freshnessFill: int
    urgency: str
    suggestion: str
    cropId: str
    crop: str
    source: str

    buyers: list
    matched_buyer: str
    
    dispatch: dict

# 4. Schemas for API Extraction
class GraderOutput(BaseModel):
    is_crop: bool
    error_message: str
    grade: str
    score: float
    ripeness: str
    shelfLifeHours: int
    freshnessWindow: str
    freshnessFill: int
    urgency: str
    suggestion: str

class RouterOutput(BaseModel):
    to: str
    eta: str
    load: str

# 5. Nodes
def harvest_grader_node(state: HarvestState):
    print(f"Grader Agent: AI is visually inspecting the {state['crop_type']}...")

    image_str = state.get("image_data", "")
    if "," in image_str:
        image_str = image_str.split(",")[-1]

    # If no image is provided, we can't use vision properly. 
    # For robust fallback, if image_str is empty, we fall back to a text-only prompt.
    prompt = (
        f"You are an expert crop grader for Philippine highland vegetables. "
        f"We have {state['quantity']}kg of {state['crop_type']}. "
        f"CRITICAL REQUIREMENT 1: Carefully verify if the image actually contains a crop, vegetable, or fruit. "
        f"If the image is clearly NOT a crop (e.g. an animal, car, or unrelated object), you MUST set 'is_crop' to false and explain why in 'error_message'. "
        f"CRITICAL REQUIREMENT 2: Check if the crop is completely SPOILED, ROTTEN, or INEDIBLE (e.g. severe mold, heavy decay). "
        f"If it is completely inedible, you MUST set 'is_crop' to false and write an 'error_message' explaining that the crop is too spoiled to be sold. "
        f"NOTE: Do NOT reject 'overripe' crops (like overripe tomatoes or bananas) as they are still edible and can be sold to processors. "
        f"If it is overripe but edible, set 'is_crop' to true, assign a lower grade (e.g., Grade C), and note it in the 'ripeness' and 'suggestion' fields. "
        f"Only if it is a valid, edible crop should you set 'is_crop' to true. Return a JSON object matching the GraderOutput schema: "
        f"grade (A, B, C), score (0-100), ripeness (short description), "
        f"shelfLifeHours (integer), freshnessWindow (e.g. '3 days'), "
        f"freshnessFill (0-100 integer representing remaining freshness), "
        f"urgency (high, mid, low), and a one-sentence suggestion for the farmer."
    )

    messages = [{"role": "user", "content": []}]
    messages[0]["content"].append({"type": "text", "text": prompt})
    
    if image_str:
        messages[0]["content"].append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{image_str}"}
        })

    response = client.chat.completions.create(
        model="accounts/fireworks/models/minimax-m3",
        messages=messages,
        response_format={"type": "json_object", "schema": GraderOutput.model_json_schema()},
        temperature=0.1
    )

    ai_result = json.loads(response.choices[0].message.content)
    
    return {
        **ai_result, 
        "cropId": state['crop_type'].lower().replace(" ", "-"),
        "crop": state['crop_type'],
        "source": "langgraph"
    }

def demand_oracle_node(state: HarvestState):
    print(f"Oracle Agent: Finding buyers for Grade {state['grade']} {state['crop_type']} from {state.get('location', 'Unknown')}...")

    harvest_text = f"We have {state['quantity']}kg of Grade {state['grade']} {state['crop_type']} located in {state.get('location', 'Unknown')}."
    harvest_vector = get_embedding(harvest_text)

    scored_buyers = []
    for buyer in BUYERS:
        score = np.dot(harvest_vector, buyer["vector"]) / (np.linalg.norm(harvest_vector) * np.linalg.norm(buyer["vector"]))
        scored_buyers.append({"buyer": buyer, "score": score})
        
    scored_buyers.sort(key=lambda x: x["score"], reverse=True)
    top_3 = scored_buyers[:3]

    formatted_buyers = []
    for i, match in enumerate(top_3):
        b = match["buyer"]
        formatted_buyers.append({
            "buyer": f"{b['market']} Wholesale",
            "sub": f"Top market match based on current demand",
            "pricePerKg": b["price_php_per_kg"],
            "trend": b["demand"],
            "fit": f"{int(match['score'] * 100)}% fit",
            "first": (i == 0)
        })

    return {
        "buyers": formatted_buyers,
        "matched_buyer": top_3[0]["buyer"]["market"] if top_3 else "Unknown"
    }

def logistics_router_node(state: HarvestState):
    print(f"Router Agent: Planning route to {state['matched_buyer']}...")

    origin = state.get('location', 'Unknown')
    prompt = f"""
    You are an expert logistics router in the Philippines.
    We are sending {state['quantity']}kg of {state['crop_type']} from {origin} to {state['matched_buyer']}.
    
    Calculate realistic transit details and return a JSON object with:
    'to': the city or market destination (e.g. 'Balintawak' or 'Makati')
    'eta': the time and transport cost (e.g. '6h · ₱44/kg')
    'load': a short description of the load (e.g. '{state['quantity']/1000}t matched')
    """

    response = client.chat.completions.create(
        model="accounts/fireworks/models/minimax-m3",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object", "schema": RouterOutput.model_json_schema()},
        temperature=0.4
    )

    dispatch_data = json.loads(response.choices[0].message.content)

    return {
        "dispatch": dispatch_data
    }

# 6. Compile Graph
def grade_is_crop(state: HarvestState):
    """Conditional edge to check if the grader rejected the input."""
    if not state.get("is_crop", True):
        return END
    return "demand_oracle"

def build_graph():
    builder = StateGraph(HarvestState)
    builder.add_node("harvest_grader", harvest_grader_node)
    builder.add_node("demand_oracle", demand_oracle_node)
    builder.add_node("logistics_router", logistics_router_node)
    
    builder.add_edge(START, "harvest_grader")
    builder.add_conditional_edges("harvest_grader", grade_is_crop)
    builder.add_edge("demand_oracle", "logistics_router")
    builder.add_edge("logistics_router", END)
    
    return builder.compile()

ani_app = build_graph()

# Provide wrapper functions to easily drop into FastAPI if needed
def grade(crop: str, quantity_kg: float, image_data: str = "", location: str = "La Trinidad, Benguet") -> dict:
    print(f"[LANGGRAPH] Starting grader node for crop: {crop}")
    state = {
        "crop_type": crop,
        "quantity": int(quantity_kg),
        "image_data": image_data,
        "location": location
    }
    result = harvest_grader_node(state)
    result["quantity_kg"] = quantity_kg
    # Also add the error structure for direct API calls
    if not result.get("is_crop", True):
        result["error"] = result.get("error_message", "Invalid crop image.")
    return result

def match(grade_dict: dict) -> dict:
    print(f"[LANGGRAPH] Starting match nodes for crop: {grade_dict.get('crop')}")
    state = {
        "crop_type": grade_dict.get("crop", "Unknown"),
        "quantity": grade_dict.get("quantity_kg", 450),
        "grade": grade_dict.get("grade", "A")
    }
    
    oracle_res = demand_oracle_node(state)
    state.update(oracle_res)
    router_res = logistics_router_node(state)
    
    return {
        "buyers": oracle_res["buyers"],
        "dispatch": router_res["dispatch"],
        "source": "langgraph"
    }

def process_harvest(crop: str, quantity_kg: float, image_data: str = "", location: str = "La Trinidad, Benguet") -> dict:
    initial_state = {
        "crop_type": crop,
        "quantity": int(quantity_kg),
        "image_data": image_data,
        "location": location
    }
    
    final_state = ani_app.invoke(initial_state)
    
    # We need to map final_state back to the shape expected by the frontend
    return {
        "error": final_state.get("error_message", "") if not final_state.get("is_crop", True) else "",
        "cropId": final_state.get("cropId", crop.lower().replace(" ", "-")),
        "crop": final_state.get("crop", crop),
        "grade": final_state.get("grade", "A"),
        "score": final_state.get("score", 0),
        "ripeness": final_state.get("ripeness", ""),
        "shelfLifeHours": final_state.get("shelfLifeHours", 0),
        "freshnessWindow": final_state.get("freshnessWindow", ""),
        "freshnessFill": final_state.get("freshnessFill", 0),
        "urgency": final_state.get("urgency", "low"),
        "suggestion": final_state.get("suggestion", ""),
        "buyers": final_state.get("buyers", []),
        "dispatch": final_state.get("dispatch", {}),
        "source": "langgraph"
    }
