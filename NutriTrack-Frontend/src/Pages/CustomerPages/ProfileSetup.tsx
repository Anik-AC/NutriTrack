import React, { useState, useContext, FormEvent } from 'react';
import axiosInstance from "../../utils/axiosInstance.ts";
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from "../../Components/ui/input";
import { Sidenav } from "../../Components/Sections";
import { UserContext } from "../../contexts/UserContext";

const selectClasses = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-base md:text-sm";

const ProfileSetup: React.FC = () => {
  const location = useLocation();
  const profile = location.state?.profile || {};
  const [name, setName] = useState<string>(profile.name || '');
  const [age, setAge] = useState<number | string>(profile.age || '');
  const [gender, setGender] = useState<string>(profile.gender || '');
  const [activityLevel, setActivityLevel] = useState<string>(profile.activityLevel || '');
  const [height, setHeight] = useState<number | string>(profile.height || '');
  const [weight, setWeight] = useState<number | string>(profile.weight || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();
  const userContext = useContext(UserContext);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name) newErrors.name = "Name is required";
    if (!age || Number(age) <= 0) newErrors.age = "Age must be a positive number";
    if (!gender) newErrors.gender = "Gender is required";
    if (!activityLevel) newErrors.activityLevel = "Activity Level is required";
    if (!height || Number(height) <= 0) newErrors.height = "Height must be greater than 0";
    if (!weight || Number(weight) <= 0) newErrors.weight = "Weight must be a positive number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const token = localStorage.getItem("token") || "";
      const data = { name, age, gender, activityLevel, height, weight };

      const response = await axiosInstance.post('/api/user/profile/setup', data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { userProfile } = response.data;
      const storedUser = JSON.parse(localStorage.getItem("loggedUser") || "{}");

      const updatedUser = {
        userid: storedUser.userid || userProfile.user,
        token,
        name: userProfile.name,
        profileCompleted: userProfile.profileCompleted,
        userType: storedUser.userType,
        verified: storedUser.verified,
        tokenExpiry: storedUser.tokenExpiry,
      };

      localStorage.setItem("loggedUser", JSON.stringify(updatedUser));

      if (userContext && userContext.setLoggedUser) {
        userContext.setLoggedUser(updatedUser);
      }

      navigate("/dashboard");
    } catch (error) {
      console.error('Error updating profile', error);
      navigate('/dashboard');
    }
  };

  return (
    <Sidenav>
        <div className="bg-white shadow-md rounded-lg p-0 mb-10">
          <div className="bg-[var(--dark-green)] rounded-t-lg px-6 py-4">
            <h2 className="text-xl font-bold text-white">Profile</h2>
          </div>
          <div className="p-6 rounded-b-lg text-[var(--dark-green)]">
            <p className="text-base font-medium">
              Fill in your personal details to calculate your nutritional needs and personalize your dashboard.
            </p>
          </div>
        </div>
      <div className="mx-auto w-full max-w-xl py-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col items-stretch gap-4">
              {Object.values(errors).map((err, index) => (
                <p key={index} className="text-red-500">{err}</p>
              ))}

              <div>
                <label htmlFor="name" className="block mb-1 font-medium">Name</label>
                <Input id="name" type="text" required value={name} aria-invalid={!!errors.name || undefined} onChange={(e) => setName(e.target.value)} />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="age" className="block mb-1 font-medium">Age (years)</label>
                <Input id="age" type="number" required value={age} aria-invalid={!!errors.age || undefined} onChange={(e) => setAge(Number(e.target.value))} />
                {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
              </div>

              <div>
                <label htmlFor="gender" className="block mb-1 font-medium">Gender</label>
                <select id="gender" required value={gender} className={selectClasses} onChange={(e) => setGender(e.target.value)}>
                  <option value=""></option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
              </div>

              <div>
                <label htmlFor="activityLevel" className="block mb-1 font-medium">Activity Level</label>
                <select id="activityLevel" required value={activityLevel} className={selectClasses} onChange={(e) => setActivityLevel(e.target.value)}>
                  <option value=""></option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                  <option value="very active">Very Active</option>
                </select>
                {errors.activityLevel && <p className="text-sm text-destructive">{errors.activityLevel}</p>}
              </div>

              <div>
                <label htmlFor="height" className="block mb-1 font-medium">Height (cm)</label>
                <Input id="height" type="number" required value={height} aria-invalid={!!errors.height || undefined} onChange={(e) => setHeight(Number(e.target.value))} />
                {errors.height && <p className="text-sm text-destructive">{errors.height}</p>}
              </div>

              <div>
                <label htmlFor="weight" className="block mb-1 font-medium">Weight (kg)</label>
                <Input id="weight" type="number" required value={weight} aria-invalid={!!errors.weight || undefined} onChange={(e) => setWeight(Number(e.target.value))} />
                {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
              </div>

              <button type="submit" className="mt-4 rounded-md bg-green-600 px-4 py-2 text-lg font-semibold text-white hover:bg-green-700">Save</button>
            </div>
          </form>
        </div>
      </div>
    </Sidenav>
  );
};

export default ProfileSetup;
