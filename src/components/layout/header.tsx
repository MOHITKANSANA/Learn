

'use client';

import Link from 'next/link';
import { GraduationCap, User, Shield, LogOut, Menu, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { collection, query } from 'firebase/firestore';

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const cartQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/cart`));
  }, [firestore, user]);
  const { data: cartItems } = useCollection(cartQuery);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
    window.location.reload(); // Force a reload to re-trigger anonymous sign-in
  };
  
  const handleProfileClick = () => {
      if(user?.isAnonymous) {
          router.push('/signup');
      } else {
          router.push('/profile');
      }
  }
  
  // Hide app name on the home page
  const showAppName = pathname !== '/home';

  return (
    <header className="bg-card shadow-sm sticky top-0 z-40 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpenMobile(true)}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <Link href="/" className="flex items-center gap-2 text-xl font-bold font-headline text-primary">
              <GraduationCap className="h-7 w-7" />
              {showAppName && <span className="inline-block">L W M</span>}
            </Link>
          </div>
          <div className="flex items-center gap-4">
             <Button asChild variant="ghost" size="icon" className="relative">
                <Link href="/cart">
                  <ShoppingCart className="h-6 w-6" />
                   {cartItems && cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0)}
                    </span>
                  )}
                  <span className="sr-only">Shopping Cart</span>
                </Link>
              </Button>
            {isUserLoading ? (
              <Avatar className="cursor-pointer h-9 w-9">
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
              </Avatar>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer h-9 w-9">
                    <AvatarImage src={user.isAnonymous ? '' : user.photoURL || "https://picsum.photos/seed/user/100/100"} alt="User avatar" />
                    <AvatarFallback>
                      {user.isAnonymous ? <User /> : user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{user.isAnonymous ? 'Guest Account' : 'My Account'}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleProfileClick}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{user.isAnonymous ? 'Sign Up' : 'Profile'}</span>
                  </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                     <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </Link>
                   </DropdownMenuItem>
                  <DropdownMenuItem>My Courses</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {!user.isAnonymous && (
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
               <Avatar className="cursor-pointer h-9 w-9">
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                </Avatar>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
