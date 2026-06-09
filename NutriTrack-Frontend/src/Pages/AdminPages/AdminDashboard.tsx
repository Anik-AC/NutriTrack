import { Sidebar } from "../../Components/Sections";
import { useContext, useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { notify } from "../../utils/notify";
import { UserContext } from "../../contexts/UserContext";
import { Input } from "../../Components/ui/input";

const AdminDashboard = () => {
  const { loggedUser } = useContext(UserContext) ?? {};
  const toast = notify;
  const [userId, setUserId] = useState("");
  const [coachId, setCoachId] = useState("");
  const [emailQuery, setEmailQuery] = useState("");
  const [fetchedUserId, setFetchedUserId] = useState("");
  const [dashData, setDashData] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      const res = await axiosInstance.get("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${loggedUser?.token}` },
      });
      setDashData(res.data.dashData);
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

  const promoteToAdmin = async () => {
    try {
      const res = await axiosInstance.post(
        "/api/admin/promote-to-admin",
        { userId },
        {
          headers: { Authorization: `Bearer ${loggedUser?.token}` },
        }
      );
      toast({
        title: res.data.message || "Promoted to Admin",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Failed to promote to Admin",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const promoteToCoach = async () => {
    try {
      const res = await axiosInstance.post(
        "/api/admin/promote-to-coach",
        { userId: coachId },
        {
          headers: { Authorization: `Bearer ${loggedUser?.token}` },
        }
      );
      toast({
        title: res.data.message || "Promoted to Coach",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Failed to promote to Coach",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchUserIdFromEmail = async () => {
    try {
      const res = await axiosInstance.post(
        "/api/admin/getID",
        { email: emailQuery },
        {
          headers: { Authorization: `Bearer ${loggedUser?.token}` },
        }
      );
      if (res.data.success && res.data.userId) {
        setFetchedUserId(res.data.userId);
        toast({
          title: "User ID fetched successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: res.data.message || "User not found",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: "Failed to fetch user ID",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Sidebar>
      <div className="bg-white shadow-md rounded-lg p-0 mb-10">
        <div className="bg-[var(--dark-green)] rounded-t-lg px-6 py-4">
          <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
        </div>
        <div className="p-6 rounded-b-lg text-[var(--dark-green)]">
          <p className="text-base font-medium">
            Manage platform statistics and promote users to coach or admin roles.
          </p>
        </div>
      </div>

      {/* Overview Box */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-[var(--dark-green)] mb-4">Overview</h3>
        {dashData ? (
          <div className="flex flex-col items-stretch gap-4">
            <p><b>Coaches:</b> {dashData.coaches}</p>
            <p><b>Patients:</b> {dashData.patients}</p>
            <p><b>Total Appointments:</b> {dashData.appointments}</p>
          </div>
        ) : (
          <p>Loading dashboard data...</p>
        )}
      </div>

      {/* Get User ID from Email Box */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-[var(--dark-green)] mb-4">Find User ID by Email</h3>
        <p className="text-base font-medium mb-4">
          Enter the email address of a user to retrieve their user ID for admin or coach promotion.
        </p>
        <Input
          placeholder="Enter Email Address"
          value={emailQuery}
          onChange={(e) => setEmailQuery(e.target.value)}
          className="mb-4"
        />
        <button type="button" className="rounded-md bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 mb-2" onClick={fetchUserIdFromEmail}>Get User ID</button>
        {fetchedUserId && (
          <p className="font-medium mt-2 text-[var(--dark-green)]">
            User ID: <strong>{fetchedUserId}</strong>
          </p>
        )}
      </div>

      {/* Promote to Admin Box */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-[var(--dark-green)] mb-4">Promote to Admin</h3>
        <p className="text-base font-medium mb-4">
          Enter a user ID below to grant them administrative privileges.
        </p>
        <Input
          placeholder="Enter User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="mb-4"
        />
        <button type="button" className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700" onClick={promoteToAdmin}>Promote to Admin</button>
      </div>

      {/* Promote to Coach Box */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-[var(--dark-green)] mb-4">Promote to Coach</h3>
        <p className="text-base font-medium mb-4">
          Enter a user ID to promote them to a coach. They'll appear to users for appointments after completing their profile.
        </p>
        <Input
          placeholder="Enter User ID"
          value={coachId}
          onChange={(e) => setCoachId(e.target.value)}
          className="mb-4"
        />
        <button type="button" className="rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600" onClick={promoteToCoach}>Promote to Coach</button>
      </div>

    </Sidebar>
  );
};

export default AdminDashboard;
