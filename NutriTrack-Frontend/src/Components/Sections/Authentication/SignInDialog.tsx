"use client";

import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import {AxiosError} from "axios";
import axiosInstance from "../../../utils/axiosInstance.ts";
import { notify } from "../../../utils/notify.ts";
import { UserContext } from "../../../contexts/UserContext";
import { useGoogleLogin } from "@react-oauth/google";
import { logo, google } from "../../../assets/index.ts";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Separator } from "../../ui/separator";

interface SignInDialogProps {
  open: boolean;
  onClose: () => void;
  openSignUp: () => void; // Function to switch to Sign Up Dialog
  openForgotPassword: () => void;
}

const SignInDialog = ({ open, onClose, openSignUp, openForgotPassword}: SignInDialogProps) => {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [visibleField, setVisibleField] = useState<string | null>(null);
  const toast = notify;
  const { setLoggedUser } = useContext(UserContext) ?? {};
  const navigate = useNavigate();
  // Input Validation Logic
  const validateInputs = () => {
    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";
    let isValid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be at least 6 characters long.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    return isValid;
  };

  // Form Submission Logic
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateInputs()) return;

    try {
      const response = await axiosInstance.post('/api/auth/login', {
        email: emailRef.current?.value,
        password: passwordRef.current?.value,
      });

      const { token, userType, profileCompleted, userProfile, expiresIn, verified} = response.data;
      console.log("Login successful!", userProfile.user);

      const tokenExpiry = Date.now() + expiresIn * 1000; // Convert seconds to milliseconds

      // Update the loggedUser state
      // Ensure setLoggedUser exists before calling it
      if (setLoggedUser) {
        setLoggedUser({
          userid: userProfile.user,
          token,
          name: userProfile.name,
          profileCompleted,
          userType,
          verified,
          tokenExpiry,  // Store expiry timestamp
        });
        localStorage.setItem("loggedUser", JSON.stringify({
          userid: userProfile.user,
          token,
          name: userProfile.name,
          profileCompleted,
          userType,
          verified,
          tokenExpiry, // Store in localStorage
        }));

        localStorage.setItem("token", token); // Store token separately for requests
        localStorage.setItem("user", userProfile.user);  // Store userProfile.user in localStorage

      } else {
        console.error("UserContext is not available.");
      }

    // ✅ If user is not verified, call the OTP API before redirecting
    if (!verified) {
      try {
        console.log("User not verified, sending OTP...");
        await axiosInstance.post(
          "/api/auth/generate-otp",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("OTP sent successfully!");
      } catch (otpError) {
        console.error("Error sending OTP:", otpError);
      }

      navigate("/otp-verification", { replace: true });
      return;
    }

    // Redirect logic after login
    if (userType === "admin") {
      navigate("/admin-dashboard", { replace: true });
    } else if (userType === "coach") {
      navigate("/coach-dashboard", { replace: true });
    } else if (!profileCompleted) {
      navigate("/profile-setup", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
      // Close the modal
      onClose();
    } catch (err) {
      // Ensure 'err' is treated as an AxiosError
      const error = err as AxiosError<{ message: string }>;

      console.error("Login Error:", error.response?.data?.message);
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
    }
  };
  const handleGoogleLoginSuccess = async (credentialResponse: any) => {
    const accessToken = credentialResponse.access_token;

    if (!accessToken) {
      console.error("Google Login Failed: No access token received");
      toast({
        title: "Google Login Failed",
        description: "No access token received from Google. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
      return; // ✅ Stops further execution
    }

    try {
      const response = await axiosInstance.post("/api/auth/google/signin", {
        access_token: accessToken,
      });

      const { token, userType, profileCompleted, userProfile, expiresIn,verified} = response.data;
      console.log("Login with Google successful!", userProfile.user);

      const tokenExpiry = Date.now() + expiresIn * 1000; // Convert seconds to milliseconds

      // Update the loggedUser state
      // Ensure setLoggedUser exists before calling it
      if (setLoggedUser) {
        setLoggedUser({
          userid: userProfile.user,
          token,
          name: userProfile.name,
          profileCompleted,
          userType,
          verified,
          tokenExpiry,  // Store expiry timestamp
        });
        localStorage.setItem("loggedUser", JSON.stringify({
          userid: userProfile.user,
          token,
          name: userProfile.name,
          profileCompleted,
          userType,
          verified,
          tokenExpiry, // Store in localStorage
        }));

        localStorage.setItem("token", token); // Store token separately for requests
        localStorage.setItem("user", userProfile.user);  // Store userProfile.user in localStorage

      } else {
        console.error("UserContext is not available.");
      }

      toast({
        title: "Login Successful!",
        description: "You have signed in using Google.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      // Redirect logic after login
      if (userType === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else if (userType === "coach") {
        navigate("/coach-dashboard", { replace: true });
      } else if (!profileCompleted) {
        navigate("/profile-setup", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
      onClose(); // ✅ Close modal after login
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error("Google Login Error:", error.response?.data?.message);
      toast({
        title: "Google Login Failed",
        description: error.response?.data?.message || "Unable to log in using Google. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
    }
  };
  const googleSignin = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess, // ✅ Callback function for successful Google sign-up
    onError: () => console.log("Google Sign-Up Failed"), // ✅ Handle errors
  });
  useEffect(() => {
    if (open) {
      // Reset errors when the modal opens
      setEmailError(false);
      setEmailErrorMessage("");
      setPasswordError(false);
      setPasswordErrorMessage("");

      // Clear input fields
      if (emailRef.current) emailRef.current.value = "";
      if (passwordRef.current) passwordRef.current.value = "";
    }
  }, [open]);

  if (!open) return null; // Prevents unnecessary renders

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        className="p-0 overflow-hidden rounded-2xl sm:max-w-md font-[Rubik,sans-serif]"
      >
        <DialogTitle className="sr-only">Sign in to your account</DialogTitle>
        <DialogDescription className="sr-only">Sign in to NutriTrack</DialogDescription>

        {/* Header with Logo and Dark Green Background */}
        <div className="relative flex justify-center items-center bg-[var(--dark-green)] py-4 rounded-t-2xl">
          <a
            href="/"
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            aria-label="Go to NutriTrack homepage"
          >
            <img src={logo} alt="NutriTrack" width={124} height={32} />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            tabIndex={0}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-white hover:bg-white/10 focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sign In Form */}
        <div className="px-6 pb-6 pt-6">
          <form onSubmit={handleSubmit} id="signInForm" data-testid="signInForm">
            <div className="flex flex-col gap-4">
              {/* Email Input */}
              <div>
                <p className="text-[15px] font-semibold mb-1">Email</p>
                <Input
                  ref={emailRef}
                  placeholder="your@email.com"
                  aria-invalid={emailError || undefined}
                  aria-label="Email address"
                  aria-describedby={emailError ? "email-error" : undefined}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); // Prevents accidental activation of Forgot Password
                      document.getElementById("signInButton")?.click(); // Manually triggers sign-in
                    }
                  }}
                />
                {emailError && (
                  <p id="email-error" className="text-xs text-red-500" role="alert">{emailErrorMessage}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <p className="text-[15px] font-semibold mb-1">Password</p>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    type={visibleField === "password" ? "text" : "password"}
                    placeholder="Enter your password"
                    aria-invalid={passwordError || undefined}
                    aria-label="Password"
                    aria-describedby={passwordError ? "password-error" : undefined}
                    className="pr-12"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // Prevents accidental activation of Forgot Password
                        document.getElementById("signInButton")?.click(); // Manually triggers sign-in
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setVisibleField(visibleField === "password" ? null : "password")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-6 items-center justify-center rounded-md bg-white px-2 text-gray-700 hover:bg-green-300 focus:outline-none"
                  >
                    {visibleField === "password" ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordError && (
                  <p id="password-error" className="text-xs text-red-500" role="alert">{passwordErrorMessage}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openForgotPassword();
                }}
                tabIndex={0}
                aria-label="Forgot your password"
                className="self-start bg-transparent p-0 text-[15px] font-semibold text-blue-500 hover:underline focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
              >
                Forgot your password?
              </button>


              {/* Sign In Button */}
              <button
                id="signInButton"
                type="submit"
                aria-label="Sign in with email"
                className="w-full rounded-md bg-blue-500 px-4 py-2 text-[15px] font-semibold text-white hover:bg-blue-600 focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
              >
                Sign in
              </button>

              <Separator aria-hidden="true" />
              <p className="text-center text-[15px] font-semibold text-gray-600">or</p>

              {/* Sign In with Google */}
              <button
                type="button"
                onClick={() => googleSignin()}
                aria-label="Sign in with Google"
                className="flex w-full items-center justify-center gap-2 rounded-md border border-[rgba(156,156,156,0.53)] bg-white px-4 py-2 text-[15px] font-medium text-gray-800 hover:bg-black/5 focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
              >
                <img src={google} alt="" className="w-4 h-4" />
                Sign in with Google
              </button>
              {/* Sign Up Link */}
              <p className="text-center text-[15px] font-normal">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    onClose();    // Close SignIn Dialog
                    openSignUp(); // Open SignUp Dialog
                  }}
                  aria-label="Sign up for a new account"
                  className="bg-transparent p-0 text-[15px] font-semibold text-blue-500 hover:underline focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignInDialog;
