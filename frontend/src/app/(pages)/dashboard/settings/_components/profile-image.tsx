import { BACKEND_API_BASE_URL } from "@/lib/constants";
import React, { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";
import { ImageUp } from "lucide-react";
import { useToast } from "@chakra-ui/react";

interface ImageUploaderProps {
  user_uri?: string | null; // Optional initial user image URI
}
const ImageUploader = ({ user_uri }: ImageUploaderProps) => {
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(user_uri || null); // Initialize with user_uri if provided
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageUrl(user_uri || null); // Update imageUrl if user_uri changes
  }, [user_uri]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);

      // Validate file type
      if (!file.type.match("image/jpeg") && !file.type.match("image/png")) {
        setError("Please select a valid image file (JPEG/JPG or PNG).");
        setSelectedFile(null);
        return;
      }

      // Validate file size (maximum 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.");
        setSelectedFile(null);
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `${BACKEND_API_BASE_URL}/cloud/user-image-upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Cookies.get("token")}`, // Add the Authorization header
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to upload image.");
        }

        const data = await response.json();
        setImageUrl(data.url); // Update imageUrl with the uploaded image URL
        await updateUserImage(data.url);
      } catch (error) {
        setError("Error uploading image.");
        console.error("Error uploading image:", error);
      }
    }
  };

  const updateUserImage = async (newImageUrl: string) => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${BACKEND_API_BASE_URL}/sessions/user/image`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ image_uri: newImageUrl }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user image.");
      }

      //toast
      toast({
        description: "Profile Image updated successfully!",
      });
    } catch (error) {
      setError("Error updating user image.");
      console.error("Error updating user image:", error);
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mt-2 relative inline-block">
      <div
        className="w-36 h-36 rounded-full overflow-hidden relative cursor-pointer"
        onClick={handleImageClick}
      >
        {imageUrl ? (
          <div className="shimmer bg-slate-900">
            <img
              src={imageUrl}
              alt="Uploaded Profile"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="shimmer bg-slate-900 w-full h-full bg-gray-300 flex justify-center items-center">
            <ImageUp className="text-white text-4xl"/>
          </div>
        )}
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center opacity-0 transition-opacity duration-300 hover:opacity-100">
          <ImageUp />
        </div>
        <input
          type="file"
          accept=".jpg,.jpeg,.png"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default ImageUploader;
