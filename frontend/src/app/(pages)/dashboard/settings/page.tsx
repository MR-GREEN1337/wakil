"use client";

import ModifyPassword from "@/components/forms/modify-password";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ImageUploader from "./_components/profile-image";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

const Settings = () => {
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    created_at: "",
    updated_at: "",
    image_uri: ""
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: userData,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = Cookies.get("token");
        const response = await fetch(
          `${BACKEND_API_BASE_URL}/sessions/user_info`,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          }
        );
        const data = await response.json();
        setUserData(data);
        console.log(data)
        form.reset(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    form.reset(userData);
  }, [userData]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    userData.firstname = values.firstname;
    userData.lastname = values.lastname;
    userData.email = values.email;
    //console.log("user data", userData);
    const token = Cookies.get("token")
    try {
      const response = await fetch(
        `${BACKEND_API_BASE_URL}/sessions/user`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const responseData = await response.json();

      localStorage.setItem("image_uri", responseData)
      setSuccess(true); //Frickin toast not working
      location.reload()
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (success) {
      toast({
        description: "Profile information updated successfully!",
      });
    }
  }, [success, toast]);

  const created_date = new Date(userData.created_at);
  const created_at = `${created_date.toLocaleDateString()} ${created_date.toLocaleTimeString()}`;

  const updated_date = new Date(userData.updated_at);
  const updated_at = `${updated_date.toLocaleDateString()} ${updated_date.toLocaleTimeString()}`;

  return (
    <main>
      <header className="font-bold text-2xl mt-2 ml-3 mb-2">Settings</header>
      <hr />
      <div className="ml-5">
      <div className="ml-3 mt-5">
      <h3 className="font-psemibold text-2xl">Profile Picture</h3>
      <p className="text-gray-500 text-lg">Upload Your Profile Picture</p>
      <ImageUploader user_uri={userData.image_uri}/>
      </div>
      <div className="mt-7 ml-3">
        <h3 className="font-psemibold text-2xl">User Profile</h3>
        <p className="text-gray-500 text-lg">Add or update your information</p>
      </div>
      <div className="flex mt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex flex-row">
              <FormField
                control={form.control}
                name="firstname"
                render={({ field }) => (
                  <FormItem className="ml-2 w-[150px] mx-2">
                    <FormLabel className="text-white ml-2">
                      First name
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={userData.firstname} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastname"
                render={({ field }) => (
                  <FormItem className="ml-2 w-[150px] mx-2">
                    <FormLabel className="text-white ml-2">Last name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={userData.lastname} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="ml-2 w-[300px]">
                    <FormLabel className="text-white ml-2">Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={userData.email} disabled/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              className="ml-2 px-4 py-2 text-white rounded bg-transparent"
              variant="outline"
            >
              Save
            </Button>
            <div className="ml-2">
            {/*Maybe Use another time */}
            {/*<ModifyPassword />*/}
            </div>
          </form>
        </Form>
      </div>
      <div className="mt-5 ml-2">
        <h2 className="mb-2 font-bold text-gray-500">
          First Created <span>{created_at}</span>
        </h2>
        <h2 className="mb-2 font-bold text-gray-500">
          Last modified <span>{updated_at}</span>
        </h2>
      </div>
      </div>
    </main>
  );
};

export default Settings;
