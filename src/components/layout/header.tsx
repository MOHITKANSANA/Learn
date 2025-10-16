'use client';

import Link from 'next/link';
import { GraduationCap, User, Shield, LogOut } from 'lucide-react';
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
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <header className="bg-card shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold font-headline text-primary">
              <GraduationCap className="h-7 w-7" />
              <span>Learn with munedra</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/ai-tutor">AI Tutor</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/ai-test">AI Test</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/book-shala">Book Shala</Link>
              </Button>
              <Button variant="ghost" asChild>
                  <Link href="/admin" className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
              </Button>
            </nav>
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
                    <AvatarImage src={user.photoURL || "https://picsum.photos/seed/user/100/100"} alt="User avatar" />
                    <AvatarFallback>
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || <User />}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>My Courses</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
