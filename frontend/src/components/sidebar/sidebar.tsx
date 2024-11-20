'use client';

import {
  Bell,
  Home,
  Mail,
  MoreHorizontal,
  Waypoints,
  User,
  Cable,
  BotMessageSquare,
  CreditCard,
} from 'lucide-react';
import { SidebarDesktop } from './sidebar-desktop';
import { SidebarItems } from '@/lib/types';
import { SidebarButton } from './sidebar-button';
import { useMediaQuery } from 'usehooks-ts';
import { SidebarMobile } from './sidebar-mobile';
import SessionCreate from '../../app/(pages)/dashboard/sessions/_components/session-create';

const sidebarItems: SidebarItems = {
  links: [
    { label: 'Home', href: '/dashboard', icon: Home },
    { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { label: 'Messages', href: '/dashboard/messages', icon: Mail },
    {
      href: '/dashboard/sessions',
      icon: BotMessageSquare,
      label: 'Sessions',
    },
    {
      href: '/dashboard/graph',
      icon: Waypoints,
      label: 'Agents',
    },
    {
      href: '/dashboard/connections',
      icon: Cable,
      label: 'Connections',
    },
    {
      href: '/dashboard/settings',
      icon: User, 
      label: 'Profile',
    },
    {
      href: '/dashboard/billing',
      icon: CreditCard,
      label: 'Billing',
    },
  ],
  extras: (
    <div className='flex flex-col gap-2'>
      <SidebarButton icon={MoreHorizontal} className='w-full'>
        More
      </SidebarButton>
      <SessionCreate />
    </div>
  ),
};

const email = localStorage.getItem("email")
export function Sidebar() {
  const isDesktop = useMediaQuery('(min-width: 640px)', {
    initializeWithValue: false,
  });


  if (isDesktop) {
    return <SidebarDesktop sidebarItems={sidebarItems} userData={email}/>;
  }

  return <SidebarMobile sidebarItems={sidebarItems} email={email || ''}/>;
}
