'use client';

import { useState, useEffect } from 'react';

export function CountdownTimer() {
  const calculateTimeLeft = () => {
    const difference = +new Date('2024-12-31T23:59:59') - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents: JSX.Element[] = [];

  Object.keys(timeLeft).forEach((interval) => {
    // @ts-ignore
    if (!timeLeft[interval] && timeLeft[interval] !== 0) {
      return;
    }

    timerComponents.push(
      <span key={interval} className="text-2xl font-bold">
         {/* @ts-ignore */}
        {String(timeLeft[interval]).padStart(2, '0')}
      </span>
    );
  });

  return (
    <div className="flex justify-center gap-2">
      {timerComponents.length ? timerComponents.reduce((prev, curr) => <>{prev} : {curr}</>) : <span>Time's up!</span>}
    </div>
  );
}
