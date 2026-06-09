import { useEffect, useState } from "react";
import { useNavigate,useLocation } from 'react-router-dom';
import {Sidenav} from "../../Components/Sections";
import { Input } from "../../Components/ui/input";
// import '../App.css';


interface FoodProps {
    food?: {
        foodName: string;
        details: {
            calories: number;
            protein: number;
            carbohydrates: number;
            fat: number;
            fiber: number;
        };
        serving_unit: string;
        serving_weight_grams: number;
        _id?: string;
    };
}

const selectClasses = "h-8 rounded-md border border-input bg-white px-2 text-sm text-black";

const FoodItem: React.FC<FoodProps> = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const defaultFood = {
        foodName: '',
        details: {
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fat: 0,
          fiber: 0,
        },
        serving_unit: '',
        serving_weight_grams: 0,
      };
    const food = (location.state && location.state.food) || defaultFood;
    const [eatenQuantity, setEatenQuantity] = useState<number>(food.serving_weight_grams);
    const [foodInitial, setFoodInitial] = useState<Required<FoodProps>["food"]>(food);
    const [foodData, setFoodData] = useState<Required<FoodProps>["food"]>(food);
    const [selectedWhen, setSelectedWhen] = useState<string>("breakfast");


    useEffect(() => {
        setFoodData(food);
        setFoodInitial(food);
    }, [food]);
    console.log(food);

    function calculateMacros(event: React.ChangeEvent<HTMLInputElement>) {
        let quantity = Number(event.target.value);
        if (quantity > 0) {
            // const selectedMeasure = food.serving_unit;
            const servingWeight = food.serving_weight_grams;
            const convertedQuantity = (servingWeight * quantity);

            console.log("servingWeight:", servingWeight);
            console.log("convertedQuantity:", convertedQuantity);
            console.log("food.serving_unit", food.serving_unit);

            setEatenQuantity(quantity);

            let updatedDetails = {
                    protein: Math.round(foodInitial.details.protein * quantity ),
                    carbohydrates: Math.round(foodInitial.details.carbohydrates *quantity) ,
                    fat: Math.round(foodInitial.details.fat * quantity),
                    fiber: Math.round(foodInitial.details.fiber * quantity) ,
                    calories: Math.round(foodInitial.details.calories * quantity)
            }


            const updatedFood: FoodProps["food"] = {
                ...foodInitial,
                details: updatedDetails,
              };

            console.log("Converted Quantity:", convertedQuantity);
            console.log("Food Initial:", foodInitial);
            console.log("updatedFood", updatedFood);

            setFoodData(updatedFood);
        } else {
            setEatenQuantity(0);
            setFoodData(foodInitial);
        }
    }

    function handleWhenChange(event: React.ChangeEvent<HTMLSelectElement>) {
        setSelectedWhen(event.target.value);
    }

    function trackFoodItem() {


        let trackedItem = {
            userId: localStorage.user,
            foodName: foodData.foodName,
            eatenWhen: selectedWhen,
            servingUnit: foodData.serving_unit,
            details: {
                calories: Math.round(foodData.details.calories), // Use updated macros
                protein: Math.round(foodData.details.protein),
                carbohydrates: Math.round(foodData.details.carbohydrates),
                fat: Math.round(foodData.details.fat),
                fiber: Math.round(foodData.details.fiber)
            },
            quantity: eatenQuantity
        };

        fetch("api/track", {
            method: "POST",
            body: JSON.stringify(trackedItem),
            headers: {
                "Authorization": `Bearer ${localStorage.token}`,
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                // Redirect to the MealsConsumedPage upon successful submission
                navigate('/mealsConsumed');
              })
            .catch((err) => console.log(err));

    }

    return (
        <Sidenav>
        <div className="p-5 bg-gray-800 text-white rounded-md shadow-lg">
            <h3 className="text-lg font-bold text-white text-center">{foodData.foodName.charAt(0).toUpperCase() + foodData.foodName.slice(1)} ({Math.round(foodData.details.calories)} Kcal)</h3>
             {/* Protein, Carbs in one row and Fat, Fiber in another using Grid */}
    <div className="grid grid-cols-2 gap-4 mt-10">
        <p className="text-center">Protein: {Math.round(foodData.details.protein)}g</p>
        <p className="text-center">Carbs: {Math.round(foodData.details.carbohydrates)}g</p>
    </div>

    <div className="grid grid-cols-2 gap-4 mt-2">
        <p className="text-center">Fat: {Math.round(foodData.details.fat)}g</p>
        <p className="text-center">Fiber: {Math.round(foodData.details.fiber)}g</p>
    </div>
    <div className="mt-10" />
            <div className="flex items-center justify-center gap-4 mt-2">
            <Input type="number" placeholder="Quantity" onChange={calculateMacros} className="h-8 w-20 shrink-0 bg-white text-black" />
            <p className="grow bg-white text-black text-sm rounded-md px-2 py-1">{foodData.serving_unit || "N/A"}</p>
            </div>
            <div className="flex items-center gap-3 mt-4">
                <p>When:</p>
                <select onChange={handleWhenChange} value={selectedWhen} className={selectClasses}>
                    <option value="breakfast">Breakfast</option>
                    <option value="AM snack">AM Snack</option>
                    <option value="lunch">Lunch</option>
                    <option value="PM snack">PM Snack</option>
                    <option value="dinner">Dinner</option>
                </select>
            </div>
            <div className="flex justify-center items-center h-[10vh]">
                <button type="button" name="track" className="mt-4 rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700" onClick={trackFoodItem}>Track</button>
            </div>
        </div>
        </Sidenav>
    );
};

export default FoodItem;
