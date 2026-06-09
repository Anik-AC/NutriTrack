import React, { useState, useEffect } from 'react';
import { fetchMealsByName, fetchMealsByFilter, fetchRecipeDetails, fetchCategoriesByName,fetchArea } from '../../Services/recipeAPI';
import { Sidenav } from '../../Components/Sections';
import { debounce } from 'lodash';
import { Input } from '../../Components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../Components/ui/dialog';
import { useDisclosure } from '../../hooks/use-disclosure';

interface Meal {
    idMeal: string;
    strMeal: string;
    strMealThumb: string;
    strInstructions?: string;
    strCategory?: string;
    strArea?: string;
    ingredients?: string[];

}

const selectClasses = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-base md:text-sm";

const RecipePage: React.FC = () => {
    const [query, setQuery] = useState<string>('');
    const [filterType, setFilterType] = useState<'category' | 'area'>('category');
    const [filterValue, setFilterValue] = useState<string>('');
    const [meals, setMeals] = useState<Meal[]>([]);
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [areas, setAreas] = useState<string[]>([]);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [searchResults, setSearchResults] = useState<Meal[]>([]);

    useEffect(() => {
        getCategories();
        getArea();
    }, []);

    useEffect(() => {
        console.log("Updated searchResults:", searchResults);
    }, [searchResults]);

    const searchMeals = async (searchQuery: string) => {
        const meals = await fetchMealsByName(searchQuery);
        setSearchResults(meals);
    };

    const debouncedSearch = debounce((value: string) => searchMeals(value), 300);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        if (value) {
            debouncedSearch(value);
        } else {
            debouncedSearch.cancel();
            setSearchResults([]);
        }
    };

    const filterMeals = async () => {
        const meals = await fetchMealsByFilter(filterType, filterValue);
        setMeals(meals);
    };

    const getMealDetails = async (id: string) => {
        const meal = await fetchRecipeDetails(id);
        const ingredients: string[] = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];

            if (ingredient && ingredient.trim() !== "") {
                ingredients.push(`${measure} ${ingredient}`);
            }
        }

        setSelectedMeal({ ...meal, ingredients });
        onOpen();
    };

    const getCategories = async () => {
        const categories = await fetchCategoriesByName();
        setCategories(categories);
    };

    const getArea = async() => {
        const areas = await fetchArea();
        setAreas(areas);
    }

    return (
        <Sidenav>
            <div className="p-8">
            <div className="bg-white shadow-md rounded-lg p-0 mb-10">
                <div className="bg-[var(--dark-green)] rounded-t-lg px-6 py-4">
                <h2 className="text-xl font-bold text-white">Discover Recipes</h2>
                </div>
                <div className="p-6 rounded-b-lg text-[var(--dark-green)]">
                <p className="text-base font-medium">
                    Search by name or filter by cuisine to explore delicious and healthy recipes. Tap on a recipe to view detailed ingredients and step-by-step instructions.
                </p>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex gap-3 mb-5">
                <Input
                    placeholder="Search meal by name"
                    value={query}
                    onChange={handleSearchChange}
                />
                </div>

                {searchResults.length > 0 && (
                <ul className="bg-white shadow-md rounded-md max-h-[300px] overflow-y-auto">
                    {searchResults.map((meal) => (
                    <li
                        key={meal.idMeal}
                        className="flex items-center p-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => getMealDetails(meal.idMeal)}
                    >
                        <img src={meal.strMealThumb} alt={meal.strMeal} className="w-10 h-10 mr-2 rounded" />
                        <p>{meal.strMeal}</p>
                    </li>
                    ))}
                </ul>
                )}

                <div className="flex gap-3 mb-5">
                <select data-testid="filterType-select" className={selectClasses} onChange={(e) => setFilterType(e.target.value as 'category' | 'area')}>
                    <option value="category">Category</option>
                    <option value="area">Cuisine</option>
                </select>
                {filterType === 'category' && (
                    <select data-testid="category-select" className={selectClasses} onChange={(e) => setFilterValue(e.target.value)}>
                    <option value="">Select Category</option>
                    {categories.map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                    ))}
                    </select>
                )}
                {filterType === 'area' && (
                    <select data-testid="area-select" className={selectClasses} onChange={(e) => setFilterValue(e.target.value)}>
                    <option value="">Select Cuisine</option>
                    {areas.map((area, index) => (
                        <option key={index} value={area}>{area}</option>
                    ))}
                    </select>
                )}
                <button type="button" onClick={filterMeals} className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">Filter</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {meals.map(meal => (
                    <div key={meal.idMeal} onClick={() => getMealDetails(meal.idMeal)} className="cursor-pointer p-3 border rounded-lg">
                    <img src={meal.strMealThumb} alt={meal.strMeal} />
                    <p className="mt-2 font-bold">{meal.strMeal}</p>
                    </div>
                ))}
                </div>
            </div>
        </div>
        {/* Modal for Meal Details */}
            <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
                <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedMeal?.strMeal}</DialogTitle>
                    </DialogHeader>
                    {selectedMeal && (
                        <div>
                            <img src={selectedMeal.strMealThumb} alt={selectedMeal.strMeal} className="rounded-md mb-4" />
                            <p><strong>Category:</strong> {selectedMeal.strCategory}</p>
                            <p><strong>Cuisine:</strong> {selectedMeal.strArea}</p>

                            {/* Ingredients List */}
                            <p className="mt-3 font-bold">Ingredients:</p>
                                <ol style={{ paddingLeft: "20px" }}>
                                    {selectedMeal.ingredients?.map((item, index) => (
                                        <li key={index} style={{ marginBottom: "5px" }}>
                                            {`${index + 1}. ${item}`}
                                        </li>
                                    ))}
                                </ol>


                            <p className="mt-3 font-bold">Instructions:</p>
                            <ol style={{ paddingLeft: "20px" }}>
                                {selectedMeal.strInstructions
                                    ?.split(/\. (?=[A-Z])/g)
                                    .map((step, index) => step.trim() && (
                                        <li key={index} style={{ marginBottom: "8px" }}>
                                            {`${index + 1}. ${step}.`}
                                        </li>
                                    ))
                                }
                            </ol>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Sidenav>
    );
};

export default RecipePage;
