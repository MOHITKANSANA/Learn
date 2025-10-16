import {
  Book,
  Clapperboard,
  Users,
  LayoutDashboard,
  Ticket,
  FileText,
  User,
  MonitorPlay
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', content: <p>Welcome to your dashboard!</p> },
  { icon: Clapperboard, label: 'Live Classes', content: <p>Manage your live classes here.</p> },
  { icon: Book, label: 'Courses', content: <p>Manage your courses here.</p> },
  { icon: FileText, label: 'E-Books', content: <p>Manage your e-books here.</p> },
  { icon: FileText, label: 'Test Series', content: <p>Manage your test series here.</p> },
  { icon: Users, label: 'Educators', content: <p>Manage your educators here.</p> },
  { icon: Users, label: 'Enrollments', content: <p>Manage your enrollments here.</p> },
  { icon: Ticket, label: 'Coupons', content: <p>Manage your coupons here.</p> },
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

        <Tabs defaultValue={adminNavItems[0].label} className="w-full" orientation="vertical">
          <TabsList className="w-full md:w-48 flex-col h-full items-start">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger key={item.label} value={item.label} className="w-full justify-start data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none">
                  <Icon className="h-5 w-5 mr-3" />
                  <span>{item.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
          
          <div className="w-full md:pl-4">
            {adminNavItems.map(item => (
              <TabsContent key={item.label} value={item.label}>
                <Card>
                  <CardHeader>
                    <CardTitle>{item.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {item.content}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}

             <TabsContent value="Live Classes">
              <Card>
                <CardHeader>
                  <CardTitle>Live Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-w-16 aspect-h-9">
                    <iframe
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-lg min-h-[400px]"
                    ></iframe>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  );
}

    