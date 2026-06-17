'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Business, Service } from '@/lib/db';
import { Send, Check, CheckCheck, Phone, Video, MoreVertical, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChatbotSimulatorProps {
  business: Business;
  services: Service[];
  onClose: () => void;
  onBookingComplete?: () => void;
  isHindi?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

export default function ChatbotSimulator({ 
  business, 
  services, 
  onClose, 
  onBookingComplete,
  isHindi = false
}: ChatbotSimulatorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<'service' | 'date' | 'time' | 'name' | 'phone' | 'complete'>('service');
  const [isTyping, setIsTyping] = useState(false);
  
  // Selection States
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      const welcomeText = isHindi 
        ? `नमस्ते! *${business.name}* के बुकिंग असिस्टेंट में आपका स्वागत है। 🙏\n\nआप आज क्या बुक करना चाहेंगे? कृपया नीचे दिए गए विकल्पों में से चुनें या नंबर टाइप करें:`
        : `Hi! Welcome to *${business.name}*'s Booking Assistant. 🌸\n\nWhat would you like to book today? Please select from the options below:`;
      
      setMessages([
        {
          id: '1',
          sender: 'bot',
          text: welcomeText,
          timestamp: getFormattedTime()
        }
      ]);
    }, 1000);
    return () => clearTimeout(timer);
  }, [business.name, isHindi]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getFormattedTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const addMessage = (sender: 'bot' | 'user', text: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender,
      text,
      timestamp: getFormattedTime(),
      status: sender === 'user' ? 'read' : undefined
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const simulateBotReply = (replyText: string, nextStep: any, delay = 1200) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage('bot', replyText);
      setCurrentStep(nextStep);
    }, delay);
  };

  // Step 1: Service Selected
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    addMessage('user', service.name);
    
    const replyText = isHindi
      ? `आपने *${service.name}* (₹${service.price}) चुना है। बहुत बढ़िया!\n\nकृपया अप्वाइंटमेंट के लिए तारीख चुनें:`
      : `You selected *${service.name}* (₹${service.price}). Great choice!\n\nPlease select a date for your appointment:`;
      
    simulateBotReply(replyText, 'date');
  };

  // Step 2: Date Selected
  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    addMessage('user', dateStr);
    
    const replyText = isHindi
      ? `तारीख: *${dateStr}*.\n\nअब कृपया नीचे दिए गए समय स्लॉट में से एक चुनें:`
      : `Date: *${dateStr}*.\n\nNow, please pick an available time slot:`;
      
    simulateBotReply(replyText, 'time');
  };

  // Step 3: Time Selected
  const handleTimeSelect = (timeStr: string) => {
    setSelectedTime(timeStr);
    addMessage('user', timeStr);
    
    const replyText = isHindi
      ? `समय स्लॉट: *${timeStr}*.\n\nबुकिंग पक्की करने के लिए कृपया अपना नाम टाइप करें:`
      : `Time Slot: *${timeStr}*.\n\nAlmost done! Please type your full name to confirm the booking:`;
      
    simulateBotReply(replyText, 'name');
  };

  // Step 4: Name Submitted — collect name then ask for phone
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const nameVal = textInput.trim();
    setCustomerName(nameVal);
    addMessage('user', nameVal);
    setTextInput('');

    const replyText = isHindi
      ? `शुक्रिया, *${nameVal}*! 📱\n\nअब कृपया अपना WhatsApp नंबर टाइप करें ताकि हम आपको रिमाइंडर भेज सकें:\n(उदाहरण: 9876543210)`
      : `Thanks, *${nameVal}*! 📱\n\nNow please enter your WhatsApp phone number so we can send you a reminder:\n(e.g. 9876543210)`;

    simulateBotReply(replyText, 'phone');
  };

  // Step 5: Phone Submitted — validate and create booking via real API
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const phoneVal = textInput.trim().replace(/\s+/g, '');

    // Basic validation: must be 10 digits (or start with + for intl)
    const isValid = /^[+]?[0-9]{10,15}$/.test(phoneVal);
    if (!isValid) {
      addMessage('user', phoneVal);
      setTextInput('');
      simulateBotReply(
        isHindi
          ? '❌ कृपया एक सही फोन नंबर दर्ज करें (10 अंक)।'
          : '❌ Please enter a valid phone number (10 digits).',
        'phone',
        800
      );
      return;
    }

    setCustomerPhone(phoneVal);
    addMessage('user', phoneVal);
    setTextInput('');
    setIsTyping(true);

    // Brief delay so the typing indicator is visible before the API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: selectedService!.id,
          customerName,
          customerPhone: phoneVal,
          bookingTime: getBookingISOTime(selectedDate, selectedTime),
          price: selectedService!.price,
          bookingSource: 'chatbot',
          notes: 'Booked via Pro Chatbot',
        }),
      });

      setIsTyping(false);

      if (!res.ok) {
        let errMsg = isHindi
          ? '❌ माफ़ करें, बुकिंग बनाने में त्रुटि हुई। कृपया दोबारा कोशिश करें।'
          : '❌ Sorry, there was an error creating your booking. Please try again.';
        try {
          const err = await res.json();
          if (err.error) {
            errMsg = `❌ ${err.error}`;
          }
        } catch {}
        addMessage('bot', errMsg);
        setCurrentStep('service');
        return;
      }

      const successText = isHindi
        ? `🎉 *बुकिंग पक्की हो गई है!*\n\n📝 विवरण:\n• *सेवा:* ${selectedService!.name}\n• *तारीख:* ${selectedDate}\n• *समय:* ${selectedTime}\n• *नाम:* ${customerName}\n• *फोन:* ${phoneVal}\n\nधन्यवाद! हम आपको अप्वाइंटमेंट से 2 घंटे पहले व्हाट्सएप पर रिमाइंडर भेजेंगे।`
        : `🎉 *Booking Confirmed!*\n\n📝 Details:\n• *Service:* ${selectedService!.name}\n• *Date:* ${selectedDate}\n• *Time:* ${selectedTime}\n• *Name:* ${customerName}\n• *Phone:* ${phoneVal}\n\nWe look forward to seeing you. A WhatsApp reminder will be sent 2 hours prior!`;

      addMessage('bot', successText);
      setCurrentStep('complete');

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });

      if (onBookingComplete) {
        onBookingComplete();
      }
    } catch {
      setIsTyping(false);
      addMessage('bot', isHindi
        ? '❌ नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें और दोबारा कोशिश करें।'
        : '❌ Network error. Please check your connection and try again.');
    }
  };

  const getBookingISOTime = (dateString: string, timeString: string): string => {
    const today = new Date();
    let targetDate = new Date(today);
    
    if (dateString.includes('Tomorrow') || dateString.includes('कल')) {
      targetDate.setDate(today.getDate() + 1);
    } else if (!dateString.includes('Today') && !dateString.includes('आज')) {
      // Parse day count
      const match = dateString.match(/\d+/);
      if (match) {
        const diff = parseInt(match[0]) - today.getDate();
        if (diff > 0) targetDate.setDate(today.getDate() + diff);
      }
    }
    
    // Parse time
    const [hoursStr, minutesPart] = timeString.split(':');
    let hours = parseInt(hoursStr);
    const minutes = parseInt(minutesPart.substring(0, 2));
    if (timeString.toLowerCase().includes('pm') && hours < 12) hours += 12;
    if (timeString.toLowerCase().includes('am') && hours === 12) hours = 0;
    
    targetDate.setHours(hours, minutes, 0, 0);
    return targetDate.toISOString();
  };

  const getQuickDates = () => {
    const dates = [];
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
    
    // Add today
    dates.push(isHindi ? `आज (Today, ${formatter.format(today)})` : `Today (${formatter.format(today)})`);
    
    // Add tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    dates.push(isHindi ? `कल (Tomorrow, ${formatter.format(tomorrow)})` : `Tomorrow (${formatter.format(tomorrow)})`);
    
    // Add day after tomorrow
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 2);
    dates.push(formatter.format(nextDay));

    return dates;
  };

  const getQuickSlots = () => {
    return ['11:00 AM', '2:30 PM', '4:00 PM', '5:30 PM'];
  };

  return (
    <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 1000, width: '380px', height: '550px', background: '#ece5dd', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #c2b9b0' }}>
      
      {/* WhatsApp Header */}
      <div style={{ background: '#075e54', color: 'white', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#fff', color: '#075e54', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', overflow: 'hidden' }}>
          {business.name.substring(0, 2).toUpperCase()}
        </div>
        
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{business.name}</h4>
          <span style={{ fontSize: '0.7rem', color: '#90dfc6', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isTyping ? (
              <em style={{ animation: 'pulse 1s infinite' }}>{isHindi ? 'टाइप कर रहा है...' : 'typing...'}</em>
            ) : (
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#25d366' }}></span>
            )}
            {!isTyping && (isHindi ? 'ऑनलाइन' : 'online')}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', color: '#e5e7eb' }}>
          <Phone size={18} style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          <Video size={18} style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Message Screen Area */}
      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover' }}>
        
        {/* Encrypted Notice */}
        <div style={{ alignSelf: 'center', background: '#ffeec9', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', textAlign: 'center', border: '1px solid #f9ebbe', color: '#564c3c', maxWidth: '85%' }}>
          🔒 {isHindi ? 'मैसेज एन्ड-टू-एन्ड एन्क्रिप्टेड हैं। बुकजी बॉट द्वारा संचालित।' : 'Messages are end-to-end encrypted. Secured by Bookze Bot.'}
        </div>

        {messages.map(msg => (
          <div 
            key={msg.id} 
            style={{ 
              alignSelf: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
              background: msg.sender === 'bot' ? '#ffffff' : '#dcf8c6',
              color: '#303030',
              padding: '0.6rem 0.8rem',
              borderRadius: msg.sender === 'bot' ? '0px 10px 10px 10px' : '10px 0px 10px 10px',
              maxWidth: '80%',
              boxShadow: '0 1px 1.5px rgba(0,0,0,0.15)',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              position: 'relative'
            }}
          >
            {/* Bold parsing support */}
            {msg.text.split('*').map((chunk, idx) => (
              idx % 2 === 1 ? <strong key={idx}>{chunk}</strong> : chunk
            ))}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: '#909090', marginTop: '0.25rem' }}>
              <span>{msg.timestamp}</span>
              {msg.sender === 'user' && (
                <CheckCheck size={12} style={{ color: '#4fc3f7' }} />
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ alignSelf: 'flex-start', background: '#ffffff', color: '#303030', padding: '0.6rem 1rem', borderRadius: '0 10px 10px 10px', maxWidth: '30%', boxShadow: '0 1px 1.5px rgba(0,0,0,0.15)', fontSize: '0.875rem' }}>
            <span style={{ display: 'inline-flex', gap: '4px' }}>
              <span className="dot" style={{ animation: 'bounce 1.4s infinite both' }}>●</span>
              <span className="dot" style={{ animation: 'bounce 1.4s infinite both 0.2s' }}>●</span>
              <span className="dot" style={{ animation: 'bounce 1.4s infinite both 0.4s' }}>●</span>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Input / Options Board */}
      <div style={{ background: '#f4f0ec', borderTop: '1px solid #d4d0cc', padding: '0.75rem' }}>
        
        {/* Service Options */}
        {currentStep === 'service' && !isTyping && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, paddingLeft: '2px' }}>
              {isHindi ? 'एक सेवा चुनें:' : 'Select a service:'}
            </span>
            {services.filter(s => s.active).map(service => (
              <button 
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem 0.8rem', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}
                className="chatbot-btn-option"
              >
                <strong>{service.name}</strong>
                <span style={{ color: '#075e54', fontWeight: 600 }}>₹{service.price}</span>
              </button>
            ))}
          </div>
        )}

        {/* Date Options */}
        {currentStep === 'date' && !isTyping && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ width: '100%', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, paddingLeft: '2px' }}>
              {isHindi ? 'तारीख चुनें:' : 'Select a date:'}
            </span>
            {getQuickDates().map((dateStr, idx) => (
              <button 
                key={idx}
                onClick={() => handleDateSelect(dateStr)}
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 550, color: '#303030' }}
                className="chatbot-btn-option"
              >
                {dateStr}
              </button>
            ))}
          </div>
        )}

        {/* Time Slot Options */}
        {currentStep === 'time' && !isTyping && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ width: '100%', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, paddingLeft: '2px' }}>
              {isHindi ? 'समय स्लॉट चुनें:' : 'Select slot:'}
            </span>
            {getQuickSlots().map((timeStr, idx) => (
              <button 
                key={idx}
                onClick={() => handleTimeSelect(timeStr)}
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 550, color: '#075e54' }}
                className="chatbot-btn-option"
              >
                {timeStr}
              </button>
            ))}
          </div>
        )}

        {/* Name Input Bar */}
        {currentStep === 'name' ? (
          <form onSubmit={handleNameSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder={isHindi ? "अपना नाम यहाँ टाइप करें..." : "Type your full name..."}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: '20px', border: '1px solid #d4d0cc', background: 'white', fontSize: '0.9rem', outline: 'none' }}
              autoFocus
            />
            <button 
              type="submit" 
              style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#075e54', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
            >
              <Send size={16} />
            </button>
          </form>
        ) : currentStep === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input 
              type="tel" 
              placeholder={isHindi ? "WhatsApp नंबर (जैसे 9876543210)" : "WhatsApp number (e.g. 9876543210)"}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: '20px', border: '1px solid #25d366', background: 'white', fontSize: '0.9rem', outline: 'none' }}
              autoFocus
              inputMode="tel"
            />
            <button 
              type="submit" 
              style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#075e54', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
            >
              <Send size={16} />
            </button>
          </form>
        ) : (
          /* Standard placeholder when choices are presented */
          currentStep !== 'complete' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', opacity: 0.5 }}>
              <input 
                type="text" 
                placeholder={isHindi ? "ऊपर दिए गए विकल्पों में से चुनें..." : "Select from options above..."}
                disabled 
                style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: '20px', border: '1px solid #d4d0cc', background: '#e4e0dc', fontSize: '0.9rem', outline: 'none', cursor: 'not-allowed' }}
              />
              <button disabled style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: '#cbd5e1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'not-allowed' }}>
                <Send size={16} />
              </button>
            </div>
          )
        )}

        {/* Reset / Finish Button */}
        {currentStep === 'complete' && (
          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={() => {
                setCurrentStep('service');
                setSelectedService(null);
                setSelectedDate('');
                setSelectedTime('');
                setCustomerName('');
                setMessages([
                  {
                    id: 'restart',
                    sender: 'bot',
                    text: isHindi ? 'एक नई बुकिंग करने के लिए सेवा चुनें:' : 'Restarting! Please select a service to book again:',
                    timestamp: getFormattedTime()
                  }
                ]);
              }}
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
            >
              {isHindi ? 'फिर से बुक करें' : 'Book Another Session'}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
        .dot {
          display: inline-block;
          font-size: 8px;
          color: #909090;
        }
        .chatbot-btn-option:hover {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
        }
      `}</style>
    </div>
  );
}
