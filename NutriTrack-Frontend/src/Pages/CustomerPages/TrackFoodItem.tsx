import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Input } from "../../Components/ui/input";
// import '../App.css';

interface Measure {
    serving_weight: number;
    measure: string;
    seq?: number | null;
    qty: number;
}

interface FoodProps {
    food: {
        name: string;
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
        fiber: number;
        serving_weight_grams: number;
        alt_measures: Measure[];
        serving_unit : string;
        _id?: string;
    };
}

const selectClasses = "h-8 rounded-md border border-input bg-white px-2 text-sm text-black";

const FoodItem: React.FC<FoodProps> = ({ food }) => {
    const navigate = useNavigate();
    const [eatenQuantity, setEatenQuantity] = useState<number>(food.serving_weight_grams);
    const [foodData, setFoodData] = useState<FoodProps["food"]>(food);
    const [foodInitial, setFoodInitial] = useState<FoodProps["food"]>(food);
    const [selectedUnit, setSelectedUnit] = useState<string>("grams");
    const [unitOptions, setUnitOptions] = useState<Measure[]>([]);
    const [selectedWhen, setSelectedWhen] = useState<string>("breakfast");
    // const loggedData = useContext(UserContext);

    useEffect(() => {
        setFoodData(food);
        setFoodInitial(food);

        if (food.alt_measures) {
            setUnitOptions(food.alt_measures);
        }
    }, [food]);


    function calculateMacros(event: React.ChangeEvent<HTMLInputElement>) {
        let quantity = Number(event.target.value);
        if (quantity > 0) {
            const selectedMeasure = unitOptions.find((unit) => unit.measure === selectedUnit);
            const servingWeight = selectedMeasure?.serving_weight ?? food.serving_weight_grams;
            const qty = selectedMeasure?.qty ?? 1;
            const convertedQuantity = ((servingWeight * quantity) / food.serving_weight_grams)/qty;

            console.log("selectedMeasure:", selectedMeasure);
            console.log("selectedUnit", selectedUnit);
            console.log("servingWeight:", servingWeight);
            console.log("convertedQuantity:", convertedQuantity);
            console.log("food.serving_weight_grams:", food.serving_weight_grams);

            setEatenQuantity(quantity);

            let updatedFood = { ...foodInitial };
            updatedFood.protein = Math.round(foodInitial.protein * convertedQuantity );
            updatedFood.carbohydrates = Math.round(foodInitial.carbohydrates *convertedQuantity) ;
            updatedFood.fat = Math.round(foodInitial.fat * convertedQuantity) ;
            updatedFood.fiber = Math.round(foodInitial.fiber * convertedQuantity) ;
            updatedFood.calories = Math.round(foodInitial.calories * convertedQuantity);

            console.log("Converted Quantity:", convertedQuantity);
            console.log("Food Initial:", foodInitial);

            setFoodData(updatedFood);
        } else {
            setEatenQuantity(0);
            setFoodData(foodInitial);
        }
    }

    function handleUnitChange(event: React.ChangeEvent<HTMLSelectElement>) {
        setSelectedUnit(event.target.value);
    }

    function handleWhenChange(event: React.ChangeEvent<HTMLSelectElement>) {
        setSelectedWhen(event.target.value);
    }

    function trackFoodItem() {


        let trackedItem = {
            // userId: loggedData.loggedUser.userid,
            userId: localStorage.user,
            foodName: foodData.name,
            eatenWhen: selectedWhen,
            servingUnit: selectedUnit,
            details: {
                calories: Math.round(foodData.calories), // Use updated macros
                protein: Math.round(foodData.protein),
                carbohydrates: Math.round(foodData.carbohydrates),
                fat: Math.round(foodData.fat),
                fiber: Math.round(foodData.fiber)
            },
            quantity: eatenQuantity
        };

        fetch("/api/track", {
            method: "POST",
            body: JSON.stringify(trackedItem),
            headers: {
                "Authorization": `Bearer ${localStorage.token}`,
                "Content-Type": "application/json"
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
        <div className="p-5 bg-gray-800 text-white rounded-md shadow-lg">
            <h3 className="text-lg font-bold text-white text-center">{foodData.name.charAt(0).toUpperCase() + foodData.name.slice(1)} ({Math.round(foodData.calories)} Kcal)</h3>
             {/* Protein, Carbs in one row and Fat, Fiber in another using Grid */}
    <div className="grid grid-cols-2 gap-4 mt-10">
        <p className="text-center">Protein: {Math.round(foodData.protein)}g</p>
        <p className="text-center">Carbs: {Math.round(foodData.carbohydrates)}g</p>
    </div>

    <div className="grid grid-cols-2 gap-4 mt-2">
        <p className="text-center">Fat: {Math.round(foodData.fat)}g</p>
        <p className="text-center">Fiber: {Math.round(foodData.fiber)}g</p>
    </div>
    <div className="mt-10" />
            <div className="flex items-center justify-center gap-4 mt-2">
            <Input type="number" placeholder="Quantity" onChange={calculateMacros} className="h-8 w-20 shrink-0 bg-white text-black" />
      <select onChange={handleUnitChange} value={selectedUnit} className={`${selectClasses} grow`}>
                    {unitOptions.length > 0 ? (
                        unitOptions.map((unit, index) => (
                            <option key={index} value={unit.measure}>{unit.measure}</option>
                        ))
                    ) : (
                        <option value="g">grams</option>
                    )}
                </select>
            </div>
            <div className="flex items-center gap-3 mt-4">
                <p>When:</p>
                <select id="when" onChange={handleWhenChange} value={selectedWhen} className={selectClasses}>
                    <option value="breakfast">Breakfast</option>
                    <option value="AM snack">AM Snack</option>
                    <option value="lunch">Lunch</option>
                    <option value="PM snack">PM Snack</option>
                    <option value="dinner">Dinner</option>
                </select>
            </div>
            <div className="flex justify-center items-center h-[10vh]">
                <button type="button" className="mt-4 rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700" onClick={trackFoodItem}>Track</button>
            </div>
        </div>
    );
};

export default FoodItem;
