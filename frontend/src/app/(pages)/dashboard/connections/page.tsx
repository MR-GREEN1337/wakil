"use client";
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import React, { useEffect, useState } from 'react'
import GoogleIntegration from './_components/google-drive-connection';

type Props = {}

const Connections = (props: Props) => {
  const [open, setOpen] = useState(false)

  // Trigger dialog on component mount
  useEffect(() => {
    setOpen(true)
  }, [])

  return (
    <main>
      <header className='font-bold text-2xl mt-2 ml-6 mb-2'>Connections</header>
      <hr />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='bg-transparent text-white'>
          <DialogHeader>
            We're working hard to ship new features, including the ability to connect other data sources.
          </DialogHeader>
        </DialogContent>
      </Dialog>
      {/* Fetch user friends and display them, with the ability to send a request to another user */}
      <div>
      {/*<GoogleIntegration />*/}
      </div>
    </main>
  )
}

export default Connections
