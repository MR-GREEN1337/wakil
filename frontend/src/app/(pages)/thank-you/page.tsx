"use client"

import { Button } from '@/components/ui/button';
import { CenteredSpinner, Spinner } from '@/components/ui/small-spinner';
import { BACKEND_API_BASE_URL } from '@/lib/constants';
import { Fireworks, FireworksHandlers } from '@fireworks-js/react'
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import Cookies from "js-cookie";

type Props = {}

const ThankYou = (props: Props) => {
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false)
  const router = useRouter();
  const ref = useRef<FireworksHandlers>(null)

  useEffect(() => {
    const fetchStripeData = async () => {
      const token = Cookies.get("token");
      const stripeData = await fetch(`${BACKEND_API_BASE_URL}/stripe/billing`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
  
      const result = await stripeData.json();
      const stripeCustomerId = result["stripe_customer_id"];
  
      return stripeCustomerId;
    };
  
    const fetchStripeDataAndHandleResult = async () => {
      const stripeCustomerId = await fetchStripeData();
      if (!stripeCustomerId) {
        // User doesn't have a stripe_customer_id, redirect to payment page
        router.push("/checkout");
      } else {
        Cookies.set("userPaid", "yes");
        setLoading(false)
      }
    };
  
    fetchStripeDataAndHandleResult();
  }, []);

  const services = [
    'Compose AI Agents using our multitude of tools and LLMs',
    'Setup live sessions with other users and your AI Agent',
  ];

  const handleDashboardRedirect = () => {
    setButtonLoading(true);
    router.push('/dashboard');
  };

  if (loading) {
    return (
        <CenteredSpinner />
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-start pt-20 mt-20 h-screen text-center text-xl font-semibold z-10">
      <h1>Thank You! 🎉🎉🎉 🎊🎊🎊</h1>
      <p>Thank you for trusting our platform. We're excited to have you on board!</p>
      
      <h2>Our Services</h2>
      <ul className="list-disc">
        {services.map((service, index) => (
          <li key={index}>{service}</li>
        ))}
      </ul>
      
      <Button 
        onClick={handleDashboardRedirect}
        className="z-20 mt-4 px-4 py-2 hover:scale-170 text-white rounded-lg bg-transparent w-60 h-13 text-xl"
        variant="outline"
      >
        {buttonLoading ? (
            <Spinner />
        ) : (
            'Go to Dashboard'
        )}
      </Button>

      <Fireworks
        ref={ref}
        options={{ opacity: 0.5 }}
        style={{
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          position: 'fixed',
          zIndex: 0, // Fireworks behind everything
          background: 'transparent'
        }}
      />
    </div>
  );
}

export default ThankYou;
