import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardItems, promotionItems } from '@/lib/data';

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="w-full">
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {promotionItems.map((item, index) => (
              <CarouselItem key={index}>
                <Card className="bg-primary/20 border-primary/40">
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold font-headline text-primary-foreground">{item.title}</h3>
                    <p className="text-primary-foreground/80 mt-2">{item.description}</p>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-8 font-headline">Student Portal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.title}>
                <Card className="h-full hover:shadow-lg hover:border-accent transition-all duration-300 transform hover:-translate-y-1 group">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <div className="bg-accent/50 p-3 rounded-full">
                       <Icon className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <CardTitle className="text-xl font-headline group-hover:text-accent-foreground transition-colors">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
