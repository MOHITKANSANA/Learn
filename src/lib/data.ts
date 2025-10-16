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
  Swords,
  ShoppingBag
} from 'lucide-react';
import { PlaceHolderImages } from './placeholder-images';

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
    title: 'E-books',
    href: '/ebooks',
    icon: Book,
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
    title: 'Previous Papers',
    href: '/previous-papers',
    icon: Newspaper,
  },
  {
    title: 'AI Tutor',
    href: '/ai-tutor',
    icon: Bot,
  },
  {
    title: 'Book Shala',
    href: '/book-shala',
    icon: Library,
  },
  {
    title: 'Battle Quiz',
    href: '/battle-quiz',
    icon: Swords,
  },
  {
    title: 'AI Test',
    href: '/ai-test',
    icon: Bot,
  },
];


export const sidebarNavItems: { title: string; href: string; icon: LucideIcon }[] = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
  },
  {
    title: 'My Library',
    href: '/my-library',
    icon: Library,
  },
  {
    title: 'My Orders',
    href: '/my-orders',
    icon: ShoppingBag,
  },
  {
    title: 'Social Media',
    href: '#',
    icon: Users,
  },
  {
    title: 'Book Shala',
    href: '/book-shala',
    icon: Book,
  },
  {
    title: 'Motivation',
    href: '/motivation',
    icon: Heart,
  },
  {
    title: 'E-Books',
    href: '/ebooks',
    icon: BookOpenCheck,
  },
  {
    title: 'Profile',
    href: '#',
    icon: User,
  },
  {
    title: 'Courses',
    href: '/courses',
    icon: BookOpenCheck,
  },
  {
    title: 'Live Classes',
    href: '/live-classes',
    icon: PlaySquare,
  },
  {
    title: 'Test Series',
    href: '/test-series',
    icon: FileText,
  },
  {
    title: 'Scholarship',
    href: '#',
    icon: Trophy,
  },
  {
    title: 'Previous Papers',
    href: '/previous-papers',
    icon: Newspaper,
  },
  {
    title: 'News',
    href: '#',
    icon: Newspaper,
  },
  {
    title: 'GoLingua',
    href: '#',
    icon: Languages,
  },
  {
    title: 'Feed',
    href: '#',
    icon: Rss,
  },
  {
      title: 'Admin',
      href: '/admin',
      icon: Shield,
  }
];


export const promotionItems = [
    {
        title: 'New Course Launch!',
        description: 'Advanced Web Development course is now available. Enroll now!',
    },
    {
        title: 'Limited Time Offer',
        description: 'Get 50% off on all test series for the next 48 hours.',
    },
    {
        title: 'Free Live Class',
        description: 'Join our free live session on "Introduction to AI" this weekend.',
    }
];

export const books = [
  {
    id: '1',
    title: 'The Future of AI',
    author: 'Dr. Evelyn Reed',
    price: '29.99',
    description: 'An in-depth exploration of the future of artificial intelligence and its impact on society.',
    image: PlaceHolderImages.find(img => img.id === 'book-1'),
  },
  {
    id: '2',
    title: 'Quantum Computing Explained',
    author: 'Prof. Ken Adams',
    price: '34.99',
    description: 'A comprehensive guide to understanding the principles of quantum computing.',
    image: PlaceHolderImages.find(img => img.id === 'book-2'),
  },
  {
    id: '3',
    title: 'Advanced Data Structures',
    author: 'Dr. Priya Sharma',
    price: '49.99',
    description: 'Master complex data structures with this advanced textbook for students and professionals.',
    image: PlaceHolderImages.find(img => img.id === 'book-3'),
  },
  {
    id: '4',
    title: 'The Art of Learning',
    author: 'Michael Chen',
    price: '19.99',
    description: 'Discover effective strategies for learning any skill and improving your memory.',
    image: PlaceHolderImages.find(img => img.id === 'book-4'),
  },
];
