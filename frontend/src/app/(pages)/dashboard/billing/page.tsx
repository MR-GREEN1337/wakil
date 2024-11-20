"use client";

import React, { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Frown, LoaderCircle } from "lucide-react";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import Cookies from "js-cookie";
import { cancelSubscription } from "@/stripe";
import { useToast } from "@/components/ui/use-toast";

interface BillingDetails {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  subscription_plan: string;
  subscription_status: string;
  current_period_end: string;
}

const BillingComponent: React.FC = () => {
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [subscriptionCanceled, setSubscriptionCanceled] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const token = Cookies.get("token");
  const { toast } = useToast();

  useEffect(() => {
    const fetchBillingDetails = async () => {
      try {
        const response = await fetch(`${BACKEND_API_BASE_URL}/stripe/billing`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        const data: BillingDetails = await response.json();
        setBillingDetails(data);
        setSubscriptionCanceled(data.subscription_status === "canceled");
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Unknown error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBillingDetails();
  }, [token]);

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      if (token) {
        const response = await cancelSubscription(token);
        toast({
          title: "Subscription successfully canceled",
          description: (
            <>
              We would love to see you as soon as possible <Frown />
            </>
          ),
        });
        setSubscriptionCanceled(true);
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast({
        title: "Failed to cancel subscription",
        description: "Please try again later or contact support.",
        variant: "destructive",
      });
    }
    setCancelLoading(false);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mt-8 bg-transparent text-white justify-start">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-3/4 bg-gray-700" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2 bg-gray-700" />
          <Skeleton className="h-4 w-5/6 bg-gray-700" />
          <Skeleton className="h-4 w-4/6 mt-4 bg-gray-700" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4 bg-red-500 bg-opacity-20 text-white">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='card-container justify-start'>
      <Card className="w-full max-w-md mt-8 bg-transparent text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Billing Details</CardTitle>
        </CardHeader>
        <CardContent className=''>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Subscription Plan:</span>
              <Badge variant="secondary" className="bg-opacity-20 text-white bg-transparent hover:text-black">{billingDetails?.subscription_plan}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Status:</span>
              <Badge 
                variant="outline" 
                className={`${billingDetails?.subscription_status === 'active' ? 'text-green-400' : 'text-red-400'} bg-opacity-20`}
              >
                {billingDetails?.subscription_status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Current Period Ends:</span>
              <span>{billingDetails ? formatDate(billingDetails.current_period_end) : ''}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          {!subscriptionCanceled ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">Cancel Subscription</Button>
              </DialogTrigger>
              <DialogContent className="bg-transparent text-white">
                <h3 className="text-lg font-semibold mb-4">Are you sure you want to cancel your subscription?</h3>
                <div className="flex justify-end space-x-2">
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-transparent text-white">No, keep it</Button>
                  </DialogTrigger>
                  <Button onClick={handleCancelSubscription} variant="destructive">
                    {cancelLoading ? <LoaderCircle className="animate-spin" /> : "Yes, cancel"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <>
              <Button variant="outline" className="w-full mb-2 text-gray-400" disabled>
                Subscription Canceled
              </Button>
              <a href="/checkout">
                <Button variant="default" className="w-full bg-green-500 hover:bg-green-600 text-white">
                  Renew Subscription
                </Button>
              </a>
            </>
          )}
          {subscriptionCanceled && (
            <Alert variant="destructive" className="mt-4 bg-red-500 bg-opacity-20 text-white">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Important Notice</AlertTitle>
              <AlertDescription>
                Your subscription has been canceled. Make sure to export your data before your current period ends.
                You won't be able to log in after that unless you renew your subscription.
              </AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default BillingComponent;
