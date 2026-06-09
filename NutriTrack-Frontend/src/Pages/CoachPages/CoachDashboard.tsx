import { useContext, useEffect, useState } from "react";
import { CoachNav } from "../../Components/Sections";
import { UserContext } from "../../contexts/UserContext";
import axiosInstance from "../../utils/axiosInstance";
import { notify } from "../../utils/notify";
import { useNavigate } from "react-router-dom";
import { Switch } from "../../Components/ui/switch";

const CoachDashboard = () => {
  const { logout, loggedUser } = useContext(UserContext) ?? {};
  const toast = notify;
  const navigate = useNavigate();
  const [dashData, setDashData] = useState<any>(null);
  const [available, setAvailable] = useState(false);
  const fetchDashboard = async () => {
    try {
      const res = await axiosInstance.get("/api/coach/dashboard", {
        headers: {
          Authorization: `Bearer ${loggedUser?.token}`,
        },
      });
      setDashData(res.data.dashData);
      setAvailable(res.data.dashData.available || false);
    } catch (err) {
      toast({
        title: "Failed to load dashboard",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [loggedUser?.token]);

  const handleToggleAvailability = async () => {
    try {
      const res = await axiosInstance.post(
        "/api/coach/change-availability",
        {},
        {
          headers: {
            Authorization: `Bearer ${loggedUser?.token}`,
          },
        }
      );

      toast({
        title: `Coach is now ${res.data.available ? "Available" : "Not Available"}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // Refresh dashboard data to reflect updated availability
      fetchDashboard();
    } catch (err) {
      toast({
        title: "Failed to toggle availability",
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
          <h2 className="text-xl font-bold text-white">Coach Dashboard</h2>
        </div>
        <div className="p-6 rounded-b-lg text-[var(--dark-green)]">
          <p className="text-base font-medium">
            Manage your coaching profile, monitor earnings, track appointments, and control your availability — all in one place.
          </p>
        </div>
      </div>

      {/* Dashboard Summary */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-[var(--dark-green)]">Overview</h3>
          <button type="button" className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700" onClick={() => navigate("/coach-appointments")}>Check Appointments</button>
        </div>
        {dashData ? (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 p-4 rounded-md bg-gray-50 shadow-sm">
              <p className="font-bold text-[var(--dark-green)]">Earnings</p>
              <p className="text-2xl">${dashData.earnings}</p>
            </div>
            <div className="flex-1 p-4 rounded-md bg-gray-50 shadow-sm">
              <p className="font-bold text-[var(--dark-green)]">Total Patients</p>
              <p className="text-2xl">{dashData.patients}</p>

            </div>
            <div className="flex-1 p-4 rounded-md bg-gray-50 shadow-sm">

              <p className="font-bold text-[var(--dark-green)]">Appointments</p>
              <p className="text-2xl">{dashData.appointments}</p>
            </div>
          </div>
        ) : (
          <p>Loading dashboard data...</p>
        )}
      </div>

      {/* Availability Toggle */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold mb-4 text-[var(--dark-green)]">Availability</h3>

          <p className="text-base font-medium pb-8">
            Toggle your availability status. When unavailable, you will not appear to users looking to book appointments.
          </p>


        <div className="flex items-center gap-6">
          <p className={`font-bold text-lg ${available ? "text-green-600" : "text-red-600"}`}>
            {available ? "Available" : "Not Available"}
          </p>
          <Switch
            checked={available}
            onCheckedChange={handleToggleAvailability}
            className="data-[state=checked]:bg-green-600"
          />
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <button type="button" className="rounded-md bg-red-500 px-4 py-2 text-lg font-semibold text-white hover:bg-red-600" onClick={logout}>
          Logout
        </button>
      </div>
    </CoachNav>
  );
};

export default CoachDashboard;
