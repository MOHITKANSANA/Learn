
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Share2, Star, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function ReferPage() {

    const handleRefer = () => {
        const message = "नमस्ते! मैंने यह शानदार लर्निंग ऐप 'Learn with Munedra' खोजा है। मुझे लगता है कि यह आपके लिए भी बहुत उपयोगी होगा। इसे देखें: [Your App Link Here]";
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-gradient-to-br from-yellow-400/10 to-primary/10 border-primary/20">
                <CardHeader className="items-center">
                    <div className="p-4 bg-yellow-400/20 rounded-full mb-4">
                        <Gift className="h-12 w-12 text-yellow-400" />
                    </div>
                    <CardTitle className="text-3xl font-headline">रेफर करें और कमाएं</CardTitle>
                    <CardDescription className="text-lg">अपने दोस्तों को आमंत्रित करें और पुरस्कार जीतें!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                           <Star className="text-yellow-500"/> आपको क्या मिलेगा?
                        </h3>
                        <p className="text-muted-foreground">
                            प्रत्येक सफल रेफरल के लिए आपको <strong className="text-primary">10 पॉइंट</strong> मिलेंगे।
                        </p>
                    </div>
                     <div className="space-y-2">
                        <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                           <BookOpen className="text-green-500" /> पुरस्कार कैसे प्राप्त करें?
                        </h3>
                        <p className="text-muted-foreground">
                           <strong className="text-primary">200 पॉइंट</strong> जमा होने पर, आप अपनी पसंद की कोई भी <strong className="text-primary">एक ई-बुक मुफ़्त</strong> में प्राप्त कर सकते हैं।
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full text-lg py-6" onClick={handleRefer}>
                        <Share2 className="mr-2"/> अभी रेफर करें
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

    