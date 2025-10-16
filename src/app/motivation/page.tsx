import { Sparkles } from "lucide-react";

export default function MotivationPage() {
  return (
    <div className="text-center flex flex-col items-center justify-center h-full">
      <Sparkles className="h-16 w-16 text-primary mb-4" />
      <h1 className="text-4xl font-bold font-headline">Stay Motivated!</h1>
      <p className="text-muted-foreground mt-4 text-lg max-w-md">
        "The secret to getting ahead is getting started." – Mark Twain.
        <br />
        More motivational content is on its way!
      </p>
    </div>
  );
}
