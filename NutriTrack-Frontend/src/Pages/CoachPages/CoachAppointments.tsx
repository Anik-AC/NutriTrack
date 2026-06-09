import { useEffect, useState, useContext } from "react";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import { MdEdit } from "react-icons/md";
import { CoachNav } from "../../Components/Sections";
import axiosInstance from "../../utils/axiosInstance";
import { notify } from "../../utils/notify";
import { UserContext } from "../../contexts/UserContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../Components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../Components/ui/dialog";
import { useDisclosure } from "../../hooks/use-disclosure";

interface Appointment {
  _id: string;
  coachId: string;
  slotDate: string;
  slotTime: string;
  cancelled: boolean;
  payment: boolean;
  isCompleted: boolean;
  userData: {
    name: string;
    email: string;
  };
}

const CoachAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelled, setShowCancelled] = useState(false);
  const { loggedUser } = useContext(UserContext) ?? {};
  const toast = notify;
  const {
    isOpen: isCancelOpen,
    onOpen: onCancelOpen,
    onClose: onCancelClose,
  } = useDisclosure();
  const {
    isOpen: isCompleteOpen,
    onOpen: onCompleteOpen,
    onClose: onCompleteClose,
  } = useDisclosure();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const res = await axiosInstance.get("/api/coach/appointments", {
        headers: {
          Authorization: `Bearer ${loggedUser?.token}`,
        },
      });
      setAppointments(res.data.appointments || []);
    } catch (err) {
      toast({
        title: "Error loading appointments",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [loggedUser?.token]);

  const handleCancel = async () => {
    if (!selectedAppointmentId) return;
    try {
      await axiosInstance.post(
        "/api/coach/cancel-appointment",
        { appointmentId: selectedAppointmentId },
        {
          headers: {
            Authorization: `Bearer ${loggedUser?.token}`,
          },
        }
      );
      toast({
        title: "Appointment cancelled",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onCancelClose();
      fetchAppointments();
    } catch (err) {
      toast({
        title: "Failed to cancel appointment",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleComplete = async () => {
    if (!selectedAppointmentId) return;
    try {
      await axiosInstance.post(
        "/api/coach/complete-appointment",
        { appointmentId: selectedAppointmentId },
        {
          headers: {
            Authorization: `Bearer ${loggedUser?.token}`,
          },
        }
      );
      toast({
        title: "Appointment marked as completed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onCompleteClose();
      fetchAppointments();
    } catch (err) {
      toast({
        title: "Failed to complete appointment",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const activeAppointments = appointments.filter(appt => !appt.cancelled);
  const cancelledAppointments = appointments.filter(appt => appt.cancelled);

  return (
    <CoachNav>
      <div className="p-8">
        <div className="bg-white shadow-md rounded-lg p-0 mb-10">
          <div className="bg-[var(--dark-green)] rounded-t-lg px-6 py-4">
            <h2 className="text-xl font-bold text-white">Coach Appointments</h2>
          </div>
          <div className="p-6 text-[var(--dark-green)]">
            <p className="text-base font-medium">
              View and manage all your upcoming appointments with clients.
            </p>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAppointments.map((appt, index) => (
                    <TableRow key={appt._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{appt.userData?.email}</TableCell>
                      <TableCell>{appt.slotDate}</TableCell>
                      <TableCell>{appt.slotTime}</TableCell>
                      <TableCell>
                        {appt.payment
                          ? <CheckCircle2 className="text-green-500 w-4 h-4" />
                          : <X className="text-red-500 w-4 h-4" />}
                      </TableCell>
                      <TableCell>
                        {appt.isCompleted
                          ? <CheckCircle2 className="text-green-500 w-4 h-4" />
                          : <X className="text-red-500 w-4 h-4" />}
                      </TableCell>
                      <TableCell>
                        {!appt.isCompleted && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="rounded-md border border-input bg-transparent px-2.5 py-1 text-sm hover:bg-muted"
                              onClick={() => {
                                setSelectedAppointmentId(appt._id);
                                onCompleteOpen();
                              }}
                            >
                              Complete Appointment
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm hover:bg-muted"
                              onClick={() => {
                                setSelectedAppointmentId(appt._id);
                                onCancelOpen();
                              }}
                            >
                              <MdEdit />
                              Cancel Appointment
                            </button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {cancelledAppointments.length > 0 && (
          <div className="mt-6">
            <button type="button" className="rounded-md border border-input bg-transparent px-3 py-2 hover:bg-muted" onClick={() => setShowCancelled(!showCancelled)}>
              {showCancelled ? "Hide Cancelled Appointments" : "Show Cancelled Appointments"}
            </button>

            {showCancelled && (
              <div className="mt-4 bg-white shadow-md rounded-lg p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cancelledAppointments.map((appt, index) => (
                        <TableRow key={appt._id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{appt.userData?.email}</TableCell>
                          <TableCell>{appt.slotDate}</TableCell>
                          <TableCell>{appt.slotTime}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        <Dialog open={isCancelOpen} onOpenChange={(open) => { if (!open) onCancelClose(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Appointment</DialogTitle>
            </DialogHeader>
            <div>
              Are you sure you want to cancel this appointment?
            </div>
            <DialogFooter className="sm:justify-end">
              <button type="button" className="mr-3 rounded-md bg-transparent px-4 py-2 hover:bg-muted" onClick={onCancelClose}>
                No
              </button>
              <button type="button" className="rounded-md bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600" onClick={handleCancel}>
                Yes
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCompleteOpen} onOpenChange={(open) => { if (!open) onCompleteClose(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Appointment</DialogTitle>
            </DialogHeader>
            <div>
              Are you sure you want to mark this appointment as completed?
            </div>
            <DialogFooter className="sm:justify-end">
              <button type="button" className="mr-3 rounded-md bg-transparent px-4 py-2 hover:bg-muted" onClick={onCompleteClose}>
                No
              </button>
              <button type="button" className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700" onClick={handleComplete}>
                Yes
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CoachNav>
  );
};

export default CoachAppointments;
