'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, User, Mail, Phone, Calendar, AlertTriangle, ShieldCheck, CreditCard } from 'lucide-react';
import { createEventRegistration } from '@/lib/supabase';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validate = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await createEventRegistration({
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

      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(res.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration submit error:', err);
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset form after exit transitions complete
    setTimeout(() => {
      setIsSuccess(false);
      setErrorMsg('');
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
      setFormErrors({});
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

          {/* Modal Card */}
          <div className="relative w-full max-w-2xl bg-[#FFEFBF] rounded-[2rem] border border-[#6E0B64]/10 shadow-2xl p-6 sm:p-8 overflow-hidden z-10 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[#6E0B64]/10 flex-shrink-0">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-[#E65C17]">
                  Gathering Registration
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
            <div className="overflow-y-auto py-5 flex-grow pr-1 space-y-6">
              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-5 text-xs text-[#1E1D1B]">
                  {errorMsg && (
                    <div className="bg-[#E65C17]/10 border border-[#E65C17]/25 p-3 rounded-xl flex items-center gap-2 text-[#E65C17]">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span className="font-bold">{errorMsg}</span>
                    </div>
                  )}

                  {/* Price Banner */}
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
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border focus:outline-none focus:border-[#6E0B64] font-sans text-xs ${
                            formErrors.fullName ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                          }`}
                        />
                        {formErrors.fullName && <p className="text-[9px] text-[#E65C17] font-bold">{formErrors.fullName}</p>}
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">
                          Email Address
                        </label>
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

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">
                          Phone Number
                        </label>
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

                      {/* Age */}
                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">
                          Your Age
                        </label>
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
                      {/* Emergency Contact Name */}
                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">
                          Contact Name
                        </label>
                        <input
                          type="text"
                          name="emergencyName"
                          value={formData.emergencyName}
                          onChange={handleInputChange}
                          placeholder="Guardian/Spouse/Parent name"
                          className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border focus:outline-none focus:border-[#6E0B64] font-sans text-xs ${
                            formErrors.emergencyName ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                          }`}
                        />
                        {formErrors.emergencyName && <p className="text-[9px] text-[#E65C17] font-bold">{formErrors.emergencyName}</p>}
                      </div>

                      {/* Emergency Contact Phone */}
                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">
                          Contact Phone
                        </label>
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

                  {/* Section: Dietary & Medical */}
                  <div className="space-y-4 pt-2">
                    <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#6E0B64] border-b border-[#6E0B64]/5 pb-1">
                      3. Health & Accommodations
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Dietary Restrictions */}
                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">
                          Dietary Needs & Food Allergies
                        </label>
                        <textarea
                          name="dietary"
                          value={formData.dietary}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="e.g. Vegetarian, Gluten-free, no peanuts, dairy sensitivity, no onion/garlic, etc."
                          className="w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border border-[#6E0B64]/20 focus:outline-none focus:border-[#6E0B64] font-sans text-xs resize-none"
                        />
                      </div>

                      {/* Medical Accommodations */}
                      <div className="space-y-1">
                        <label className="uppercase tracking-widest font-black text-[9px] text-[#6E0B64]/70">
                          Medical Accommodations / Important Info (Optional)
                        </label>
                        <textarea
                          name="medical"
                          value={formData.medical}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="Any details organizers should know (injuries, medications, asthma, etc.)"
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
                        I confirm that all details provided are correct. I agree to comply with Sanga&apos;s code of conduct and safety regulations during the gathering.
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

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-[#6E0B64] hover:bg-[#E65C17] disabled:bg-[#6E0B64]/40 text-[#FFEFBF] font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all transform active:scale-97 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#FFEFBF] border-t-transparent rounded-full animate-spin"></div>
                          Submitting Application...
                        </>
                      ) : (
                        'Submit Event Registration'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Success Screen */
                <div className="text-center py-6 px-4 space-y-6 text-[#1E1D1B]">
                  <div className="w-14 h-14 bg-[#66CC6E]/10 border border-[#66CC6E]/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="h-8 w-8 text-[#66CC6E]" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-[#E65C17] font-black font-sans">
                      Registration Complete
                    </span>
                    <h4 className="font-display text-2xl font-black text-[#6E0B64]">
                      You&apos;re Signed Up!
                    </h4>
                    <p className="text-xs text-[#1E1D1B]/70 font-light max-w-md mx-auto leading-relaxed pt-1">
                      Thank you for registering, <span className="font-bold text-[#6E0B64]">{formData.fullName}</span>. Your application for <span className="font-bold text-[#6E0B64]">{eventTitle}</span> has been logged.
                    </p>
                  </div>

                  {/* Next steps card */}
                  <div className="bg-[#6E0B64]/5 border border-[#6E0B64]/10 rounded-2xl p-5 max-w-md mx-auto text-left space-y-3">
                    <h5 className="font-display font-bold uppercase text-[10px] tracking-wider text-[#6E0B64]">
                      Next Steps
                    </h5>
                    <ul className="space-y-2.5 text-[11px] font-sans font-light text-[#1E1D1B]/85">
                      <li className="flex items-start gap-2">
                        <Mail className="h-3.5 w-3.5 text-[#E65C17] flex-shrink-0 mt-0.5" />
                        <span>A registration receipt will be sent to <strong>{formData.email}</strong>.</span>
                      </li>
                      {paymentUrl && (
                        <li className="flex items-start gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-[#E65C17] flex-shrink-0 mt-0.5" />
                          <span>This gathering requires a registration fee. Click the payment link below to complete your booking.</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#66CC6E] flex-shrink-0 mt-0.5" />
                        <span>Your information is secured. Staff will follow up with schedule details.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                    {paymentUrl && (
                      <a
                        href={paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-3.5 bg-[#6E0B64] hover:bg-[#E65C17] text-[#FFEFBF] font-black text-[10px] uppercase tracking-widest rounded-xl shadow transition-all cursor-pointer text-center"
                      >
                        Make Payment
                      </a>
                    )}
                    <button
                      onClick={handleClose}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-3.5 border border-[#6E0B64]/20 hover:border-[#6E0B64] text-[#6E0B64] font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer bg-[#FFEFBF] text-center"
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
