"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import { createCheckoutSession } from "@/stripe";
import { stripePromise } from "@/components/ui/pricing-cards";
import { cn } from "@/lib/utils";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderPinwheel } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import FormWithReCaptcha from "@/components/formWithReCAPTCHA";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let valid = true;

    if (!emailRegex.test(email)) {
      setEmailError("Invalid email address");
      valid = false;
    } else {
      setEmailError("");
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    } else {
      setPasswordError("");
    }

    if (!valid) return;

    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    const planId = localStorage.getItem("checkoutPlanId");
    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (response.ok) {
        const token = await response.json();
        try {
          const verifyResponse = await fetch(
            `${BACKEND_API_BASE_URL}/auth/verify-token/${token.access_token}`
          );

          if (!verifyResponse.ok) {
            throw new Error("Token verification failed");
          } else {
            localStorage.setItem("email", email);
            const randomNumber = Math.floor(Math.random() * 10) + 1;
            const filename = `placeholder${randomNumber}.png`;
            localStorage.setItem("image_uri", `/${filename}`);
            Cookies.set("token", token.access_token);

            const stripe_data = await fetch(
              `${BACKEND_API_BASE_URL}/stripe/billing`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token.access_token}`,
                },
              }
            );

            const result = await stripe_data.json();
            // If customer idf doesn't exist, means no subscription done
            const stripeCustomerId = result["stripe_customer_id"];
            const currentPeriodEnd = new Date(result["current_period_end"]); // Parse current_period_end as a date
            const today = new Date(); // Get today's date
            if (!stripeCustomerId || currentPeriodEnd < today) {
              // User doesn't have a stripe_customer_id, redirect to payment page
              router.push("/checkout");
            } else {
              //check first if it exists before setting it
              Cookies.set("userPaid", "yes");
              if (planId) {
                localStorage.removeItem("checkoutPlanId");

                // WIP: Replace fetch plans with one constant
                await retrievePlan(token.access_token, planId);
              } else {
                if (stripeCustomerId) {
                  router.push("/dashboard");
                } else {
                  router.push("/");
                }
              }
            }
          }
        } catch (error) {
          Cookies.remove("token");
          setError("Token verification failed");
        }
      } else if (response.status === 403 && planId) {
        try {
          //alert(planId)
          await retrievePlan(Cookies.get("token") || "", planId);
        } catch (error) {
          console.error("Failed to initiate checkout:", error);
        }
      } else if (response.status === 403) {
        //alert("hii")
        router.push("/login-not-paid");
      } else {
        const data = await response.json();
        setError(data.detail || "Login failed");
      }
    } catch (error) {
      setError("Login request failed");
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

  const retrievePlan = async (planId: String, token: String) => {
    const plansResponse = await fetch(
      `${BACKEND_API_BASE_URL}/stripe/list_plans`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (plansResponse.ok) {
      const plans = await plansResponse.json();
      const selectedPlan = plans.find((plan: any) => plan.id === planId);

      if (selectedPlan) {
        //alert(selectedPlan)
        await handleCheckout(selectedPlan); // Assuming handleCheckout is defined in the Pricing component
      } else {
        router.push("/dashboard");
      }
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input dark:bg-black mt-20 bg-white">
      <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
        Welcome to Wakil
      </h2>
      <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
        Login
      </p>
      <FormWithReCaptcha
        theme="light"
        language="en"
        onError={(error) => setError(error)}
        onSuccess={handleSubmit}
      >
      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            placeholder="dwight.schrute@beetfarms.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailError && <div className="text-red-500">{emailError}</div>}
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

        <button
          className="bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset] flex justify-center items-center"
          type="submit"
          onClick={() => {
            setButtonLoading(true);
          }}
        >
          {buttonLoading ? (
            <LoaderPinwheel className="animate-spin text-center" />
          ) : (
            <>Sign in &rarr;</>
          )}
          <BottomGradient />
        </button>
        {/* Footer Section */}
        <div className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400">
          By signing in, you agree to our
          <a href="/privacy-policy" className="text-blue-500 hover:underline ml-1">Privacy Policy</a> and
          <a href="/terms-of-service" className="text-blue-500 hover:underline ml-1">Terms of Service</a>.
        </div>

        <div className="text-black flex mt-5">
          <h3 className="mr-2">Don't have an account? </h3>
          <a
            href="/sign-up"
            className="text-md font-psemibold text-black font-bold"
          >
            Sign up
          </a>
        </div>

        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

        <div className="flex flex-col space-y-4">
          <Dialog>
            <DialogTrigger asChild>
                <button
                  className=" relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
                  type="button"
                >
                  <IconBrandGithub className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                  <span className="text-neutral-700 dark:text-neutral-300 text-sm">
                    GitHub
                  </span>
                  <BottomGradient />
                </button>
            </DialogTrigger>
            <DialogContent className="bg-transparent text-white text-shimmmer">
              <h3>Coming soon!</h3>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
                <button
                  className=" relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
                  type="button"
                >
                  <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                  <span className="text-neutral-700 dark:text-neutral-300 text-sm">
                    Google
                  </span>
                  <BottomGradient />
                </button>
            </DialogTrigger>
            <DialogContent className="bg-transparent text-white text-shimmmer">
              <h3>Coming soon!</h3>
            </DialogContent>
          </Dialog>
        </div>
      </form>
      </FormWithReCaptcha>
      {error && <div className="text-red-500">{error}</div>}
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
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};
