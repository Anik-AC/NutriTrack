import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {Sidenav} from "../../Components/Sections";

interface FoodDetails {
  foodName: string;
  eatenWhen: string; // Added to categorize meals
  details: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  };
}

const Stat = ({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
  <div className="p-4 shadow-md rounded-md">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

const MealsConsumedPage = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<FoodDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  // Fetch today's food tracking data using fetch
  useEffect(() => {

    const fetchMeals = async () => {
      try {
        const response = await fetch('/api/mealsConsumed', {
          method: 'GET',
          headers: {
            "Authorization": `Bearer ${localStorage.token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error('Error fetching meals data');
        }
        const data = await response.json();
        setMeals(data.data);
        setLoading(false);
      } catch (err) {
        setError('No meals tracked today');
        setLoading(false);
      }
    };

    fetchMeals();

  }, []);


  // Function to categorize meals based on 'eatenWhen'
  const categorizeMeals = (meals: FoodDetails[]) => {
    const categorizedMeals: Record<string, FoodDetails[]> = {
      breakfast: [],
      "AM snack": [],
      lunch: [],
      "PM snack": [],
      dinner: [],
    };

    meals.forEach((meal) => {
      if (meal.eatenWhen && categorizedMeals[meal.eatenWhen]) {
        categorizedMeals[meal.eatenWhen].push(meal);
      }
    });

    return categorizedMeals;
  };

  // Categorize meals
  const categorizedMeals = categorizeMeals(meals);

  // Calculate the totals of all the nutrients
  const calculateTotalNutrients = (meals: FoodDetails[]) => {
    return meals.reduce(
      (totals, meal) => {
        totals.calories += meal.details.calories;
        totals.protein += meal.details.protein;
        totals.carbohydrates += meal.details.carbohydrates;
        totals.fat += meal.details.fat;
        totals.fiber += meal.details.fiber;
        return totals;
      },
      { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 }
    );
  };

  const totalNutrients = calculateTotalNutrients(meals);

  // Render loading state, error message, or the actual meal data
  if (loading) {
    return (
      <Sidenav>
      <div className="flex flex-col items-center">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="mt-4">Loading meals...</p>
      </div>
      </Sidenav>
    );
  }
return (
    <Sidenav>
      <div className="bg-white shadow-md rounded-lg p-0 mb-10">
        <div className="bg-[var(--dark-green)] rounded-t-lg px-6 py-4">
          <h2 className="text-xl font-bold text-white">Meals Consumed Today</h2>
        </div>
        <div className="p-6 rounded-b-lg text-[var(--dark-green)]">
          <p className="text-base font-medium">
            Review all meals you've consumed today. Check total calories, proteins, carbs, and fats to stay on track with your goals.
          </p>
        </div>
      </div>
    <div className="bg-white shadow-md rounded-lg p-6">
    <div className="mx-auto w-full max-w-5xl py-6">
     <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tracked Meals</h1>
        <div className="flex items-center gap-2">
          <button type="button" data-testid="Search-Food" className="mt-4 rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600" onClick={() => navigate('/track')}>Search Food</button>
          <button type="button" data-testid="Add-Your-Own-Meal" className="mt-4 rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700" onClick={() => navigate('/customFood')}>Add Your Own Meal</button>
        </div>
      </div>

      {error && (
        <div className="flex flex-col items-center">
          <p className="text-red-500">{error}</p>
        </div>
      )}


      {/* Loop through the categories and render them */}
      {Object.keys(categorizedMeals).map((mealTime) => (
        categorizedMeals[mealTime as keyof typeof categorizedMeals].length > 0 && (
          <div key={mealTime} className="mb-8">
            <h3 className="text-xl font-bold mb-4">
              {mealTime.charAt(0).toUpperCase() + mealTime.slice(1)}
            </h3>
            {/* Custom Divider using div */}
            <div className="w-full h-px bg-gray-300 my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categorizedMeals[mealTime as keyof typeof categorizedMeals].map((meal, index) => (
                <div key={index} className="p-5 shadow-md border rounded-md">
                  <div className="flex flex-col items-start gap-3">
                    <h4 className="text-lg font-bold">{meal.foodName.charAt(0).toUpperCase() + meal.foodName.slice(1)}</h4>
                    <p className="font-bold">Calories: {meal.details.calories}</p>
                    <p>Protein: {meal.details.protein}g</p>
                    <p>Carbohydrates: {meal.details.carbohydrates}g</p>
                    <p>Fat: {meal.details.fat}g</p>
                    <p>Fiber: {meal.details.fiber}g</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
      {/* Display the totals */}
      <div className="mt-8">
  <h3 className="text-xl font-bold mb-4">Total Nutrients</h3>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Total Calories */}
    <Stat label="Total Calories" value={totalNutrients.calories} />

    {/* Total Protein */}
    <Stat label="Total Protein" value={`${totalNutrients.protein}g`} />

    {/* Total Carbohydrates */}
    <Stat label="Total Carbohydrates" value={`${totalNutrients.carbohydrates}g`} />

    {/* Total Fat */}
    <Stat label="Total Fat" value={`${totalNutrients.fat}g`} />

    {/* Total Fiber */}
    <Stat label="Total Fiber" value={`${totalNutrients.fiber}g`} />
  </div>
</div>
    </div>
  </div>
  </Sidenav>
  );
};

export default MealsConsumedPage;
