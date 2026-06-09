import React, { useEffect, useState } from 'react';
import { Loader2 } from "lucide-react";
import { Sidenav } from "../../Components/Sections";
import { useNavigate } from 'react-router-dom';
import axiosInstance from "../../utils/axiosInstance";
import { Progress } from "../../Components/ui/progress";

const Stat = ({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
  <div>
    <div className="text-lg font-bold">{label}</div>
    <div className="text-base">{value}</div>
  </div>
);

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [waterIntake, setWaterIntake] = useState<number>(() => {
    // Retrieve the saved water intake from local storage or default to 0
    const savedWaterIntake = localStorage.getItem('waterIntake');
    return savedWaterIntake ? parseInt(savedWaterIntake, 10) : 0;
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axiosInstance.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(response.data.userProfile);
      } catch (error) {
        console.error('Error fetching profile', error);
      }
    };

    fetchProfile();
  }, []);

  // Save water intake to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('waterIntake', waterIntake.toString());
  }, [waterIntake]);

  if (!profile) {
    return <Loader2 className="w-12 h-12 animate-spin text-blue-500" />;
  }

  const calculateBMR = (weight: number, height: number, age: number, gender: string) => {
    if (gender === 'male') {
      return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
  };

  const calculateTDEE = (bmr: number, activityLevel: string) => {
    switch (activityLevel) {
      case 'light':
        return bmr * 1.375;
      case 'moderate':
        return bmr * 1.55;
      case 'active':
        return bmr * 1.725;
      case 'very active':
        return bmr * 1.9;
      default:
        return bmr;
    }
  };

  const calculateProteinNeeds = (weight: number) => {
    return weight * 1.6;
  };

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const calculateHydrationNeeds = (weight: number, activityLevel: string) => {
    let baseWater = weight * 0.033;
    if (activityLevel === 'active' || activityLevel === 'very active') {
      baseWater += 500;
    }
    return baseWater * 5;
  };

  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const proteinNeeds = calculateProteinNeeds(profile.weight);
  const bmi = calculateBMI(profile.weight, profile.height);
  const hydrationNeeds = calculateHydrationNeeds(profile.weight, profile.activityLevel);
  const waterPercentage = Math.min((waterIntake / hydrationNeeds) * 100, 120);

  const getHydrationMessage = () => {
    if (waterPercentage < 30) return "Need to drink more water!";
    if (waterPercentage >= 30 && waterPercentage < 70) return "Progress is going well!";
    if (waterPercentage >= 70 && waterPercentage <= 100) return "You are well hydrated!";
    if (waterPercentage > 100) return "Too much is also bad!";
    return "";
  };

  const handleWaterChange = (amount: number) => {
    setWaterIntake((prev) => Math.max(0, prev + amount));
  };

  return (
    <Sidenav>
      <div className="bg-white shadow-md rounded-lg p-0 mb-10">
        <div className="bg-[var(--dark-green)] rounded-t-lg px-6 py-4">
          <h2 className="text-xl font-bold text-white">Dashboard</h2>
        </div>
        <div className="p-6 rounded-b-lg text-[var(--dark-green)]">
          <p className="text-base font-medium">
            View your personalized health summary including daily calorie needs, BMI, hydration goals, and more. Use the Edit Profile button to keep your stats updated.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl py-6">
        <div className="flex flex-col gap-4 items-center">
          <div className="p-5 shadow-md border rounded-md bg-[var(--soft-white)] w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <Stat label="Name" value={profile.name} />
              <Stat label="Age" value={profile.age} />
              <Stat label="Gender" value={profile.gender} />
              <Stat label="Activity Level" value={profile.activityLevel} />
              <Stat label="Height" value={`${profile.height} cm`} />
              <Stat label="Weight" value={`${profile.weight} kg`} />
              <Stat label="Daily Calorie Needs" value={`${Math.round(tdee)} kcal`} />
              <Stat label="Daily Protein Needs" value={`${Math.round(proteinNeeds)} g`} />
              <Stat label="BMI" value={bmi.toFixed(2)} />
            </div>

            {/* Hydration Bar */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Hydration Tracker</h3>
              <div className="flex flex-row items-center gap-2">
                <button type="button" className="rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600" onClick={() => handleWaterChange(-250)}>-</button>
                <span className="text-lg">{(waterIntake / 250)} glasses</span>
                <button type="button" className="rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600" onClick={() => handleWaterChange(250)}>+</button>
              </div>
              <Progress value={waterPercentage} className="h-3 mt-2 [&_[data-slot=progress-indicator]]:bg-blue-500" />
              <p className="mt-2 text-sm font-bold">{getHydrationMessage()}</p>
            </div>

            {/* Display Daily Water Intake */}
            <div className="mt-6">
              <div className="flex">
                <Stat label="Daily Water Intake" value={`${Math.round(waterIntake)} mL / ${Math.round(hydrationNeeds)} mL`} />
              </div>
            </div>

            <button type="button" className="mt-4 rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700" onClick={() => navigate('/profile-setup', { state: { profile } })}>
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </Sidenav>
  );
};

export default Dashboard;
