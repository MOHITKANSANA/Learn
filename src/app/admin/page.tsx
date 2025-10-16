import {
  Book,
  BookMarked,
  Clapperboard,
  ClipboardList,
  Contact,
  Ticket,
  GalleryHorizontal,
  History,
  IndianRupee,
  LayoutDashboard,
  Newspaper,
  Presentation,
  Settings,
  Sparkles,
  Swords,
  Upload,
  Users,
  Youtube,
  FileCode,
  Smartphone,
  Trophy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const adminNavItems = [
  { icon: IndianRupee, label: 'Revenue' },
  { icon: Upload, label: 'Add Content' },
  { icon: LayoutDashboard, label: 'Manage Content' },
  { icon: Users, label: 'Manage Users' },
  { icon: Book, label: 'Book Shala' },
  { icon: Sparkles, label: 'Motivation' },
  { icon: GalleryHorizontal, label: 'Gallery' },
  { icon: Contact, label: 'Course Enrollments' },
  { icon: ClipboardList, label: 'Test Enrollments' },
  { icon: BookMarked, label: 'E-Book Enrollments' },
  { icon: Newspaper, label: 'Paper Enrollments' },
  { icon: Trophy, label: 'Scholarships' },
  { icon: Youtube, label: 'Kids Tube' },
  { icon: Ticket, label: 'Coupons' },
  { icon: Presentation, label: 'Promotions' },
  { icon: Smartphone, label: 'PWA Installations' },
  { icon: FileCode, label: 'HTML Editor' },
  { icon: Settings, label: 'App Settings' },
];

export default function AdminDashboardPage() {
  return (
    <div className="bg-background text-foreground min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your application content and users.
          </p>
        </header>

        <Tabs defaultValue="Revenue" className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-2 bg-transparent p-0">
            {adminNavItems.slice(0, 2).map((item) => (
               <TabsTrigger key={item.label} value={item.label} className="bg-card border-border border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <Card className="mt-6 bg-card/50">
            <CardContent className="p-6">
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
                {adminNavItems.slice(2).map(item => {
                    const Icon = item.icon;
                    return (
                        <button key={item.label} className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground hover:text-primary transition-colors duration-200">
                           <div className="p-3 bg-muted rounded-full">
                             <Icon className="h-6 w-6" />
                           </div>
                           <span className="text-sm font-medium">{item.label}</span>
                        </button>
                    )
                })}
               </div>
            </CardContent>
          </Card>

           <TabsContent value="Revenue" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">₹ 0.00</p>
                </CardContent>
              </Card>
           </TabsContent>
        </Tabs>
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Live Class - Youtube Player</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-lg"
                ></iframe>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Previous Year Paper PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[600px] border rounded-lg overflow-hidden">
                 <iframe src="https://arxiv.org/pdf/2303.08774.pdf" className="w-full h-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
