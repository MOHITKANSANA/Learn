'use client'

import Link from 'next/link';
import { Home, Library, ShoppingBag, Bell, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/my-library', icon: Library, label: 'Library' },
  { href: '/my-orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.label} className={`flex flex-col items-center justify-center gap-1 w-full h-full ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              <item.icon className="h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
