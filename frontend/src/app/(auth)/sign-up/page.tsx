"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { createCheckoutSession } from "@/stripe";
import { stripePromise } from "@/components/ui/pricing-cards";
import { LoaderPinwheel } from "lucide-react"; // Import the spinner component

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function SignUp() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailExistsError, setEmailExistsError] = useState("");
  const [buttonLoading, setButtonLoading] = useState(false); // New loading state
  const router = useRouter();

  const checkEmailExistence = async (email: string) => {
    try {
      const response = await fetch(
        `${BACKEND_API_BASE_URL}/auth/check-email/${email}`
      );
      if (response.ok) {
        setEmailExistsError("");
        return true;
      } else if (response.status === 409) {
        setEmailExistsError("Email already exists");
        return false;
      } else {
        console.error("Error checking email existence:", response.statusText);
        return false;
      }
    } catch (error) {
      console.error("Error checking email existence:", error);
      return false;
    }
  };

  const handleCheckout = async (plan: any) => {
    // Assuming handleCheckout is similar to the one in the Pricing component
    if (plan && plan.id) {
      try {
        const stripe = await stripePromise;
        localStorage.setItem("checkoutSuccess", "true");
        const { sessionId } = await createCheckoutSession(
          plan.id,
          email,
          Cookies.get("token")!
        );

        const { error } = await stripe!.redirectToCheckout({ sessionId });
        if (error) {
          console.error("Error redirecting to checkout:", error);
        }
      } catch (error) {
        console.error("Failed to initiate checkout:", error);
      }
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setButtonLoading(true); // Set loading state to true

    if (!emailRegex.test(email)) {
      setEmailError("Invalid email address");
    } else {
      setEmailError("");
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
    } else {
      setPasswordError("");
    }

    if (emailError || passwordError) {
      setButtonLoading(false); // Reset loading state if there are errors
      return;
    }

    const emailExists = await checkEmailExistence(email);
    if (!emailExists) {
      setButtonLoading(false); // Reset loading state if email doesn't exist
      return;
    }

    const formData = {
      firstname,
      lastname,
      email,
      password,
    };

    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to sign-in page
        router.push("/sign-in");
      } else {
        console.error("Sign up error:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setButtonLoading(false); // Reset loading state after operation
    }
  };

  return (
    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black mt-20">
      <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
        Welcome to Wakil
      </h2>
      <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
        Sign up
      </p>

      <form className="my-8" onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
          <LabelInputContainer className="mb-4">
            <Label htmlFor="firstname">First name</Label>
            <Input
              id="firstname"
              placeholder="Creed"
              type="text"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
            />
          </LabelInputContainer>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="lastname">Last name</Label>
            <Input
              id="lastname"
              placeholder="Bratton"
              type="text"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
            />
          </LabelInputContainer>
        </div>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            placeholder="ultimate.creed@whatsthedeal.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailError && <div className="text-red-500">{emailError}</div>}
          {emailExistsError && (
            <div className="text-red-500">{emailExistsError}</div>
          )}
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {passwordError && <div className="text-red-500">{passwordError}</div>}
        </LabelInputContainer>
        <LabelInputContainer className="mb-8">
          <Label htmlFor="confirmpassword">Confirm password</Label>
          <Input
            id="confirmpassword"
            placeholder="••••••••"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </LabelInputContainer>
        <button
          className="relative flex items-center justify-center bg-gradient-to-br from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
          type="submit"
        >
          {buttonLoading && (
            <LoaderPinwheel className="absolute inset-0 m-auto h-6 w-6 text-white animate-spin" />
          )}
          <span
            className={`text-center ${
              buttonLoading ? "opacity-0" : "opacity-100"
            }`}
          >
            Sign up &rarr;
          </span>
        </button>
        <div className="text-black flex mt-5">
          <h3 className="mr-2">Already have an account? </h3>
          <a
            href="/sign-in"
            className="text-md font-psemibold text-black font-bold"
          >
            Sign In
          </a>
        </div>
        
        {/* Footer Section */}
        <div className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400">
          By signing up, you agree to our
          <a href="/privacy-policy" className="text-blue-500 hover:underline ml-1">Privacy Policy</a> and
          <a href="/terms-of-service" className="text-blue-500 hover:underline ml-1">Terms of Service</a>.
        </div>

        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-col space-y-1", className)}>{children}</div>
);
