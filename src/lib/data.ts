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
  Ticket
} from 'lucide-react';
import { PlaceHolderImages } from './placeholder-images';

type DashboardItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const dashboardItems: DashboardItem[] = [
  {
    title: 'Courses',
    href: '/courses',
    icon: BookOpenCheck,
    description: 'Explore our wide range of expert-led courses.',
  },
  {
    title: 'Book Shala',
    href: '/book-shala',
    icon: Book,
    description: 'Your one-stop shop for educational books.',
  },
  {
    title: 'Free Courses',
    href: '/courses',
    icon: Ticket,
    description: 'Access free courses.',
  },
  {
    title: 'Refer & Earn',
    href: '#',
    icon: Gift,
    description: 'Refer friends and earn rewards.',
  },
  {
    title: 'My Library',
    href: '#',
    icon: Library,
    description: 'Your personal collection of content.',
  },
  {
    title: 'Live Classes',
    href: '/live-classes',
    icon: PlaySquare,
    description: 'Join live classes with top educators.',
  },
  {
    title: 'Motivation',
    href: '/motivation',
    icon: Heart,
    description: 'Get your daily dose of motivation.',
  },
  {
    title: 'Scholarship',
    href: '#',
    icon: Trophy,
    description: 'Apply for scholarships.',
  },
  {
    title: 'Profile',
    href: '#',
    icon: User,
    description: 'View and edit your profile.',
  },
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

export const educators = [
  {
    id: '1',
    name: 'Arun',
    image: PlaceHolderImages.find(img => img.id === 'educator-1'),
  },
  {
    id: '2',
    name: 'Mohit',
    image: PlaceHolderImages.find(img => img.id === 'educator-2'),
  },
  {
    id: '3',
    name: 'Priya',
    image: PlaceHolderImages.find(img => img.id === 'educator-3'),
  },
  {
    id: '4',
    name: 'Rahul',
    image: PlaceHolderImages.find(img => img.id === 'educator-4'),
  },
    {
    id: '5',
    name: 'Aisha',
    image: PlaceHolderImages.find(img => img.id === 'educator-5'),
  },
    {
    id: '6',
    name: 'Karan',
    image: PlaceHolderImages.find(img => img.id === 'educator-6'),
  },
];
