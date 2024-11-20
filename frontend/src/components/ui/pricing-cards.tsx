"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { loadStripe } from "@stripe/stripe-js";
import {
  cancelSubscription,
  createCheckoutSession,
  getMyProfile,
} from "@/stripe";
import { BACKEND_API_BASE_URL, stripePlans } from "@/lib/constants";
import { Button } from "./button";
import { Loader } from "lucide-react";
import { GlareCard } from "./glare-card";

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const Pricing = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdFromQuery = searchParams.get("planId");

  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("Free");
  const [loading, setLoading] = useState<boolean>(false);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [user, setUser] = useState({} as any);
  const token = Cookies.get("token");
  const [subscribeLoading, setSubscribeLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      if (token) {
        try {
          const data = await getMyProfile(token);
          setUser(data);
          setSubscriptionPlan(data.subscription_plan || "Free");
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [token]);

  const handleCheckout = async (plan: any) => {
    if (!token) {
      localStorage.setItem("checkoutPlanId", plan.id);
      router.push("/sign-up");
    } else if (plan.name === subscriptionPlan) {
      await cancelSubscriptionHandler();
    } else if (plan.id) {
      try {
        const stripe = await stripePromise;
        const { sessionId } = await createCheckoutSession(
          plan.id,
          user.email,
          token!
        );
        const { error } = await stripe!.redirectToCheckout({ sessionId });
        if (error) {
          alert(error);
          Cookies.remove("token");
          console.error("Error redirecting to checkout:", error);
        }
      } catch (error) {
        console.error("Failed to initiate checkout:", error);
      }
    }
  };

  const cancelSubscriptionHandler = async () => {
    setCancelLoading(true);
    try {
      if (token) {
        await cancelSubscription(token);
        setSubscriptionPlan("Free");
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
    }
    setCancelLoading(false);
  };

  return (
    <div className="flex flex-wrap justify-center gap-6 p-10 bg-slate-950">
      {stripePlans.map((plan: any, index: number) => (
        <GlareCard
          key={index}
          className="w-full sm:w-[32rem] flex items-center justify-center bg-slate-900"
        >
          {" "}
          {/* Added flex, items-center and justify-center */}
          <div className="p-8 rounded-2xl shadow-lg bg-transparent transition-all duration-300 ease-in-out shadow-2xl text-center">
            {" "}
            {/* Added text-center for centering text */}
            <h2 className="text-3xl font-semibold text-white">
              {" "}
              {/* Increased font size */}
              {plan.name} Package
            </h2>
            <p className="text-neutral-400 text-sm max-w-sm mt-2">
              {plan.description || "Full access to our AI tools"}{" "}
              {/* Plan description */}
            </p>
            <div className="mt-6">
              <p className="text-4xl font-bold text-indigo-400">
                {plan.amount / 100} {plan.currency}
              </p>
              <span className="text-xs text-neutral-500">per month</span>
            </div>
            <p className="text-md font-semibold text-neutral-400 mt-4">
              Cancel anytime 💯💯
            </p>
            <div className="flex justify-between items-center mt-10 space-x-4">
              {" "}
              {/* Added space between elements */}
              <Link href="/checkout" target="__blank">
                <span className="text-sm text-indigo-400 hover:underline">
                  Learn More
                </span>
              </Link>
              <button
                className={`bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transform scale-100 hover:scale-105 transition-transform duration-300 ease-in-out ${
                  subscribeLoading ? "cursor-wait" : ""
                }`}
                onClick={() => {
                  setSubscribeLoading(true);
                  handleCheckout(plan);
                }}
              >
                {subscribeLoading ? (
                  <Loader className="animate-spin" />
                ) : (
                  <span>
                    {subscriptionPlan === plan.name
                      ? "Cancel Subscription"
                      : "Subscribe"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </GlareCard>
      ))}
    </div>
  );
};

export default Pricing;
