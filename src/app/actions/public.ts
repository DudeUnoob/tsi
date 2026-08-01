'use server';

import {
  createEventRegistration,
  subscribeNewsletter,
  submitContactForm,
  type EventRegistration,
} from '@/lib/firebase';

/**
 * Server actions for the three public write paths (newsletter, contact form,
 * event registration + its order). Client components call these instead of
 * importing `@/lib/firebase` directly, which keeps the Firebase Web SDK —
 * app, firestore, auth and storage — out of every page's JavaScript bundle.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeNewsletterAction(
  email: string,
): Promise<{ success: boolean; message: string }> {
  const trimmed = email.trim();
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  return subscribeNewsletter(trimmed);
}

export async function submitContactFormAction(
  name: string,
  email: string,
  message: string,
): Promise<{ success: boolean; message: string }> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();
  if (!trimmedName || !trimmedEmail || !trimmedMessage) {
    return { success: false, message: 'Please fill in every field.' };
  }
  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  return submitContactForm(trimmedName, trimmedEmail, trimmedMessage);
}

export async function createEventRegistrationAction(
  regData: Omit<EventRegistration, 'id' | 'created_at'>,
): Promise<{ success: boolean; registration?: EventRegistration; message?: string }> {
  return createEventRegistration(regData);
}
