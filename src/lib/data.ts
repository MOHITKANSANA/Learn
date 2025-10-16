import type { LucideIcon } from 'lucide-react';
import { 
  BookOpenCheck,
  ClipboardList,
  PlaySquare,
  BrainCircuit,
  BotMessageSquare,
  Swords,
  History,
  BookMarked,
  Sparkles
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
    title: 'Test Series',
    href: '/test-series',
    icon: ClipboardList,
    description: 'Practice with our comprehensive test series.',
  },
  {
    title: 'Live Classes',
    href: '/live-classes',
    icon: PlaySquare,
    description: 'Join live classes with top educators.',
  },
  {
    title: 'AI Tests',
    href: '/ai-test',
    icon: BrainCircuit,
    description: 'Generate practice tests on any subject with AI.',
  },
  {
    title: 'AI Tutor',
    href: '/ai-tutor',
    icon: BotMessageSquare,
    description: 'Get instant answers to your questions from an AI tutor.',
  },
  {
    title: 'Battle Quiz',
    href: '/battle-quiz',
    icon: Swords,
    description: 'Challenge your friends in a fun quiz battle.',
  },
  {
    title: 'Previous Papers',
    href: '/previous-papers',
    icon: History,
    description: 'Access a vast library of previous year papers.',
  },
  {
    title: 'E-books',
    href: '/ebooks',
    icon: BookMarked,
    description: 'Browse our collection of digital books.',
  },
  {
    title: 'Motivation',
    href: '/motivation',
    icon: Sparkles,
    description: 'Get your daily dose of motivation and inspiration.',
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
