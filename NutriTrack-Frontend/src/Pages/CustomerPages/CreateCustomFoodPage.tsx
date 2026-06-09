import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Sidenav } from "../../Components/Sections";
import { ChevronDown, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "../../Components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../Components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../Components/ui/dropdown-menu";
import { useDisclosure } from "../../hooks/use-disclosure";

const fieldLabel = (key: string) =>
  key === "foodName"
    ? "Food name"
    : key === "serving_unit"
    ? "Serving unit"
    : key === "serving_weight_grams"
    ? "Serving Weight Grams"
    : key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());

const CreateCustomFoodPage: React.FC = () => {
  const navigate = useNavigate();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [storedFoodItems, setStoredFoodItems] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    foodName: "",
    calories: "",
    protein: "",
    carbohydrates: "",
    fat: "",
    fiber: "",
    serving_unit: "",
    serving_weight_grams: ""
  });
  const [editFoodItem, setEditFoodItem] = useState<any | null>(null);

  useEffect(() => {
    fetch("api/getCustomFood", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })
      .then((response) => {
        if (response.status === 500) {
          throw new Error("Error in retrieving data");
        }
        if (response.status === 404) {
          return Promise.resolve(JSON.stringify({ data: [] }));
        }
        return response.text();
      })
      .then((text) => {
        if (text) {
          return JSON.parse(text);
        }
        return { data: [] };
      })
      .then((data) => setStoredFoodItems(Array.isArray(data.data) ? data.data : []))
      .catch((error) => {
        alert("Error fetching custom foods: " + error);
      });
  }, []);

  const allFoodItems = [...(storedFoodItems || []), ...foodItems];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as keyof typeof formData]: value,
    });
  };
  // Reset formData when opening the Create modal
  const handleCreateOpen = () => {
    setFormData({
      foodName: "",
      calories: "",
      protein: "",
      carbohydrates: "",
      fat: "",
      fiber: "",
      serving_unit: "",
      serving_weight_grams: ""
    });
    onCreateOpen();
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.foodName || !formData.serving_unit || !formData.calories) {
      alert("Food name, serving unit, and calories are required!");
      return;
    }

    const requestBody = {
      userId: localStorage.user,
      foodName: formData.foodName,
      details: {
        calories: Number(formData.calories),
        protein: Number(formData.protein) || 0,
        carbohydrates: Number(formData.carbohydrates) || 0,
        fat: Number(formData.fat) || 0,
        fiber: Number(formData.fiber) || 0,
      },
      serving_unit: formData.serving_unit,
      serving_weight_grams: formData.serving_weight_grams
    };

    try {
      const response = await fetch("api/customFood", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("Failed to add food item");

      const responseData = await response.text();
      if (responseData) {
        const data = JSON.parse(responseData);
        if (data.success && data.data) {
          setFoodItems((prevFoodItems) => [...prevFoodItems, data.data]);
        }
      }
      onCreateClose();
      setFormData({ foodName: "", calories: "", protein: "", carbohydrates: "", fat: "", fiber: "", serving_unit: "", serving_weight_grams: "" });
    } catch (error) {
      alert("Error adding food item: " + error);
    }
  };

  const handleEditClick = (food: any) => {
    setEditFoodItem(food);
    setFormData({
      foodName: food.foodName,
      calories: food.details.calories.toString(),
      protein: food.details.protein.toString(),
      carbohydrates: food.details.carbohydrates.toString(),
      fat: food.details.fat.toString(),
      fiber: food.details.fiber.toString(),
      serving_unit: food.serving_unit,
      serving_weight_grams: food.serving_weight_grams.toString()
    });
    onEditOpen();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.foodName || !formData.serving_unit || !formData.calories) {
      alert("Food name, serving unit, and calories are required!");
      return;
    }

    const requestBody = {
      userId: localStorage.user,
      foodName: formData.foodName,
      details: {
        calories: Number(formData.calories),
        protein: Number(formData.protein) || 0,
        carbohydrates: Number(formData.carbohydrates) || 0,
        fat: Number(formData.fat) || 0,
        fiber: Number(formData.fiber) || 0,
      },
      serving_unit: formData.serving_unit,
      serving_weight_grams: formData.serving_weight_grams
    };

    try {
      const response = await fetch(`api/updateCustomFood/${editFoodItem._id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${localStorage.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("Failed to update food item");

      const responseData = await response.text();
      if (responseData) {
        const data = JSON.parse(responseData);
        if (data.success && data.data) {
          setFoodItems((prev) => prev.map(item => item._id === editFoodItem._id ? data.data : item));
          setStoredFoodItems((prev) => prev.map(item => item._id === editFoodItem._id ? data.data : item));
        }
      }
      onEditClose();
      setFormData({ foodName: "", calories: "", protein: "", carbohydrates: "", fat: "", fiber: "", serving_unit: "", serving_weight_grams: "" });
      setEditFoodItem(null);
    } catch (error) {
      alert("Error updating food item: " + error);
    }
  };

  const handleDelete = async (food: any) => {
    if (window.confirm(`Are you sure you want to delete ${food.foodName}?`)) {
      try {
        const response = await fetch(`api/deleteCustomFood/${food._id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${localStorage.token}`, "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error("Failed to delete food item");

        setFoodItems((prev) => prev.filter(item => item._id !== food._id));
        setStoredFoodItems((prev) => prev.filter(item => item._id !== food._id));
        onEditClose();
        setFormData({ foodName: "", calories: "", protein: "", carbohydrates: "", fat: "", fiber: "", serving_unit: "", serving_weight_grams: "" });
        setEditFoodItem(null);
      } catch (error) {
        alert("Error deleting food item: " + error);
      }
    }
  };

  const handleTrackClick = (food: any) => {
    navigate(`/trackCustomFood`, { state: { food: food } });
  };

  const renderFields = () => (
    <div className="flex flex-col gap-4">
      {Object.keys(formData).map((key) => (
        <div key={key}>
          <label htmlFor={key} className="block mb-1 font-medium capitalize">
            {fieldLabel(key)}
            {["foodName", "serving_unit", "calories", "serving_weight_grams"].includes(key) && <span aria-hidden="true" className="text-red-500"> *</span>}
          </label>
          <Input
            id={key}
            type={["calories", "protein", "carbohydrates", "fat", "fiber", "serving_weight_grams"].includes(key) ? "number" : "text"}
            name={key}
            required={["foodName", "serving_unit", "calories", "serving_weight_grams"].includes(key)}
            value={formData[key as keyof typeof formData]}
            onChange={handleChange}
          />
        </div>
      ))}
    </div>
  );

  return (
    <Sidenav>
      <div className="bg-white shadow-md rounded-lg p-0 mb-10">
        <div className="bg-[var(--dark-green)] rounded-t-lg px-6 py-4">
          <h2 className="text-xl font-bold text-white">Create and Track Custom Meals</h2>
        </div>
        <div className="p-6 rounded-b-lg text-[var(--dark-green)]">
          <p className="text-base font-medium">
            Build your own custom food items and log them as part of your daily meal tracking. Perfect for homemade or unique recipes!
          </p>
        </div>
      </div>
      <div className="bg-white shadow-md rounded-lg text-center p-6">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold tracking-tight text-[var(--dark-green)]">
            Create Your Own Meal
          </h1>
          <button
            type="button"
            onClick={handleCreateOpen}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-green-700 hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Create a Meal
          </button>
        </div>

        {/* Create Food Modal */}
        <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) onCreateClose(); }}>
          <DialogContent showCloseButton={false} className="p-0 overflow-hidden rounded-lg sm:max-w-lg">
            <DialogHeader className="bg-green-500 p-4">
              <DialogTitle className="text-center text-lg text-white">Add Food Item</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                {renderFields()}
              </form>
            </div>
            <DialogFooter className="px-6 pb-6 sm:justify-start">
              <button type="submit" onClick={handleSubmit} className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">
                Add Food Item
              </button>
              <button type="button" onClick={onCreateClose} className="ml-3 rounded-md bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600">
                Cancel
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Food Modal */}
        <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) onEditClose(); }}>
          <DialogContent showCloseButton={false} className="p-0 overflow-hidden rounded-lg">
            <DialogHeader className="bg-green-500 p-4">
              <DialogTitle className="text-center text-lg text-white">Edit Food Item</DialogTitle>
            </DialogHeader>
            <div className="p-6 mt-4">
              <form onSubmit={handleEditSubmit}>
                {renderFields()}
              </form>
            </div>
            <DialogFooter className="px-6 pb-6 sm:justify-start">
              <button type="submit" onClick={handleEditSubmit} className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">
                Save Changes
              </button>
              <button type="button" onClick={onEditClose} className="ml-3 rounded-md bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600">
                Cancel
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Display Added Food Items */}
        <ul className="flex flex-col gap-3 mt-20">
          {allFoodItems.length === 0 ? (
            <div>No food items added yet.</div>
          ) : (
            allFoodItems.map((food, index) => (
              <li
                key={index}
                className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-100"
                data-testid={`food-item-${food.foodName}`}
              >
                <div className="flex-1 text-left">
                  <strong>{food.foodName}</strong> - {food.details.calories} cal per {food.serving_unit}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="More actions"
                      title="More actions"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-input bg-transparent text-[var(--dark-green)] hover:bg-green-50 hover:text-green-700 transition-all"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-[150px]">
                    <DropdownMenuItem onClick={() => handleTrackClick(food)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Track
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditClick(food)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => handleDelete(food)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))
          )}
        </ul>
      </div>
    </Sidenav>
  );
};

export default CreateCustomFoodPage;
