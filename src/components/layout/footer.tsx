import { MobileNav } from "./mobile-nav";
import { MyOrders } from "lucide-react";
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-card md:hidden fixed bottom-0 left-0 right-0 border-t">
        <MobileNav />
    </footer>
  );
}
