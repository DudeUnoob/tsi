'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { submitContactForm } from '@/lib/firebase';
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
      <div className="bg-[var(--color-linen)] p-8 md:p-12 rounded-[2rem] border border-plum/15 text-center flex flex-col items-center space-y-6 animate-fadeIn">
        <div className="p-4 bg-[#66CC6E]/15 rounded-full text-[#008030]">
          <CheckCircle2 className="h-16 w-16" />
        </div>
        <h3 className="font-display text-3xl font-bold text-plum">Message Sent!</h3>
        <p className="text-sm text-warm-black/85 max-w-sm leading-relaxed">
          Thank you for reaching out. We will read your message and get back to you as soon as possible!
        </p>
        <button
          onClick={() => setFormState('idle')}
          className="px-8 py-3.5 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
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
        <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-plum/60 mb-2">
          Your Name (Optional)
        </label>
        <input
          id="name"
          type="text"
          placeholder="e.g. Radhanatha dasa"
          {...register('name')}
          disabled={formState === 'loading'}
          className="w-full px-5 py-4 bg-[var(--color-linen)] border border-plum/15 focus:border-[var(--color-sunshine)] rounded-2xl text-sm text-plum placeholder-plum/30 focus:outline-none transition-all duration-200"
        />
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-plum/60 mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          {...register('email')}
          disabled={formState === 'loading'}
          className={`w-full px-5 py-4 bg-[var(--color-linen)] border focus:border-[var(--color-sunshine)] rounded-2xl text-sm text-plum placeholder-plum/30 focus:outline-none transition-all duration-200 ${
            errors.email ? 'border-[var(--color-pink)] focus:border-[var(--color-pink)]' : 'border-plum/15'
          }`}
        />
        {errors.email && (
          <p className="text-xs text-[var(--color-pink)] mt-2 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> {errors.email.message}
          </p>
        )}
      </div>

      {/* Message Input */}
      <div>
        <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-plum/60 mb-2">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder="How can Sanga support your journey? Share details about registration issues, event queries, or suggestions..."
          {...register('message')}
          disabled={formState === 'loading'}
          className={`w-full px-5 py-4 bg-[var(--color-linen)] border focus:border-[var(--color-sunshine)] rounded-2xl text-sm text-plum placeholder-plum/30 focus:outline-none transition-all duration-200 resize-none ${
            errors.message ? 'border-[var(--color-pink)] focus:border-[var(--color-pink)]' : 'border-plum/15'
          }`}
        />
        {errors.message && (
          <p className="text-xs text-[var(--color-pink)] mt-2 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> {errors.message.message}
          </p>
        )}
      </div>

      {/* Math Captcha Input */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <label htmlFor="captchaAnswer" className="block text-xs font-bold uppercase tracking-wider text-plum/60 mb-2">
            Security Check: What is 4 + 3?
          </label>
          <input
            id="captchaAnswer"
            type="text"
            placeholder="Answer"
            {...register('captchaAnswer')}
            disabled={formState === 'loading'}
            className={`w-full sm:w-32 px-5 py-4 bg-[var(--color-linen)] border focus:border-[var(--color-sunshine)] rounded-2xl text-sm text-plum placeholder-plum/30 focus:outline-none text-center transition-all duration-200 ${
              errors.captchaAnswer ? 'border-[var(--color-pink)] focus:border-[var(--color-pink)]' : 'border-plum/15'
            }`}
          />
        </div>
        {errors.captchaAnswer && (
          <p className="text-xs text-[var(--color-pink)] font-semibold flex items-center gap-1.5 self-end sm:mb-4">
            <AlertTriangle className="h-3.5 w-3.5" /> {errors.captchaAnswer.message}
          </p>
        )}
      </div>

      {/* Error Message Box */}
      {formState === 'error' && (
        <div className="text-xs text-[var(--color-pink)] font-semibold flex items-center gap-2.5 bg-[var(--color-pink)]/5 p-4 rounded-xl border border-[var(--color-pink)]/10">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={formState === 'loading'}
          className="w-full sm:w-auto px-8 py-4 bg-plum hover:bg-[var(--color-sunshine)] text-[var(--color-linen)] hover:text-plum font-bold text-xs uppercase tracking-wider rounded-full shadow-md hover:shadow-lg transition-all duration-300 inline-flex items-center justify-center cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
