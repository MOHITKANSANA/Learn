'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-practice-test.ts';
import '@/ai/flows/get-ai-tutoring.ts';
import '@/ai/flows/vidya-search.ts';
