import { LucideIcon } from 'lucide-react';
import { Button, ButtonProps } from '../ui/button';
import { cn } from '@/lib/utils';
import { SheetClose } from '../ui/sheet';
import Cookies from "js-cookie"

interface SidebarButtonProps extends ButtonProps {
  icon?: LucideIcon;
  
}

export function SidebarButton({
  icon: Icon,
  className,
  children,
  ...props
}: SidebarButtonProps) {
  const handleLogout = () => {
    Cookies.remove("token");
  };
  return (
    <Button
      variant='ghost'
      className={cn('gap-2 justify-start font-psemibold', className)}
      {...props}
    >
      {Icon && <Icon size={20} />}
      <span>{children}</span>
    </Button>
  );
}

export function SidebarButtonSheet(props: SidebarButtonProps) {
  return (
    <SheetClose asChild>
      <SidebarButton {...props} />
    </SheetClose>
  );
}
