"use client"

import { BACKEND_API_BASE_URL } from "./lib/constants";

export async function createCheckoutSession(priceId: string, email: string, token: string) {
  const SUCCESS_DOMAIN_NAME = "http://localhost:3000/thank-you";
  const CANCEL_DOMAIN_NAME = "http://localhost:3000/cancel-checkout"
    const response = await fetch(`${BACKEND_API_BASE_URL}/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ "priceId":priceId, "user_email":email, "successUrl":SUCCESS_DOMAIN_NAME, "cancelUrl":CANCEL_DOMAIN_NAME }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }
  
    return response.json();
  }

export const cancelSubscription = async (token: String) => {
const response = await fetch(`${BACKEND_API_BASE_URL}/stripe/cancel-subscription`, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    },
});

if (!response.ok) {
    throw new Error('Failed to cancel subscription');
}

return response.json();
}

export const getMyProfile = async (token: String) => {
    const response = await fetch(`${BACKEND_API_BASE_URL}/sessions/user_info_stripe`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    
    if (!response.ok) {
        throw new Error('Failed to cancel subscription');
    }
    
    return response.json();
    }