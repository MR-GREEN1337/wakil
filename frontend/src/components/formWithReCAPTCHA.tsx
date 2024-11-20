import React, { useState } from 'react'
import { GoogleReCaptcha, useGoogleReCaptcha } from "react-google-recaptcha-v3"
import { Button } from "./ui/button"

interface RecaptchaProps {
  theme?: 'light' | 'dark'
  language?: string
  onError?: (error: string) => void
  onSuccess?: () => void
  children: React.ReactNode
}

const FormWithReCaptcha: React.FC<RecaptchaProps> = ({
  theme = 'light',
  language = 'en',
  onError,
  onSuccess,
  children,
}) => {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleTokenSubmit = async () => {
    if (!executeRecaptcha) {
      return
    }

    setIsVerifying(true)

    try {
      const token = await executeRecaptcha("form_submit")

      const response = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })
      const data = await response.json()

      if (data.success === "true") {
        setIsVerifying(false)
        console.log("reCAPTCHA verification success", data)
        if (onSuccess) {
          onSuccess() // Call onSuccess with an empty argument
        }
      } else {
        setIsVerifying(false)
        setErrorMessage(data.error)
        console.error("reCAPTCHA verification failed", data)
        if (onError) {
          onError(data.error)
        }
      }
    } catch (error) {
      setIsVerifying(false)
      setErrorMessage('An error occurred while verifying reCAPTCHA')
      console.error('reCAPTCHA verification error:', error)
      if (onError) {
        onError('An error occurred while verifying reCAPTCHA')
      }
    }
  }

  return (
    <div>
      {/* Render children */}
      {children}
      {/* Display error message if any */}
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}
    </div>
  )
}

export default FormWithReCaptcha