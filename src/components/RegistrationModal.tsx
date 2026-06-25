'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, CreditCard, ArrowRight, ArrowLeft, Lock } from 'lucide-react';
import { createEventRegistration, createOrder } from '@/lib/supabase';

interface RegistrationModalProps {
  eventId: number;
  eventTitle: string;
  eventPrice: string;
  paymentUrl?: string;
  liabilityFormUrl?: string;
}

export default function RegistrationModal({
  eventId,
  eventTitle,
  eventPrice,
  paymentUrl,
  liabilityFormUrl
}: RegistrationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Info form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    emergencyName: '',
    emergencyPhone: '',
    dietary: '',
    medical: '',
    acceptWaiver: false
  });

  // Card payment state
  const [paymentData, setPaymentData] = useState({
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  const parsePrice = (priceStr: string): number => {
    const numeric = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    return isNaN(numeric) ? 0 : numeric;
  };

  const isPaidEvent = parsePrice(eventPrice) > 0;

  const validateInfo = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.age.trim()) {
      errors.age = 'Age is required';
    } else if (isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
      errors.age = 'Please enter a valid age';
    }
    if (!formData.emergencyName.trim()) errors.emergencyName = 'Emergency contact name is required';
    if (!formData.emergencyPhone.trim()) errors.emergencyPhone = 'Emergency contact phone is required';
    if (!formData.acceptWaiver) errors.acceptWaiver = 'You must review and accept the liability waiver terms';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePayment = () => {
    const errors: Record<string, string> = {};
    if (!paymentData.cardName.trim()) errors.cardName = 'Cardholder name is required';
    
    const rawCard = paymentData.cardNumber.replace(/\s+/g, '');
    if (!rawCard.trim()) {
      errors.cardNumber = 'Card number is required';
    } else if (rawCard.length !== 16) {
      errors.cardNumber = 'Card must be 16 digits';
    }

    if (!paymentData.cardExpiry.trim()) {
      errors.cardExpiry = 'Expiry is required';
    } else if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(paymentData.cardExpiry)) {
      errors.cardExpiry = 'Format MM/YY required';
    }

    const rawCvv = paymentData.cardCvv.replace(/\D/g, '');
    if (!rawCvv.trim()) {
      errors.cardCvv = 'CVC is required';
    } else if (rawCvv.length < 3 || rawCvv.length > 4) {
      errors.cardCvv = 'Must be 3-4 digits';
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
    if (paymentErrors[name]) {
      setPaymentErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInfo()) return;
    
    if (isPaidEvent) {
      // Set cardholder name default
      setPaymentData(prev => ({ ...prev, cardName: prev.cardName || formData.fullName }));
      setStep('payment');
    } else {
      // Direct submit for free events
      handleSubmitRegistration(null);
    }
  };

  const handleSubmitRegistration = async (e: React.FormEvent | null) => {
    if (e) e.preventDefault();
    
    if (isPaidEvent && !validatePayment()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMessage('Saving registration profile...');

    try {
      // 1. Submit Registration Record
      const regRes = await createEventRegistration({
        event_id: eventId,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        age: formData.age,
        emergency_contact_name: formData.emergencyName,
        emergency_contact_phone: formData.emergencyPhone,
        dietary_restrictions: formData.dietary,
        medical_info: formData.medical,
        status: 'registered'
      });

      if (!regRes.success) {
        setErrorMsg(regRes.message || 'Registration failed.');
        setIsSubmitting(false);
        return;
      }

      // 2. Submit Store Order Record (Linked transaction) if paid event
      if (isPaidEvent) {
        setStatusMessage('Processing secure booking payment...');
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setStatusMessage('Fulfilling event tickets...');
        const orderRef = `event_${eventId}_${Date.now()}`;
        const numericPrice = parsePrice(eventPrice);

        const orderRes = await createOrder({
          order_ref: orderRef,
          customer_name: formData.fullName,
          customer_email: formData.email,
          shipping_address: `Event Registration: ${eventTitle} (Age Limit: ${formData.age})`,
          total_amount: numericPrice,
          status: 'paid',
          items: [
            {
              id: eventId,
              product_title: `${eventTitle} - Gathering Admission`,
              price: eventPrice,
              quantity: 1,
              size: `Attendee: ${formData.fullName}`
            }
          ]
        });

        if (!orderRes.success) {
          console.warn('Registration completed but order log creation failed:', orderRes.message);
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setStep('success');
    } catch (err) {
      console.error('Registration processing error:', err);
      setErrorMsg('A secure connection error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep('info');
      setErrorMsg('');
      setStatusMessage('');
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        age: '',
        emergencyName: '',
        emergencyPhone: '',
        dietary: '',
        medical: '',
        acceptWaiver: false
      });
      setPaymentData({
        cardName: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvv: ''
      });
      setFormErrors({});
      setPaymentErrors({});
    }, 300);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full text-center px-6 py-4 bg-[#6E0B64] text-[#FFEFBF] hover:bg-[#E65C17] rounded-full font-black text-xs tracking-widest uppercase shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-1.5 active:scale-97 cursor-pointer"
      >
        Register for Event
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Blur Background */}
          <div 
            onClick={handleClose}
            className="fixed inset-0 bg-[#1E1D1B]/75 backdrop-blur-sm transition-opacity"
          />

          {/* Secure processing overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-[#6E0B64]/90 backdrop-blur-sm z-50 rounded-[2rem] flex flex-col items-center justify-center text-[#FFEFBF] p-6 text-center select-none">
              <div className="space-y-4 max-w-xs">
                <div className="w-10 h-10 border-4 border-[#FFA526] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <h4 className="font-display text-lg font-black text-[#FFA526]">Securing Booking</h4>
                  <p className="text-xs text-[#FFEFBF]/85 font-light animate-pulse">{statusMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Modal Card */}
          <div className="relative w-full max-w-2xl bg-[#FFEFBF] rounded-[2rem] border border-[#6E0B64]/10 shadow-2xl p-6 sm:p-8 overflow-hidden z-10 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[#6E0B64]/10 flex-shrink-0">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-[#E65C17]">
                  {step === 'payment' ? 'Payment Checkout' : 'Gathering Registration'}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-black text-[#6E0B64] leading-tight mt-0.5">
                  {eventTitle}
                </h3>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-[#6E0B64]/5 rounded-full text-[#1E1D1B]/50 hover:text-[#6E0B64] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto py-5 flex-grow pr-1">
              
              {/* STEP 1: Participant Info */}
              {step === 'info' && (
                <form onSubmit={handleContinueToPayment} className="space-y-5 text-xs text-[#1E1D1B]">
                  {errorMsg && (
                    <div className="bg-[#E65C17]/10 border border-[#E65C17]/25 p-3 rounded-xl flex items-center gap-2 text-[#E65C17]">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span className="font-bold">{errorMsg}</span>
                    </div>
                  )}

                  {/* Price Summary */}
                  <div className="bg-[#6E0B64]/5 border border-[#6E0B64]/10 p-4 rounded-2xl flex justify-between items-center">
                    <span className="font-display font-bold text-sm text-[#6E0B64]">Event Admission Fee</span>
                    <span className="font-display font-black text-lg text-[#E65C17] bg-[#FFEFBF] px-3 py-1.5 rounded-xl border border-[#6E0B64]/10">
                      {eventPrice}
                    </span>
                  </div>

                  {/* Section: Basic Details */}
                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#6E0B64] border-b border-[#6E0B64]/5 pb-1">
                      1. Contact Information
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Participant's name"
                          className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border focus:outline-none focus:border-[#6E0B64] font-sans text-xs ${
                            formErrors.fullName ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                          }`}
                        />
                        {formErrors.fullName && <p className="text-[9px] text-[#E65C17] font-bold">{formErrors.fullName}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="name@example.com"
                          className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border focus:outline-none focus:border-[#6E0B64] font-sans text-xs ${
                            formErrors.email ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                          }`}
                        />
                        {formErrors.email && <p className="text-[9px] text-[#E65C17] font-bold">{formErrors.email}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">Phone Number</label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="e.g. 555-0199"
                          className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border focus:outline-none focus:border-[#6E0B64] font-sans text-xs ${
                            formErrors.phone ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                          }`}
                        />
                        {formErrors.phone && <p className="text-[9px] text-[#E65C17] font-bold">{formErrors.phone}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">Your Age</label>
                        <input
                          type="text"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder="e.g. 21"
                          maxLength={3}
                          className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border focus:outline-none focus:border-[#6E0B64] font-sans text-xs ${
                            formErrors.age ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                          }`}
                        />
                        {formErrors.age && <p className="text-[9px] text-[#E65C17] font-bold">{formErrors.age}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Section: Emergency */}
                  <div className="space-y-4 pt-2">
                    <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#6E0B64] border-b border-[#6E0B64]/5 pb-1">
                      2. Emergency Contact
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">Contact Name</label>
                        <input
                          type="text"
                          name="emergencyName"
                          value={formData.emergencyName}
                          onChange={handleInputChange}
                          placeholder="Emergency contact name"
                          className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border focus:outline-none focus:border-[#6E0B64] font-sans text-xs ${
                            formErrors.emergencyName ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                          }`}
                        />
                        {formErrors.emergencyName && <p className="text-[9px] text-[#E65C17] font-bold">{formErrors.emergencyName}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">Contact Phone</label>
                        <input
                          type="text"
                          name="emergencyPhone"
                          value={formData.emergencyPhone}
                          onChange={handleInputChange}
                          placeholder="Contact phone number"
                          className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border focus:outline-none focus:border-[#6E0B64] font-sans text-xs ${
                            formErrors.emergencyPhone ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                          }`}
                        />
                        {formErrors.emergencyPhone && <p className="text-[9px] text-[#E65C17] font-bold">{formErrors.emergencyPhone}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Section: Dietary */}
                  <div className="space-y-4 pt-2">
                    <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#6E0B64] border-b border-[#6E0B64]/5 pb-1">
                      3. Health & Accommodations
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">Dietary Needs & Food Allergies</label>
                        <textarea
                          name="dietary"
                          value={formData.dietary}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="e.g. Vegetarian, Nut allergy, no onion/garlic, gluten sensitive..."
                          className="w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border border-[#6E0B64]/20 focus:outline-none focus:border-[#6E0B64] font-sans text-xs resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">Medical Details (Optional)</label>
                        <textarea
                          name="medical"
                          value={formData.medical}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="Injuries, asthma, prescription medications, etc."
                          className="w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border border-[#6E0B64]/20 focus:outline-none focus:border-[#6E0B64] font-sans text-xs resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Waiver */}
                  <div className="space-y-3 pt-3 border-t border-[#6E0B64]/10">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="acceptWaiver"
                        name="acceptWaiver"
                        checked={formData.acceptWaiver}
                        onChange={handleCheckboxChange}
                        className="mt-0.5 border-[#6E0B64]/20 text-[#6E0B64] rounded focus:ring-[#6E0B64]"
                      />
                      <label htmlFor="acceptWaiver" className="text-[10px] text-[#1E1D1B]/80 leading-relaxed font-sans font-light">
                        I confirm that all details provided are correct. I agree to Sanga&apos;s code of conduct and safety regulations.
                        {liabilityFormUrl && (
                          <span>
                            {' '}I have read and agree to the{' '}
                            <a 
                              href={liabilityFormUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="underline text-[#6E0B64] font-bold hover:text-[#E65C17]"
                            >
                              Liability Waiver Terms
                            </a>.
                          </span>
                        )}
                      </label>
                    </div>
                    {formErrors.acceptWaiver && (
                      <p className="text-[9px] text-[#E65C17] font-bold">{formErrors.acceptWaiver}</p>
                    )}
                  </div>

                  {/* Continue Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-4 bg-[#6E0B64] hover:bg-[#E65C17] text-[#FFEFBF] font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all transform active:scale-97 cursor-pointer flex items-center justify-center gap-2 text-xs"
                    >
                      {isPaidEvent ? 'Continue to Secure Payment' : 'Complete Registration'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Secure Payment */}
              {step === 'payment' && (
                <form onSubmit={handleSubmitRegistration} className="space-y-5 text-xs text-[#1E1D1B]">
                  
                  {/* Event summary details */}
                  <div className="bg-[#6E0B64]/5 border border-[#6E0B64]/10 p-5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-plum/60">Ticket Item:</span>
                      <span className="font-bold text-plum">{eventTitle}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-[#6E0B64]/5 pt-2">
                      <span className="font-bold text-plum/60">Registrant:</span>
                      <span className="font-bold text-plum">{formData.fullName} ({formData.email})</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-[#6E0B64]/10 pt-2 font-display text-plum font-black">
                      <span>Total Amount Due</span>
                      <span className="text-[#E65C17] text-lg bg-[#FFEFBF] px-3 py-1 border border-[#6E0B64]/10 rounded-xl">{eventPrice}</span>
                    </div>
                  </div>

                  {/* Mock Payment form */}
                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#6E0B64] border-b border-[#6E0B64]/5 pb-1">
                      Billing Information
                    </h4>

                    {/* Cardholder name */}
                    <div className="space-y-1">
                      <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">Cardholder Name</label>
                      <input
                        type="text"
                        name="cardName"
                        value={paymentData.cardName}
                        onChange={handlePaymentInputChange}
                        placeholder="Name on card"
                        className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border focus:outline-none focus:border-[#6E0B64] font-sans text-xs ${
                          paymentErrors.cardName ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                        }`}
                      />
                      {paymentErrors.cardName && <p className="text-[9px] text-[#E65C17] font-bold">{paymentErrors.cardName}</p>}
                    </div>

                    {/* Card number */}
                    <div className="space-y-1">
                      <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentData.cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                          const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                          setPaymentData(prev => ({ ...prev, cardNumber: formatted }));
                          if (paymentErrors.cardNumber) setPaymentErrors(prev => ({ ...prev, cardNumber: '' }));
                        }}
                        placeholder="4111 2222 3333 4444"
                        className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border focus:outline-none focus:border-[#6E0B64] font-sans text-xs ${
                          paymentErrors.cardNumber ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                        }`}
                      />
                      {paymentErrors.cardNumber && <p className="text-[9px] text-[#E65C17] font-bold">{paymentErrors.cardNumber}</p>}
                    </div>

                    {/* Expiry & CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">Expiration MM/YY</label>
                        <input
                          type="text"
                          name="cardExpiry"
                          value={paymentData.cardExpiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '').substring(0, 4);
                            if (val.length > 2) {
                              val = val.substring(0, 2) + '/' + val.substring(2);
                            }
                            setPaymentData(prev => ({ ...prev, cardExpiry: val }));
                            if (paymentErrors.cardExpiry) setPaymentErrors(prev => ({ ...prev, cardExpiry: '' }));
                          }}
                          placeholder="MM/YY"
                          className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border focus:outline-none focus:border-[#6E0B64] font-sans text-xs ${
                            paymentErrors.cardExpiry ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                          }`}
                        />
                        {paymentErrors.cardExpiry && <p className="text-[9px] text-[#E65C17] font-bold">{paymentErrors.cardExpiry}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">CVC / CVV</label>
                        <input
                          type="text"
                          name="cardCvv"
                          value={paymentData.cardCvv}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').substring(0, 4);
                            setPaymentData(prev => ({ ...prev, cardCvv: val }));
                            if (paymentErrors.cardCvv) setPaymentErrors(prev => ({ ...prev, cardCvv: '' }));
                          }}
                          placeholder="123"
                          className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border focus:outline-none focus:border-[#6E0B64] font-sans text-xs ${
                            paymentErrors.cardCvv ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                          }`}
                        />
                        {paymentErrors.cardCvv && <p className="text-[9px] text-[#E65C17] font-bold">{paymentErrors.cardCvv}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Trust indicator */}
                  <div className="flex items-center justify-center gap-1.5 text-[9px] text-[#1E1D1B]/50 font-light pt-2">
                    <Lock className="h-3 w-3 text-[#66CC6E]" /> Secure SSL Encrypted checkout simulated.
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('info')}
                      className="flex-1 py-3.5 border border-[#6E0B64]/20 hover:border-[#6E0B64] text-[#6E0B64] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer bg-[#FFEFBF] flex items-center justify-center gap-2 text-[10px]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Profile
                    </button>
                    
                    <button
                      type="submit"
                      className="flex-2 py-3.5 bg-[#6E0B64] hover:bg-[#E65C17] text-[#FFEFBF] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all transform active:scale-97 cursor-pointer flex items-center justify-center gap-2 text-[10px]"
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Pay & Complete Registration
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Success Screen */}
              {step === 'success' && (
                <div className="text-center py-6 px-4 space-y-6 text-[#1E1D1B]">
                  <div className="w-14 h-14 bg-[#66CC6E]/10 border border-[#66CC6E]/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="h-8 w-8 text-[#66CC6E]" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-[#E65C17] font-black font-sans">
                      Booking Confirmed
                    </span>
                    <h4 className="font-display text-2xl font-black text-[#6E0B64]">
                      You&apos;re Registered!
                    </h4>
                    <p className="text-xs text-[#1E1D1B]/70 font-light max-w-md mx-auto leading-relaxed pt-1">
                      Thanks, <span className="font-bold text-[#6E0B64]">{formData.fullName}</span>! Your registration and secure payment for <span className="font-bold text-[#6E0B64]">{eventTitle}</span> has been processed successfully.
                    </p>
                  </div>

                  {/* Summary details card */}
                  <div className="bg-[#6E0B64]/5 border border-[#6E0B64]/10 rounded-2xl p-5 max-w-md mx-auto text-left space-y-3">
                    <h5 className="font-display font-bold uppercase text-[9px] tracking-wider text-[#6E0B64]">
                      Receipt & details
                    </h5>
                    <ul className="space-y-2.5 text-[11px] font-sans font-light text-[#1E1D1B]/85">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#66CC6E] flex-shrink-0 mt-0.5" />
                        <span>Registration ticket saved under your profile.</span>
                      </li>
                      {isPaidEvent && (
                        <li className="flex items-start gap-2">
                          <CreditCard className="h-4 w-4 text-[#66CC6E] flex-shrink-0 mt-0.5" />
                          <span>Admission charge of <strong>{eventPrice}</strong> billed securely to card.</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 text-[#66CC6E] flex-shrink-0 mt-0.5" />
                        <span>Confirmation email with travel guidelines sent to <strong>{formData.email}</strong>.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 max-w-xs mx-auto">
                    <button
                      onClick={handleClose}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-3.5 border border-[#6E0B64]/20 hover:border-[#6E0B64] text-[#6E0B64] font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer bg-[#FFEFBF] text-center"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
