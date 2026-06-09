"use client";

import { useState, useRef, useEffect} from "react";
import { X } from "lucide-react";
import axiosInstance from "../../../utils/axiosInstance.ts";
import { notify } from "../../../utils/notify.ts";
import { AxiosError } from "axios";
import { useGoogleLogin} from "@react-oauth/google";
import zxcvbn from "zxcvbn";
import { logo, google } from "../../../assets/index.ts";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Progress } from "../../ui/progress";
import { Separator } from "../../ui/separator";

interface SignUpDialogProps {
  open: boolean;
  onClose: () => void;
  openSignIn: () => void; // Function to switch to Sign In Dialog
}

const strengthBarClasses = [
  "[&_[data-slot=progress-indicator]]:bg-red-500",
  "[&_[data-slot=progress-indicator]]:bg-orange-500",
  "[&_[data-slot=progress-indicator]]:bg-yellow-500",
  "[&_[data-slot=progress-indicator]]:bg-green-500",
  "[&_[data-slot=progress-indicator]]:bg-green-500",
];
const strengthTextClasses = [
  "text-red-500",
  "text-orange-500",
  "text-yellow-500",
  "text-green-500",
  "text-green-500",
];

const SignUpDialog = ({ open, onClose, openSignIn }: SignUpDialogProps) => {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [visibleField, setVisibleField] = useState<string | null>(null);
  const toast = notify;

  // Validate Inputs
  const validateInputs = () => {
    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";
    const confirmPassword = confirmPasswordRef.current?.value || "";
    let isValid = true;

    // Email Validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    // Password Strength Validation
    if (passwordStrength < 3) { // Only allow "Good" (3) and "Strong" (4) passwords
      setPasswordError(true);
      setPasswordErrorMessage("Password is too weak. Try adding more unique characters.");
      isValid = false;
    }

    // Password Validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be 8+ chars, include an uppercase letter, a number & a symbol.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    // Confirm Password Validation
    if (confirmPassword !== password) {
      setConfirmPasswordError(true);
      setConfirmPasswordErrorMessage("Passwords do not match.");
      isValid = false;
    } else {
      setConfirmPasswordError(false);
      setConfirmPasswordErrorMessage("");
    }

    return isValid;
  };

  // Handle Form Submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateInputs()) return;

    try {
      const response = await axiosInstance.post("/api/auth/register", {
        email: emailRef.current?.value,
        password: passwordRef.current?.value,
      });

      console.log("User registered successfully!", response.data);

      // Show success toast instead of alert
      toast({
        title: "Registration Successful!",
        description: "Your account has been created successfully.",
        status: "success",
        duration: 4000,
        isClosable: true,
        position: "top",
      });

      // Close the modal
      onClose();
    } catch (err) {
      // Type the error properly
      const error = err as AxiosError<{ message: string }>;

      console.error("Registration Error:", error.response?.data?.message);
      // Show error toast instead of alert
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
    }
  };
  // Handle Password Strength
  const checkPasswordStrength = (password: string) => {
    const result = zxcvbn(password);
    setPasswordStrength(result.score); // Score is from 0 (weak) to 4 (strong)

    if (result.score < 3) { // Only allow "Good" (3) and "Strong" (4) passwords
      setPasswordError(true);
      setPasswordErrorMessage("Password is too weak. Try adding more unique characters.");
      //return false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }
  };

  const handleGoogleSignupSuccess = async (credentialResponse: any) => {
    const accessToken = credentialResponse.access_token;

    if (!accessToken) {
      console.error("Google Sign Up Failed: No access token received");
      toast({
        title: "Google Sign Up Failed",
        description: "No access token received from Google. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
      return; // ✅ Stops further execution
    }

    try {
      const response = await axiosInstance.post("/api/auth/google/signup", {
        access_token: accessToken,
      });

      console.log("Signup with Google successful!", response.data);

      toast({
        title: "Sign-Up Successful!",
        description: "Your account has been created using Google.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      onClose(); // ✅ Close modal after sign-up
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error("Google Sign Up Error:", error.response?.data?.message);
      toast({
        title: "Google Sign-Up Failed",
        description: error.response?.data?.message || "Unable to sign up using Google. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const googleSignup = useGoogleLogin({
    onSuccess: handleGoogleSignupSuccess, // ✅ Callback function for successful Google sign-up
    onError: () => console.log("Google Sign-Up Failed"), // ✅ Handle errors
  });

  useEffect(() => {
    if (open) {
      // Reset validation errors
      setEmailError(false);
      setEmailErrorMessage("");
      setPasswordError(false);
      setPasswordErrorMessage("");
      setConfirmPasswordError(false);
      setConfirmPasswordErrorMessage("");
      setPasswordStrength(0); // Reset password strength bar

      // Clear input fields
      if (emailRef.current) emailRef.current.value = "";
      if (passwordRef.current) passwordRef.current.value = "";
      if (confirmPasswordRef.current) confirmPasswordRef.current.value = "";
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
        <DialogTitle className="sr-only">Create your account</DialogTitle>
        <DialogDescription className="sr-only">Sign up for NutriTrack</DialogDescription>

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

        {/* Sign Up Form */}
        <div className="px-6 pb-6 pt-6">
          <form onSubmit={handleSubmit} id="signUpForm" data-testid="signUpForm">
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
                />
                {emailError && <p className="text-xs text-red-500">{emailErrorMessage}</p>}
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
                    onChange={(e) => checkPasswordStrength(e.target.value)}
                    aria-label="Password"
                    aria-describedby={passwordError ? "password-error" : undefined}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setVisibleField(visibleField === "password" ? null : "password")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-6 items-center justify-center rounded-md bg-white px-2 text-gray-700 hover:bg-green-300 focus:outline-none"
                  >
                    {visibleField === "password" ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {/* Password Strength Checker */}
                {passwordRef.current?.value && (
                  <div className="mt-3">
                    <Progress
                      value={(passwordStrength + 1) * 20} // Convert score (0-4) to percentage (0-100)
                      className={`h-1.5 ${strengthBarClasses[passwordStrength]}`}
                    />
                    <p className={`text-xs ${strengthTextClasses[passwordStrength]}`}>
                      {["Very Weak", "Weak", "Fair", "Good", "Strong"][passwordStrength]}
                    </p>
                  </div>
                )}

                {passwordError && <p className="text-xs text-red-500">{passwordErrorMessage}</p>}
              </div>

              {/* Confirm Password Input */}
              <div>
                <p className="text-[15px] font-semibold mb-1">Confirm Password</p>
                <div className="relative">
                  <Input
                    ref={confirmPasswordRef}
                    type={visibleField === "confirmPassword" ? "text" : "password"}
                    placeholder="Confirm password"
                    aria-invalid={confirmPasswordError || undefined}
                    aria-label="Confirm Password"
                    aria-describedby={passwordError ? "password-error" : undefined}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setVisibleField(visibleField === "confirmPassword" ? null : "confirmPassword")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-6 items-center justify-center rounded-md bg-white px-2 text-gray-700 hover:bg-green-300 focus:outline-none"
                  >
                    {visibleField === "confirmPassword" ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {confirmPasswordError && <p className="text-xs text-red-500">{confirmPasswordErrorMessage}</p>}
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                aria-label="Sign up with email"
                className="w-full rounded-md bg-blue-500 px-4 py-2 text-[15px] font-semibold text-white hover:bg-blue-600 focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
              >
                Sign up
              </button>
              <Separator aria-hidden="true" />
              <p className="text-center text-[15px] font-semibold text-gray-600">or</p>

              {/* Sign Up with Google */}
              <button
                type="button"
                onClick={() => googleSignup()}
                aria-label="Sign up with Google"
                className="flex w-full items-center justify-center gap-2 rounded-md border border-[rgba(156,156,156,0.53)] bg-white px-4 py-2 text-[15px] font-medium text-gray-800 hover:bg-black/5 focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
              >
                <img src={google} alt="" className="w-4 h-4" />
                Sign up with Google
              </button>

              {/* Already Have an Account? */}
              <p className="text-center text-[15px]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    onClose();    // Close SignUp Dialog
                    openSignIn(); // Open SignIn Dialog
                  }}
                  aria-label="Sign in with email"
                  className="bg-transparent p-0 text-[15px] font-semibold text-blue-500 hover:underline focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
                >
                  Sign in
                </button>
              </p>
            </div>

          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignUpDialog;
