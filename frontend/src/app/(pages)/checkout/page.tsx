import Pricing from '@/components/ui/pricing-cards'
import React from 'react'

type Props = {}

const CheckoutPage = (props: Props) => {
  return (
    <div className="flex justify-center items-center h-screen">
      <Pricing />
    </div>
  )
}

export default CheckoutPage