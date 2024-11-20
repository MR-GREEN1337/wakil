import { BACKEND_API_BASE_URL } from "@/lib/constants";
import Image from "next/image";
import { useEffect, useState } from "react";
import Cookies from "js-cookie"

export type UserInfo = {
  id: string;
  name: string;
  image: string;
};

const UserCard = ({ user }: any) => {
  const [userData, setUserData] = useState<UserInfo>({} as UserInfo);
  const [imageUri, setImageUri] = useState("");

  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = Cookies.get("token")
      try {
        const response = await fetch(
          `${BACKEND_API_BASE_URL}/sessions/user-details/${localStorage.getItem("email")}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          console.log("hoga", data)
          setUserData(data);
          setImageUri(data.image);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchUserDetails();
  }, [user.user]);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center">
      <Image
        src={imageUri}
        alt={userData.name}
        width={50}
        height={50}
        className="rounded-full mr-4"
      />
      <div>
        <h2 className="text-lg font-bold">{`${userData.name}`}</h2>
        {/*<p className="text-gray-600">{userData.email}</p>*/}
      </div>
    </div>
  );
};

export default UserCard;