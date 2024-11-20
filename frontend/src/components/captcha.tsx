"use client"

import React from "react";
import {GoogleReCaptchaProvider} from "react-google-recaptcha-v3";

interface ReCaptchaProviderProps {
  children: React.ReactNode
}

const ReCaptchaProvider: React.FC<ReCaptchaProviderProps> = ({children}) => {
  return (
    <GoogleReCaptchaProvider
    reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
    >
      {children}
    </GoogleReCaptchaProvider>
  )
}

export default ReCaptchaProvider;