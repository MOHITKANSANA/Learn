'use client';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { dashboardItems, educators } from '@/lib/data';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/countdown-timer';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export default function Home() {
  const { user } = useUser();

  const colors = [
    "bg-blue-500", "bg-orange-500", "bg-green-500",
    "bg-purple-500", "bg-pink-500", "bg-red-500",
    "bg-rose-500", "bg-yellow-500", "bg-gray-500"
  ];

  return (
    <div className="space-y-6">
      <section>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Hello {user?.displayName?.split(' ')[0] || 'Student'}!</h1>
          <Button>Support</Button>
        </div>
        <Card className="bg-primary/90">
            <CardContent className="p-3">
              <p className="text-center text-primary-foreground font-semibold">
                शन please support 🙏
              </p>
            </CardContent>
          </Card>
      </section>

      <section>
        <div className="grid grid-cols-3 gap-4">
          {dashboardItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.title}>
                <Card className={`${colors[index % colors.length]} text-white h-full hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1 group`}>
                  <CardContent className="flex flex-col items-center justify-center p-4 aspect-square">
                    <Icon className="h-8 w-8 mb-2" />
                    <p className="font-semibold text-center text-sm">{item.title}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

       <section>
        <h2 className="text-xl font-bold mb-4">Our Educators</h2>
        <Carousel opts={{ align: "start", loop: true }}>
          <CarouselContent>
            {educators.map((educator) => (
              <CarouselItem key={educator.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                <div className="text-center">
                  <Image
                    src={educator.image.imageUrl}
                    alt={educator.name}
                    width={100}
                    height={100}
                    className="rounded-full mx-auto mb-2 border-2 border-primary"
                    data-ai-hint={educator.image.imageHint}
                  />
                  <p className="font-semibold">{educator.name}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </section>

      <section>
        <Card className="bg-card/80">
          <CardContent className="p-4 text-center">
            <h3 className="text-lg font-semibold mb-2">Next Live Class</h3>
            <CountdownTimer />
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
