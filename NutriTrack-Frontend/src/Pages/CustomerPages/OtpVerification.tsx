import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import OtpInput from "react-otp-input"; // ✅ Import react-otp-input
import axiosInstance from "../../utils/axiosInstance";
import { notify } from "../../utils/notify";
import { UserContext } from "../../contexts/UserContext";
import { Sidenav } from "../../Components/Sections";

const OtpVerification = () => {
  const [otp, setOtp] = useState(""); // ✅ Single state for OTP input
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const toast = notify;
  const navigate = useNavigate();
  const { loggedUser, setLoggedUser } = useContext(UserContext) ?? {};
  const token = loggedUser?.token; // ✅ Use token for authentication

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a complete 6-digit OTP.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/api/auth/verify-otp",
        { otp },
        { headers: { Authorization: `Bearer ${token}` } } // ✅ Use token in headers
      );

      const { token: newToken, userType, profileCompleted, userProfile, expiresIn, verified } = response.data;
      const tokenExpiry = Date.now() + expiresIn * 1000;

      if (setLoggedUser) {
        setLoggedUser({
          userid: userProfile.user,
          token: newToken,
          name: userProfile.name,
          profileCompleted,
          userType,
          verified,
          tokenExpiry,
        });

        localStorage.setItem("loggedUser", JSON.stringify({
          userid: userProfile.user,
          token: newToken,
          name: userProfile.name,
          profileCompleted,
          userType,
          verified,
          tokenExpiry,
        }));
      }

      toast({
        title: "OTP Verified!",
        description: "Your account is now verified.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      navigate("/dashboard"); // ✅ Redirect to dashboard after successful verification
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Invalid or expired OTP. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendTimer(30);
    await axiosInstance.post(
      "/api/auth/generate-otp",
      {},
      { headers: { Authorization: `Bearer ${token}` } } // ✅ Use token in headers
    );
    toast({
      title: "OTP Sent",
      description: "A new OTP has been sent to your email.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Sidenav>
      <div className="w-full h-[calc(100vh-80px)] flex-grow pt-[80px] bg-alternate flex flex-col items-center">
        <div className="mx-auto w-full max-w-md p-6 shadow-md rounded-md bg-white">
        <p className="text-2xl font-bold">Email Verification</p>
        <p className="text-base text-gray-600 mb-3">
          You need to verify your email account using the OTP to continue.
        </p>
        <p className="text-sm text-gray-500 mb-5">
          Enter the 6-digit OTP sent to your email.
        </p>

          {/* ✅ Smooth OTP Input */}
          <OtpInput
            value={otp}
            onChange={setOtp}
            numInputs={6}
            inputStyle={{
              width: "3rem",
              height: "3rem",
              fontSize: "1.5rem",
              textAlign: "center",
              border: "1px solid gray",
              borderRadius: "5px",
              backgroundColor: "#f1f1f1",
              margin: "0 0.5rem",
            }}
            renderInput={(props) => <input {...props} />}
          />

          <button
            type="button"
            className="mt-4 w-full rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 disabled:opacity-70"
            disabled={loading}
            onClick={handleVerifyOtp}
          >
            Verify OTP
          </button>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendTimer > 0}
            className="mt-2 block bg-transparent p-0 text-blue-500 hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
          >
            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
          </button>
        </div>
      </div>
    </Sidenav>
  );
};

export default OtpVerification;
