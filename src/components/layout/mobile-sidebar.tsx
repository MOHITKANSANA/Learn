
'use client';

import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
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

  return (
    <Sidebar side="left" collapsible="offcanvas">
      <SidebarHeader className='bg-background/90 p-4'>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/user/100/100"} />
            <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user?.displayName || 'Welcome'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0 bg-background">
        <SidebarMenu className="gap-0">
          {sidebarNavItems.map((item) => (
            <SidebarMenuItem key={item.title} className="p-0">
              <SidebarMenuButton
                asChild
                className={`h-auto rounded-none p-4 justify-start ${pathname === item.href ? 'bg-primary/20 text-primary font-bold' : 'font-normal'}`}
                isActive={pathname === item.href}
                onClick={handleLinkClick}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button className="w-full bg-primary justify-center">
            <Gift className="mr-2 h-4 w-4" /> Refer & Earn
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
