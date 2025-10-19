
'use client';

import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
  SidebarSeparator
} from '@/components/ui/sidebar';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { sidebarNavItems, socialLinkIcons } from '@/lib/data';
import { Button } from '../ui/button';
import { Gift, Youtube, Facebook, Instagram, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { collection } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';

export function MobileSidebar() {
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  
  const { data: socialLinks } = useCollection(useMemoFirebase(
    () => firestore ? collection(firestore, 'socialLinks') : null,
    [firestore]
  ));

  const handleLinkClick = () => {
    setOpenMobile(false);
  }

  const handleLogout = async () => {
    await signOut(auth);
    setOpenMobile(false);
    router.push('/signup');
  };


  const referLink = `/refer`;

  return (
    <Sidebar side="left" collapsible="offcanvas">
       <SidebarContent className="p-0 flex flex-col bg-slate-900 text-white">
         <div className='p-4 bg-slate-800'>
            <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
                <AvatarImage src={user?.photoURL || undefined} />
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

             <SidebarSeparator className="my-2" />
             
             {/* Static Social Links */}
                <SidebarMenuItem className="p-0">
                    <SidebarMenuButton asChild className="h-auto rounded-none p-4 justify-start font-normal text-white hover:bg-yellow-400/70 hover:text-black" onClick={handleLinkClick}>
                        <a href="https://youtube.com/@learnwithmunendra?si=2rDXT8uyY1aLieOC" target="_blank" rel="noopener noreferrer">
                           <Youtube className="h-5 w-5 mr-3 text-red-500" /> <span>Youtube</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="p-0">
                    <SidebarMenuButton asChild className="h-auto rounded-none p-4 justify-start font-normal text-white hover:bg-yellow-400/70 hover:text-black" onClick={handleLinkClick}>
                       <a href="https://www.facebook.com/share/17FaLyq3GL/" target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-5 w-5 mr-3 text-blue-500" /> <span>Facebook</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="p-0">
                    <SidebarMenuButton asChild className="h-auto rounded-none p-4 justify-start font-normal text-white hover:bg-yellow-400/70 hover:text-black" onClick={handleLinkClick}>
                       <a href="https://www.instagram.com/munendra_yadav_etah?igsh=a3RhNzNtZTdlNXNt" target="_blank" rel="noopener noreferrer">
                           <Instagram className="h-5 w-5 mr-3 text-pink-500" /> <span>Instagram</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>


            </SidebarMenu>
        </div>
        <SidebarFooter className="p-4 mt-auto flex flex-col gap-2">
            <Button asChild className="w-full bg-yellow-500 hover:bg-yellow-600 text-black justify-center">
                <Link href={referLink} onClick={handleLinkClick}>
                    <Gift className="mr-2 h-4 w-4" /> Refer & Earn
                </Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Log Out
            </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
