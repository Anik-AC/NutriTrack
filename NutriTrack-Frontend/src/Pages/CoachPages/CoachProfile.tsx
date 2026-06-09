import { useContext, useEffect, useState } from "react";
import { CoachNav } from "../../Components/Sections";
import axiosInstance from "../../utils/axiosInstance";
import { notify } from "../../utils/notify";
import { UserContext } from "../../contexts/UserContext";
import { Input } from "../../Components/ui/input";

const CoachProfile = () => {
    const { loggedUser } = useContext(UserContext) ?? {};
    const [profile, setProfile] = useState<any>({});
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const toast = notify;

    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/api/coach/profile", {
          headers: { Authorization: `Bearer ${loggedUser?.token}` },
        });
        if (res.data.success) setProfile(res.data.profileData);
      } catch (err) {
        console.error("Failed to load coach profile", err);
      }
    };

    useEffect(() => {
      fetchProfile();
    }, [loggedUser?.token]);

    const handleChange = (field: string, value: any) => {
      setProfile({ ...profile, [field]: value });
    };

    const handleAddressChange = (field: string, value: string) => {
      setProfile({
        ...profile,
        address: { ...profile.address, [field]: value },
      });
    };

    const validate = () => {
      const newErrors: { [key: string]: string } = {};
      if (!profile.name) newErrors.name = "Name is required";
      if (!profile.speciality) newErrors.speciality = "Speciality is required";
      if (!profile.degree) newErrors.degree = "Degree is required";
      if (!profile.experience) newErrors.experience = "Experience is required";
      if (!profile.about) newErrors.about = "About section is required";
      if (!profile.fees || profile.fees <= 0) newErrors.fees = "Fees must be positive";
      if (!profile.address?.city) newErrors.city = "City is required";
      if (!profile.address?.zip) newErrors.zip = "ZIP is required";
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
      if (!validate()) return;
      try {
        await axiosInstance.post(
          "/api/coach/update-coach",
          profile,
          {
            headers: { Authorization: `Bearer ${loggedUser?.token}` },
          }
        );
        toast({
          title: "Profile updated successfully!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        fetchProfile();
      } catch (error) {
        console.error("Update failed", error);
        toast({
          title: "Failed to update profile",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    return (
      <CoachNav>
        <div className="bg-white shadow-md rounded-lg p-0 mb-10">
          <div className="bg-[var(--dark-green)] rounded-t-lg px-6 py-4">
            <h2 className="text-xl font-bold text-white">Coach Profile</h2>
          </div>
          <div className="p-6 rounded-b-lg text-[var(--dark-green)]">
            <p className="text-base font-medium">
              Update your professional details to help users better understand your qualifications and expertise.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl py-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex flex-col items-stretch gap-4">
              <div>
                <label htmlFor="name" className="block mb-1 font-medium">Name<span className="text-red-500"> *</span></label>
                <Input id="name" value={profile.name || ""} aria-invalid={!!errors.name || undefined} onChange={(e) => handleChange("name", e.target.value)} />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="speciality" className="block mb-1 font-medium">Speciality<span className="text-red-500"> *</span></label>
                <Input id="speciality" value={profile.speciality || ""} aria-invalid={!!errors.speciality || undefined} onChange={(e) => handleChange("speciality", e.target.value)} />
                {errors.speciality && <p className="text-sm text-destructive">{errors.speciality}</p>}
              </div>

              <div>
                <label htmlFor="degree" className="block mb-1 font-medium">Degree<span className="text-red-500"> *</span></label>
                <Input id="degree" value={profile.degree || ""} aria-invalid={!!errors.degree || undefined} onChange={(e) => handleChange("degree", e.target.value)} />
                {errors.degree && <p className="text-sm text-destructive">{errors.degree}</p>}
              </div>

              <div>
                <label htmlFor="experience" className="block mb-1 font-medium">Experience<span className="text-red-500"> *</span></label>
                <Input id="experience" value={profile.experience || ""} aria-invalid={!!errors.experience || undefined} onChange={(e) => handleChange("experience", e.target.value)} />
                {errors.experience && <p className="text-sm text-destructive">{errors.experience}</p>}
              </div>

              <div>
                <label htmlFor="about" className="block mb-1 font-medium">About<span className="text-red-500"> *</span></label>
                <Input id="about" value={profile.about || ""} aria-invalid={!!errors.about || undefined} onChange={(e) => handleChange("about", e.target.value)} />
                {errors.about && <p className="text-sm text-destructive">{errors.about}</p>}
              </div>

              <div>
                <label htmlFor="fees" className="block mb-1 font-medium">Fees ($)<span className="text-red-500"> *</span></label>
                <Input id="fees" type="number" value={profile.fees || ""} aria-invalid={!!errors.fees || undefined} onChange={(e) => handleChange("fees", parseInt(e.target.value))} />
                {errors.fees && <p className="text-sm text-destructive">{errors.fees}</p>}
              </div>

              <div>
                <label htmlFor="city" className="block mb-1 font-medium">City<span className="text-red-500"> *</span></label>
                <Input id="city" value={profile.address?.city || ""} aria-invalid={!!errors.city || undefined} onChange={(e) => handleAddressChange("city", e.target.value)} />
                {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
              </div>

              <div>
                <label htmlFor="state" className="block mb-1 font-medium">State</label>
                <Input id="state" value={profile.address?.state || ""} onChange={(e) => handleAddressChange("state", e.target.value)} />
              </div>

              <div>
                <label htmlFor="zip" className="block mb-1 font-medium">ZIP Code<span className="text-red-500"> *</span></label>
                <Input id="zip" value={profile.address?.zip || ""} aria-invalid={!!errors.zip || undefined} onChange={(e) => handleAddressChange("zip", e.target.value)} />
                {errors.zip && <p className="text-sm text-destructive">{errors.zip}</p>}
              </div>

              <button type="button" className="mt-4 rounded-md bg-green-600 px-4 py-2 text-lg font-semibold text-white hover:bg-green-700" onClick={handleSubmit}>
                Save
              </button>
            </div>
          </div>
        </div>
      </CoachNav>
    );
  };

  export default CoachProfile;
