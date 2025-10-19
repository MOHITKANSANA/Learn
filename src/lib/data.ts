
import type { LucideIcon } from 'lucide-react';
import { 
  BookOpenCheck,
  Book,
  Gift,
  Library,
  PlaySquare,
  Heart,
  Trophy,
  User,
  Ticket,
  Home,
  Users,
  FileText,
  Newspaper,
  Languages,
  Rss,
  Shield,
  Bot,
  ShoppingBag,
  BadgePercent,
  MessageCircle,
  HelpCircle,
  BrainCircuit,
  Youtube,
  Facebook,
  Instagram,
  Send as Telegram,
  Link as LinkIcon,
} from 'lucide-react';

type DashboardItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardItems: DashboardItem[] = [
  {
    title: 'Courses',
    href: '/courses',
    icon: BookOpenCheck,
  },
  {
    title: 'Free Courses',
    href: '/free-courses',
    icon: Gift,
  },
  {
    title: 'Scholarship',
    href: '/scholarship',
    icon: Trophy,
  },
  {
    title: 'Test Series',
    href: '/test-series',
    icon: FileText,
  },
  {
    title: 'Live Classes',
    href: '/live-classes',
    icon: PlaySquare,
  },
  {
    title: 'Book Shala',
    href: '/book-shala',
    icon: Book,
  },
   {
    title: 'Public Square',
    href: '/public-square',
    icon: MessageCircle,
  },
  {
    title: 'Vidya Search',
    href: '/vidya-search',
    icon: Bot,
  },
  {
    title: 'Previous Papers',
    href: '/previous-papers',
    icon: Newspaper,
  },
  {
    title: 'My Library',
    href: '/my-library',
    icon: Library,
  },
  {
    title: 'E-books',
    href: '/ebooks',
    icon: Book,
  },
  {
    title: 'Motivation',
    href: '/motivation',
    icon: Heart,
  },
];


export const sidebarNavItems: { title: string; href: string; icon: LucideIcon }[] = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
  },
  {
    title: 'My Orders',
    href: '/my-orders',
    icon: ShoppingBag,
  },
  {
    title: 'Feed',
    href: '/feed',
    icon: Rss,
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    title: 'Social Links',
    href: '/social-links',
    icon: LinkIcon,
  },
  {
      title: 'Admin',
      href: '/admin',
      icon: Shield,
  }
];

export const socialLinkIcons: { [key: string]: LucideIcon } = {
  youtube: Youtube,
  facebook: Facebook,
  instagram: Instagram,
  telegram: Telegram,
  default: LinkIcon,
};
