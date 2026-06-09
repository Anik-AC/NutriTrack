import React, { useState} from "react";
import TrackSearch from "@/Pages/CustomerPages/TrackSearch";
import FoodItem from "@/Pages/CustomerPages/TrackFoodItem";
import {Sidenav} from "../../Components/Sections";
// import '../App.css';

const TrackPage: React.FC = () => {
  const [selectedFood, setSelectedFood] = useState(null);
  return (
    <Sidenav>
    <div className="bg-white shadow-md rounded-lg p-0 mb-10">
      <div className="bg-[var(--dark-green)] rounded-t-lg px-6 py-4">
        <h2 className="text-xl font-bold text-white">Track Today's Meals</h2>
      </div>
      <div className="p-6 rounded-b-lg text-[var(--dark-green)]">
        <p className="text-base font-medium">
          Search for food items you've eaten today and log them to track your nutritional intake throughout the day.
        </p>
      </div>
    </div>
    <div className="bg-white shadow-md rounded-lg p-6">
      <section className="container track-container">
        <TrackSearch setSelectedFood={setSelectedFood} />
        {selectedFood && <FoodItem food={selectedFood} />}
      </section>
    </div>
    </Sidenav>
  );
};

export default TrackPage;
