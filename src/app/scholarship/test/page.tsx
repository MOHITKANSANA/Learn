'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import { Loader2, Check, X, ArrowRight, ArrowLeft, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function ScholarshipTestPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const [test, setTest] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);

    // 1. Find the scholarship test
    const scholarshipTestQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'test_series'), where('isScholarshipTest', '==', true)) : null
    , [firestore]);
    const { data: scholarshipTests, isLoading: isLoadingTests } = useCollection(scholarshipTestQuery);

    // 2. Fetch the full test data once we have the ID
    useEffect(() => {
        if (scholarshipTests && scholarshipTests.length > 0) {
            const testId = scholarshipTests[0].id;
            const getTest = async () => {
                if (!firestore) return;
                const testRef = doc(firestore, 'test_series', testId);
                const testSnap = await getDoc(testRef);
                if (testSnap.exists()) {
                    setTest(testSnap.data());
                }
                setIsLoading(false);
            };
            getTest();
        } else if (!isLoadingTests) {
            setIsLoading(false);
        }
    }, [scholarshipTests, firestore, isLoadingTests]);

    const handleAnswerChange = (questionIndex: number, optionText: string) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: optionText }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < test.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = () => {
        let correctAnswers = 0;
        test.questions.forEach((q: any, index: number) => {
            const correctAnswer = q.options.find((opt: any) => opt.isCorrect)?.text;
            if (answers[index] === correctAnswer) {
                correctAnswers++;
            }
        });
        setScore(correctAnswers);
        setIsFinished(true);
        // Here you would typically save the result to Firestore
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin"/></div>;
    }

    if (!test) {
        return <div className="text-center mt-10">No scholarship test is currently active.</div>;
    }

    if (isFinished) {
        const totalQuestions = test.questions.length;
        const percentage = (score / totalQuestions) * 100;
        return (
            <Card className="max-w-2xl mx-auto text-center">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Test Finished!</CardTitle>
                    <CardDescription>Here is your result.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-center items-center">
                        <Trophy className="h-24 w-24 text-yellow-400" />
                    </div>
                    <p className="text-xl font-bold">You scored {score} out of {totalQuestions}</p>
                    <p className="text-4xl font-extrabold text-primary">{percentage.toFixed(2)}%</p>
                </CardContent>
            </Card>
        );
    }

    const currentQuestion = test.questions[currentQuestionIndex];

    return (
        <div className="max-w-3xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">{test.title}</CardTitle>
                    <CardDescription>Question {currentQuestionIndex + 1} of {test.questions.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-semibold text-lg mb-6">{currentQuestion.text}</p>
                    <RadioGroup 
                        value={answers[currentQuestionIndex]}
                        onValueChange={(value) => handleAnswerChange(currentQuestionIndex, value)}
                        className="space-y-4"
                    >
                        {currentQuestion.options.map((option: any, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.text} id={`q${currentQuestionIndex}-opt${index}`} />
                                <Label htmlFor={`q${currentQuestionIndex}-opt${index}`} className="text-base">{option.text}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>
                <CardContent className="flex justify-between items-center border-t pt-6">
                    <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
                        <ArrowLeft className="mr-2 h-4 w-4"/> Previous
                    </Button>
                    {currentQuestionIndex === test.questions.length - 1 ? (
                         <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                           Submit Test
                        </Button>
                    ) : (
                        <Button onClick={handleNext}>
                            Next <ArrowRight className="ml-2 h-4 w-4"/>
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
