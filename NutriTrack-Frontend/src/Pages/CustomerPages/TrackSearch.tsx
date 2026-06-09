import React, { useState } from "react";
import { searchFoodAPI, fetchFoodDetailsAPI } from "../../Services/nutritionixAPI";
import { Input } from "../../Components/ui/input";
// import '../App.css';

interface TrackSearchProps {
  setSelectedFood: (food: any) => void;
}
interface FoodItem {
  food_name: string;
  photo: { thumb: string };
}

const TrackSearch: React.FC<TrackSearchProps> = ({ setSelectedFood }) => {
  const [query, setQuery] = useState("");
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);

  const searchFood = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    setQuery(input);

    if (!input.length) {
      setFoodItems([]);
      return;
    }

    const results = await searchFoodAPI(input);
    setFoodItems(results);
  };

  const fetchFoodDetails = async (foodName: string) => {
    const food = await fetchFoodDetailsAPI(foodName);
    if (food) {
      setSelectedFood({
        name: food.food_name,
        calories: food.nf_calories,
        protein: food.nf_protein,
        carbohydrates: food.nf_total_carbohydrate,
        fiber: food.nf_dietary_fiber,
        fat: food.nf_total_fat,
        image: food.photo.thumb,
        alt_measures: food.alt_measures,
        serving_weight_grams: food.serving_weight_grams,
        serving_unit: food.serving_unit
      });
      setFoodItems([]);
    }
  };


return (
  <div className="search p-4">
      <Input
        className="search-inp h-11 text-base mb-4"
        onChange={searchFood}
        type="search"
        placeholder="Search Food Item"
        value={query}
      />

      {foodItems.length > 0 && (
        <div className="flex flex-col items-stretch gap-3">
          {foodItems.map((item, index) => (
            <div
              key={index}
              onClick={() => fetchFoodDetails(item.food_name)}
              className="flex items-center cursor-pointer p-2 border border-gray-200 rounded-md hover:bg-gray-100"
            >
              <img
                src={item.photo.thumb}
                alt={item.food_name}
                className="w-10 h-10 object-cover mr-3"
              />
              <p>{item.food_name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
);
};

export default TrackSearch;
