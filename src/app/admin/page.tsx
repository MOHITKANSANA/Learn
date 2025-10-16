
'use client';

import {
  Book,
  Users,
  Ticket,
  PlusCircle,
  Edit,
  Video,
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const adminNavItems = [
  { value: 'manage-content', icon: Book, label: 'Manage Content' },
  { value: 'enrollments', icon: Users, label: 'Enrollments' },
  { value: 'coupons', icon: Ticket, label: 'Coupons' },
];

function CreateCourseForm() {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="courseTitle">Course Title</Label>
                <Input id="courseTitle" placeholder="e.g., Advanced Web Development" />
            </div>
            <div>
                <Label htmlFor="courseDescription">Course Description</Label>
                <Textarea id="courseDescription" placeholder="Describe the course content..." />
            </div>
            <div>
                <Label htmlFor="coursePrice">Price</Label>
                <Input id="coursePrice" type="number" placeholder="e.g., 999" />
            </div>
             <div>
                <Label htmlFor="courseImage">Course Image</Label>
                <Input id="courseImage" type="file" />
            </div>
            <Button>Create Course</Button>
        </div>
    )
}

function AddEducatorForm() {
  return (
      <div className="space-y-4">
          <div>
              <Label htmlFor="educatorName">Educator Name</Label>
              <Input id="educatorName" placeholder="e.g., Dr. Arun Sharma" />
          </div>
           <div>
              <Label htmlFor="educatorImage">Educator Image</Label>
              <Input id="educatorImage" type="file" accept="image/*" />
          </div>
          <Button>Add Educator</Button>
      </div>
  )
}

function AddLiveClassForm() {
  return (
      <div className="space-y-4">
          <div>
              <Label htmlFor="liveClassTitle">Live Class Title</Label>
              <Input id="liveClassTitle" placeholder="e.g., Live Q&A Session" />
          </div>
          <div>
              <Label htmlFor="liveClassDescription">Description</Label>
              <Textarea id="liveClassDescription" placeholder="What will be covered in this class?" />
          </div>
          <div>
              <Label htmlFor="educator">Educator</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select an educator" />
                </SelectTrigger>
                <SelectContent>
                  {/* This should be populated dynamically */}
                  <SelectItem value="arun">Arun</SelectItem>
                  <SelectItem value="mohit">Mohit</SelectItem>
                </SelectContent>
              </Select>
          </div>
           <div>
              <Label htmlFor="liveClassDate">Date</Label>
              <Input id="liveClassDate" type="date" />
          </div>
          <div>
              <Label htmlFor="liveClassTime">Time</Label>
              <Input id="liveClassTime" type="time" />
          </div>
           <div>
              <Label htmlFor="youtubeUrl">YouTube Video URL</Label>
              <Input id="youtubeUrl" placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          <Button>Schedule Live Class</Button>
      </div>
  )
}


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

        <Tabs defaultValue={adminNavItems[0].value} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
             {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger key={item.value} value={item.value}>
                  <Icon className="h-5 w-5 mr-2" />
                  <span>{item.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="manage-content">
             <Tabs defaultValue="add-course" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="add-course"><PlusCircle className="mr-2 h-4 w-4" /> Add Course</TabsTrigger>
                    <TabsTrigger value="edit-course"><Edit className="mr-2 h-4 w-4" /> Edit Course</TabsTrigger>
                    <TabsTrigger value="add-educator"><UserPlus className="mr-2 h-4 w-4" /> Add Educator</TabsTrigger>
                    <TabsTrigger value="add-live-class"><Video className="mr-2 h-4 w-4" /> Add Live Class</TabsTrigger>
                </TabsList>
                <TabsContent value="add-course">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create a New Course</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CreateCourseForm />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="edit-course">
                     <Card>
                        <CardHeader>
                            <CardTitle>Edit Existing Course Content</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p>Here you can add PDFs, live classes, notes, and test series to your existing courses.</p>
                           {/* TODO: Add functionality to list and edit existing courses */}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="add-educator">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add a New Educator</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AddEducatorForm />
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="add-live-class">
                    <Card>
                        <CardHeader>
                            <CardTitle>Schedule a New Live Class</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AddLiveClassForm />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card>
              <CardHeader>
                <CardTitle>Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                Manage your enrollments here.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons">
            <Card>
              <CardHeader>
                <CardTitle>Coupons</CardTitle>
              </CardHeader>
              <CardContent>
                Manage your coupons here.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
