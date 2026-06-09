"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";

import {AxiosError} from "axios";
import axiosInstance from "../../../utils/axiosInstance.ts";
import { notify } from "../../../utils/notify.ts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

const ForgotPassword = ({ open, handleClose }: ForgotPasswordProps) => {
  const emailRef = useRef<HTMLInputElement>(null);
  const toast = notify;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = emailRef.current?.value.trim();

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      // ✅ Call Forgot Password API
      const response = await axiosInstance.post("/api/auth/forgot-password", { email });

      toast({
        title: "Success",
        description: response.data.message || "A password reset link has been sent to your email.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // ✅ Automatically close modal after toast appears
      setTimeout(handleClose, 300);
    }
    catch (err) {
      // Ensure 'err' is treated as an AxiosError
      const error = err as AxiosError<{ message: string }>;

      console.error("Login Error:", error.response?.data?.message);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
        status: "error",
        duration: 8000,
        isClosable: true,
        position: "top",
      });

      // ✅ Automatically close modal even on error
      setTimeout(handleClose, 300);
    }
    finally {
      setLoading(false);
    }
  };

  if (!open) return null; // Prevents rendering when `open` is false

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close modal"
          tabIndex={0}
          className="absolute right-4 top-4 rounded-md p-1 text-black hover:text-[darkred] hover:[outline:2px_solid_darkred] hover:outline-offset-2 focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
        >
          <X className="w-5 h-5" />
        </button>
        <DialogHeader>
          <DialogTitle className="leading-[1.1] text-2xl md:text-3xl">Forgot your password?</DialogTitle>
          <DialogDescription className="mb-3 text-foreground">
            Enter your account's email address, and we'll send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <Input
              ref={emailRef}
              type="email"
              placeholder="your-email@example.com"
              required
              autoFocus
            />
            <button
              type="submit"
              data-loading={loading ? "true" : undefined}
              disabled={loading}
              className="w-full rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 disabled:opacity-70 focus:[outline:2px_solid_var(--bright-green)] focus:outline-offset-2"
            >
              Continue
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPassword;
