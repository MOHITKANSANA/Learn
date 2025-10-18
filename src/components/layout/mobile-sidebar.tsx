

'use client';

import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { sidebarNavItems } from '@/lib/data';
import { Button } from '../ui/button';
import { Gift } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function MobileSidebar() {
  const { user } = useUser();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  }

  const referLink = `https://wa.me/?text=${encodeURIComponent('Check out this awesome learning app! [Your App Link Here]')}`;

  return (
    <Sidebar side="left" collapsible="offcanvas">
      <SidebarContent className="p-0 flex flex-col bg-card">
         <div className='p-4'>
            <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
                <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/user/100/100"} />
                <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold text-white">{user?.displayName || 'Welcome'}</p>
                <p className="text-sm text-gray-300">{user?.email}</p>
            </div>
            </div>
        </div>
        <div className='flex-grow overflow-y-auto'>
            <SidebarMenu className="gap-0">
            {sidebarNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                <SidebarMenuItem key={item.title} className="p-0">
                <SidebarMenuButton
                    asChild
                    className={`h-auto rounded-none p-4 justify-start ${isActive ? 'bg-yellow-400/80 text-black font-bold' : 'font-normal text-white'} hover:bg-yellow-400/70 hover:text-black`}
                    isActive={isActive}
                    onClick={handleLinkClick}
                >
                    <Link href={item.href}>
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.title}</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            )})}
            </SidebarMenu>
        </div>
        <SidebarFooter className="p-4 mt-auto">
            <Button asChild className="w-full bg-yellow-500 hover:bg-yellow-600 text-black justify-center">
                <Link href={referLink} target="_blank">
                    <Gift className="mr-2 h-4 w-4" /> Refer & Earn
                </Link>
            </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
