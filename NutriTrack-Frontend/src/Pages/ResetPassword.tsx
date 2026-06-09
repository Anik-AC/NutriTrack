import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import {AxiosError} from "axios";
import {Navbar, Footer} from "../Components/Sections";
import { notify } from "../utils/notify";
import zxcvbn from "zxcvbn";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Input } from "../Components/ui/input";
import { Progress } from "../Components/ui/progress";

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

const ResetPassword = () => {
    const { token } = useParams<{ token: string }>(); // ✅ Get token from URL
    const navigate = useNavigate();
    const toast = notify;
    const [loading, setLoading] = useState(false);

    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);
    const [passwordError, setPasswordError] = useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState(false);
    const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = useState("");
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [visibleField, setVisibleField] = useState<string | null>(null);

    // Validate Inputs
    const validateInputs = () => {
        const password = passwordRef.current?.value || "";
        const confirmPassword = confirmPasswordRef.current?.value || "";
        let isValid = true;

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

    const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateInputs()) return;

        setLoading(true);

        try {
        const response = await axiosInstance.post(`/api/auth/reset-password/${token}`, {
            newPassword: passwordRef.current?.value,
        });

        toast({
            title: "Success",
            description: response.data.message || "Password reset successful! You can now log in.",
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "top",
        });

        navigate("/login"); // ✅ Redirect to login after success
        } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            toast({
                title: "Error",
                description: error.response?.data?.message || "Something went wrong. Please try again.",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
        } finally {
        setLoading(false);
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

    return (

    <div className="w-full min-h-screen flex flex-col">

        {/* ✅ Fixed Navbar */}
        <div className="fixed top-0 left-0 w-full z-50 bg-navbar">
            <Navbar />
        </div>

        {/* ✅ Ensures content starts below the navbar */}
        <div className="flex-grow pt-[80px] bg-alternate">
            <div className="max-w-[400px] mx-auto mt-[50px] p-5 rounded-lg shadow-md bg-[var(--dark-green)] text-[var(--soft-white)]">
                <p className="text-xl font-bold mb-4">
                    Reset Password
                </p>
                <div className="flex flex-col gap-4">
                    <form onSubmit={handleResetPassword} id="ResetPasswordForm" data-testid="ResetPasswordForm">
                        <div className="flex flex-col gap-4">
                            {/* Password Input */}
                            <div>
                                <p className="text-[15px] font-semibold mb-1">Password</p>
                                <div className="relative">
                                    <Input
                                    ref={passwordRef}
                                    type={visibleField === "password" ? "text" : "password"}
                                    placeholder="Enter new password"
                                    aria-invalid={passwordError || undefined}
                                    onChange={(e) => checkPasswordStrength(e.target.value)}
                                    aria-label="Password"
                                    aria-describedby={passwordError ? "password-error" : undefined}
                                    className="pr-12 text-black"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setVisibleField(visibleField === "password" ? null : "password")}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-6 items-center justify-center rounded-md bg-white px-2 text-gray-700 hover:bg-[var(--bright-green)] focus:outline-none"
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
                                    placeholder="Confirm new password"
                                    aria-invalid={confirmPasswordError || undefined}
                                    aria-label="Confirm Password"
                                    aria-describedby={passwordError ? "password-error" : undefined}
                                    className="pr-12 text-black"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setVisibleField(visibleField === "confirmPassword" ? null : "confirmPassword")}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-6 items-center justify-center rounded-md bg-white px-2 text-gray-700 hover:bg-[var(--bright-green)] focus:outline-none"
                                    >
                                        {visibleField === "confirmPassword" ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {confirmPasswordError && <p className="text-xs text-red-500">{confirmPasswordErrorMessage}</p>}
                            </div>
                            {/* Reset Password Button */}
                            <button
                                type="submit"
                                aria-label="Sign up with email"
                                data-loading={loading ? "true" : undefined}
                                disabled={loading}
                                className="w-full rounded-md bg-blue-500 px-4 py-2 text-[15px] font-semibold text-white hover:bg-blue-600 disabled:opacity-70 focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
                            >
                                Reset Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        {/* ✅ Footer stays at bottom */}
        <div className="w-full mt-auto bg-footer">
            <Footer />
        </div>
    </div>

  );
};

export default ResetPassword;
