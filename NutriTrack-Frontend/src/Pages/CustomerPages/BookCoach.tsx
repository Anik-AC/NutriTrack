import { useEffect, useState, useContext } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { notify } from "../../utils/notify";
import { Sidenav } from "../../Components/Sections";
import { UserContext } from "../../contexts/UserContext";
import { coach_1, coach_2, coach_3, coach_4, coach_5 } from "@/assets";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../styles/coachCalendar.css";
import { Card, CardContent } from "../../Components/ui/card";
import { Separator } from "../../Components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../Components/ui/dialog";
import { useDisclosure } from "../../hooks/use-disclosure";

interface Coach {
  _id: string;
  coachId: string;
  name: string;
  speciality: string;
  degree: string;
  experience: string;
  about: string;
  available: boolean;
  fees: number;
  slots_booked: Record<string, string[]>;
  address: {
    city: string;
    state?: string;
    zip: string;
  };
}

const coachImages = [coach_1, coach_2, coach_3, coach_4, coach_5];
const allSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"
];

const BookCoach = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { loggedUser } = useContext(UserContext) ?? {};
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const toast = notify;

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const res = await axiosInstance.get("/api/booking/list-coaches", {
          headers: {
            Authorization: `Bearer ${loggedUser?.token}`,
          },
        });
        setCoaches(res.data.coaches || []);
      } catch (err) {
        console.error("Error fetching coaches:", err);
      }
    };
    fetchCoaches();
  }, [loggedUser?.token]);

  const fetchCoaches = async () => {
    try {
      const res = await axiosInstance.get("/api/booking/list-coaches", {
        headers: {
          Authorization: `Bearer ${loggedUser?.token}`,
        },
      });
      setCoaches(res.data.coaches || []);
    } catch (err) {
      console.error("Error fetching coaches:", err);
    }
  };


  const handleOpenModal = (coach: Coach) => {
    setSelectedCoach(coach);
    setSelectedDate(null);
    setSelectedSlot(null);
    onOpen();
  };

  const handleBook = async () => {
    if (!selectedCoach || !selectedDate || !selectedSlot) {
      toast({
        title: "Please select a time slot.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const res = await axiosInstance.post(
        "/api/booking/book-appointment",
        {
          coachId: selectedCoach.coachId,
          slotDate: selectedDate.toISOString().split("T")[0],
          slotTime: selectedSlot,
        },
        {
          headers: {
            Authorization: `Bearer ${loggedUser?.token}`,
          },
        }
      );

      if (res.data.success) {
        toast({
          title: "Appointment booked! Redirecting to payment...",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        fetchCoaches();

        // Now get the payment Stripe URL
        const paymentRes = await axiosInstance.post(
          "/api/booking/payment-stripe",
          {
            appointmentId: res.data.appointmentId,
          },
          {
            headers: {
              Authorization: `Bearer ${loggedUser?.token}`,
            },
          }
        );

        if (paymentRes.data.session_url) {
            window.location.href = paymentRes.data.session_url;
          } else {
            toast({
              title: "Stripe payment URL missing.",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          }

      } else {
        toast({
          title: res.data.message || "Failed to book appointment",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }

    } catch (error) {
      console.error("Booking failed", error);
      toast({
        title: "Server error while booking",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getAvailableSlots = (dateStr: string) => {
    if (!selectedCoach) return [];
    const booked = selectedCoach.slots_booked?.[dateStr] || [];
    return allSlots.filter((slot) => !booked.includes(slot));
  };

  const tileClassName = ({ date }: { date: Date }) => {
    if (!selectedCoach) return "";
    const dateStr = date.toISOString().split("T")[0];
    const booked = selectedCoach.slots_booked?.[dateStr] || [];
    const isSunday = date.getDay() === 0;

    if (isSunday || booked.length >= allSlots.length) {
      return "fully-booked";
    }
    return "available";
  };

  const tileDisabled = ({ date }: { date: Date }) => {
    if (!selectedCoach) return false;
    const dateStr = date.toISOString().split("T")[0];
    const booked = selectedCoach.slots_booked?.[dateStr] || [];
    const isSunday = date.getDay() === 0;
    return isSunday || booked.length >= allSlots.length;
  };

  return (
    <Sidenav>
      <div className="p-8">
        <div className="bg-white shadow-md rounded-lg p-0 mb-10">
          <div className="bg-[var(--dark-green)] rounded-t-lg px-6 py-4">
            <h2 className="text-xl font-bold text-white">Book a Coach</h2>
          </div>
          <div className="p-6 text-[var(--dark-green)]">
            <p className="text-base font-medium">
              Explore our certified coaches to help you with your fitness and nutrition goals. Click "Book" to view more details and start your journey.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map((coach, index) => (
            <Card key={coach._id} className="shadow-md rounded-md">
              <CardContent>
                <img src={coachImages[index % coachImages.length]} alt={coach.name} className="rounded-md object-cover object-top w-full h-[180px]" />
                <h3 className="text-lg font-bold mt-4">{coach.name}</h3>
                <p className="text-sm text-gray-500">{coach.speciality}</p>
                <button type="button" className="mt-4 rounded-md bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-600" onClick={() => handleOpenModal(coach)}>Book</button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto py-6 px-4 bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-700">{selectedCoach?.name}</DialogTitle>
            </DialogHeader>
              {selectedCoach && (
                <div>
                  <img src={coachImages[coaches.findIndex(c => c._id === selectedCoach._id) % coachImages.length]} alt={selectedCoach.name} className="rounded-md object-cover object-top w-full h-[240px] mb-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div><p className="font-semibold">Speciality:</p><p>{selectedCoach.speciality}</p></div>
                    <div><p className="font-semibold">Experience:</p><p>{selectedCoach.experience}</p></div>
                    <Separator className="col-span-full" />
                    <div><p className="font-semibold">Degree:</p><p>{selectedCoach.degree}</p></div>
                    <div><p className="font-semibold">Fees:</p><p>${selectedCoach.fees}</p></div>
                    <Separator className="col-span-full" />
                    <div><p className="font-semibold">About:</p><p>{selectedCoach.about}</p></div>
                    <div><p className="font-semibold">Location:</p><p>{selectedCoach.address.city}, {selectedCoach.address.state || ""}</p></div>
                    <Separator className="col-span-full" />
                  </div>

                  <div className="flex gap-6 flex-col md:flex-row">
                    <div>
                      <p className="font-bold mb-2">Select Date</p>
                      <Calendar
                        onChange={(val) => setSelectedDate(val as Date)}
                        tileClassName={tileClassName}
                        tileDisabled={tileDisabled}
                        minDate={new Date()}
                        prev2Label={null}
                        next2Label={null}
                        nextLabel={">"}
                        prevLabel="<"
                        calendarType="gregory"
                        navigationLabel={({ date }) => `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`}
                      />
                    </div>
                    <div className="flex-1">
                      {selectedDate && (
                        <>
                          <p className="font-bold mb-2">Available Slots for {selectedDate.toDateString()}</p>
                          <div className="flex flex-wrap gap-2">
                            {getAvailableSlots(selectedDate.toISOString().split("T")[0]).map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`rounded-md px-3 py-1.5 text-sm font-semibold border ${
                                  selectedSlot === slot
                                    ? "bg-[var(--dark-green)] text-white border-[var(--dark-green)]"
                                    : "border-green-600 text-green-700 hover:bg-green-50"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                          {selectedSlot && (
                            <button type="button" className="mt-6 rounded-md bg-[var(--dark-green)] px-4 py-2 font-semibold text-white hover:opacity-90" onClick={handleBook}>Confirm Booking</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </DialogContent>
        </Dialog>
      </div>
    </Sidenav>
  );
};

export default BookCoach;
