'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { submitContactForm } from '@/lib/supabase';
import { Loader2, CheckCircle2, AlertTriangle, Send } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
  honeypot: z.string().max(0, { message: 'Spam detected' }).optional(), // Honeypot field
  captchaAnswer: z.string().min(1, 'Security check is required')
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactForm() {
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      honeypot: '',
      captchaAnswer: ''
    }
  });

  const onSubmit = async (values: ContactFormValues) => {
    // If honeypot is filled, it's spam. Ignore request silently or show error.
    if (values.honeypot) {
      setFormState('success'); // Pretend success to confuse bots
      return;
    }

    if (values.captchaAnswer.trim() !== '7') {
      setFormState('error');
      setErrorMessage('Math challenge answer is incorrect.');
      return;
    }

    setFormState('loading');
    try {
      const res = await submitContactForm(
        values.name || 'Anonymous User',
        values.email,
        values.message
      );
      
      if (res.success) {
        setFormState('success');
        reset();
      } else {
        setFormState('error');
        setErrorMessage(res.message);
      }
    } catch (e) {
      setFormState('error');
      const err = e as Error;
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  if (formState === 'success') {
    return (
      <div className="bg-linen p-8 rounded-3xl border border-plum/15 text-center flex flex-col items-center space-y-4 animate-fadeIn">
        <CheckCircle2 className="h-14 w-14 text-mint-green" />
        <h3 className="font-display text-2xl font-bold text-plum">Message Sent!</h3>
        <p className="text-sm text-warm-black/80 font-sans max-w-sm">
          Thank you for reaching out. We will read your message and get back to you as soon as possible!
        </p>
        <button
          onClick={() => setFormState('idle')}
          className="mt-4 px-6 py-2.5 bg-plum text-linen hover:bg-tangerine rounded-full font-bold text-xs uppercase tracking-wider transition-colors"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-sans">
      
      {/* Honeypot hidden input */}
      <div className="hidden">
        <label htmlFor="honeypot">Leave this empty</label>
        <input 
          id="honeypot" 
          type="text" 
          {...register('honeypot')} 
          autoComplete="off" 
        />
      </div>

      {/* Name Input */}
      <div>
        <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">
          Your Name (Optional)
        </label>
        <input
          id="name"
          type="text"
          placeholder="Name"
          {...register('name')}
          disabled={formState === 'loading'}
          className="w-full px-4 py-3 bg-linen border border-plum/15 rounded-2xl text-sm placeholder-warm-black/35 focus:outline-none focus:border-plum/45 transition-colors"
        />
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="email@example.com"
          {...register('email')}
          disabled={formState === 'loading'}
          className={`w-full px-4 py-3 bg-linen border rounded-2xl text-sm placeholder-warm-black/35 focus:outline-none focus:border-plum/45 transition-colors ${
            errors.email ? 'border-tangerine' : 'border-plum/15'
          }`}
        />
        {errors.email && (
          <p className="text-xs text-tangerine mt-1 font-semibold flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" /> {errors.email.message}
          </p>
        )}
      </div>

      {/* Message Input */}
      <div>
        <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder="How can Sanga support your journey? Share details about registration issues, event queries, or suggestions..."
          {...register('message')}
          disabled={formState === 'loading'}
          className={`w-full px-4 py-3 bg-linen border rounded-2xl text-sm placeholder-warm-black/35 focus:outline-none focus:border-plum/45 transition-colors resize-none ${
            errors.message ? 'border-tangerine' : 'border-plum/15'
          }`}
        />
        {errors.message && (
          <p className="text-xs text-tangerine mt-1 font-semibold flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" /> {errors.message.message}
          </p>
        )}
      </div>

      {/* Math Captcha Input */}
      <div>
        <label htmlFor="captchaAnswer" className="block text-xs font-bold uppercase tracking-wider text-warm-black/60 mb-2">
          Security Check: What is 4 + 3?
        </label>
        <input
          id="captchaAnswer"
          type="text"
          placeholder="Your answer"
          {...register('captchaAnswer')}
          disabled={formState === 'loading'}
          className={`w-28 px-4 py-3 bg-linen border rounded-2xl text-sm placeholder-warm-black/35 focus:outline-none focus:border-plum/45 transition-colors text-center ${
            errors.captchaAnswer ? 'border-tangerine' : 'border-plum/15'
          }`}
        />
        {errors.captchaAnswer && (
          <p className="text-xs text-tangerine mt-1 font-semibold flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" /> {errors.captchaAnswer.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      {formState === 'error' && (
        <p className="text-xs text-tangerine font-semibold flex items-center bg-tangerine/5 p-3 rounded-xl border border-tangerine/10">
          <AlertTriangle className="h-4 w-4 mr-2" /> {errorMessage}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={formState === 'loading'}
          className="w-full sm:w-auto px-8 py-3.5 bg-plum text-linen hover:bg-tangerine hover:text-linen font-bold text-xs uppercase tracking-wider rounded-full shadow-sm hover:shadow-md transition-all duration-200 inline-flex items-center justify-center cursor-pointer"
        >
          {formState === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
            </>
          ) : (
            <>
              Send Message <Send className="ml-2 h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

    </form>
  );
}
