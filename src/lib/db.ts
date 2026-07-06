// Mock database engine for Bookze, persisting data to localStorage for local demonstrability

export interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  phone: string;
  description: string;
  city: string;
  logoUrl?: string;
  coverUrl?: string;
  workingHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  plan: 'free' | 'growth' | 'pro';
  planStatus?: 'active' | 'cancelled' | 'past_due';
  planExpiresAt?: string | null;
  razorpaySubscriptionId?: string | null;
  metaWabaId?: string;
  metaPhoneNumberId?: string;
  metaPermanentToken?: string;
  googleMapsUrl?: string | null;
  reviewsCount: number;
  rating: number;
}


export interface Service {
  id: string;
  businessId: string;
  name: string;
  price: number; // in INR
  duration: number; // in minutes
  description: string;
  category: string;
  active: boolean;
  photoUrl?: string;
}

export interface Staff {
  id: string;
  businessId: string;
  name: string;
  role: string;
  photoUrl?: string;
  rating: number;
  services?: Service[];
}

export interface Booking {
  id: string;
  businessId: string;
  serviceId: string;
  staffId?: string;
  customerName: string;
  customerPhone: string;
  bookingTime: string; // ISO string
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  bookingSource: 'whatsapp_link' | 'chatbot' | 'manual';
  notes?: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  businessId: string;
  eventType: 'page_view' | 'book_now_click' | 'booking_created';
  timestamp: string; // ISO string
}

// Pre-seeded Data
const DEFAULT_BUSINESSES: Business[] = [
  {
    id: 'b1',
    name: "Priya's Premium Salon",
    slug: 'priyas-salon',
    category: 'Salons & Beauty Parlours',
    phone: '+919876543210',
    city: 'Noida, Sector 18',
    description: 'Transform your look with premium hair styling, facial treatments, and makeups by certified professionals.',
    rating: 4.8,
    reviewsCount: 124,
    plan: 'pro',
    workingHours: {
      monday: { open: '10:00', close: '20:00', closed: false },
      tuesday: { open: '10:00', close: '20:00', closed: false },
      wednesday: { open: '10:00', close: '20:00', closed: false },
      thursday: { open: '10:00', close: '20:00', closed: false },
      friday: { open: '10:00', close: '21:00', closed: false },
      saturday: { open: '09:00', close: '21:00', closed: false },
      sunday: { open: '09:00', close: '21:00', closed: false }
    }
  },
  {
    id: 'b2',
    name: 'Flex Fitness Club',
    slug: 'flex-fitness',
    category: 'Gyms & Yoga Studios',
    phone: '+919998887776',
    city: 'Indiranagar, Bangalore',
    description: 'Achieve your health goals with state-of-the-art equipment, dynamic group classes, and personal trainer consultations.',
    rating: 4.7,
    reviewsCount: 88,
    plan: 'growth',
    workingHours: {
      monday: { open: '06:00', close: '22:00', closed: false },
      tuesday: { open: '06:00', close: '22:00', closed: false },
      wednesday: { open: '06:00', close: '22:00', closed: false },
      thursday: { open: '06:00', close: '22:00', closed: false },
      friday: { open: '06:00', close: '22:00', closed: false },
      saturday: { open: '07:00', close: '20:00', closed: false },
      sunday: { open: '07:00', close: '13:00', closed: false }
    }
  }
];

const DEFAULT_SERVICES: Service[] = [
  // Priya's Salon Services
  {
    id: 's1',
    businessId: 'b1',
    name: 'Haircut & Blow Dry',
    price: 499,
    duration: 45,
    description: 'Expert styling, wash, blow-dry, and styling tips from senior stylists.',
    category: 'Hair Care',
    active: true
  },
  {
    id: 's2',
    businessId: 'b1',
    name: 'Hydra Facial Treatment',
    price: 1499,
    duration: 60,
    description: 'Deep cleansing, exfoliation, extraction, hydration, and antioxidant protection.',
    category: 'Skincare',
    active: true
  },
  {
    id: 's3',
    businessId: 'b1',
    name: 'Bridal Makeover',
    price: 8999,
    duration: 180,
    description: 'Complete high-definition bridal makeup including hair styling and draping.',
    category: 'Makeup',
    active: true
  },
  {
    id: 's4',
    businessId: 'b1',
    name: 'Keratin Hair Spa',
    price: 1999,
    duration: 90,
    description: 'Keratin smoothing therapy for dry, frizzy, or damaged hair.',
    category: 'Hair Care',
    active: true
  },
  {
    id: 's5',
    businessId: 'b1',
    name: 'Classic Manicure & Pedicure',
    price: 899,
    duration: 60,
    description: 'Nail shaping, cuticle care, scrub, massage, and polish.',
    category: 'Nail Care',
    active: true
  },

  // Flex Fitness Gym Services
  {
    id: 's6',
    businessId: 'b2',
    name: '1-on-1 Personal Training Session',
    price: 799,
    duration: 60,
    description: 'Customized workout routine guided by our certified expert trainers.',
    category: 'Personal Training',
    active: true
  },
  {
    id: 's7',
    businessId: 'b2',
    name: 'Yoga & Pilates Group Class',
    price: 299,
    duration: 60,
    description: 'Mindfulness, flexibility, and core strength development in a group setting.',
    category: 'Group Classes',
    active: true
  }
];

const DEFAULT_STAFF: Staff[] = [
  {
    id: 'st1',
    businessId: 'b1',
    name: 'Priya Sharma',
    role: 'Master Stylist / Founder',
    rating: 4.9
  },
  {
    id: 'st2',
    businessId: 'b1',
    name: 'Amit Kumar',
    role: 'Skincare Specialist',
    rating: 4.7
  },
  {
    id: 'st3',
    businessId: 'b2',
    name: 'Coach Vikram',
    role: 'Strength Trainer',
    rating: 4.8
  }
];

// Seed some historic and upcoming bookings
const DEFAULT_BOOKINGS: Booking[] = (() => {
  const list: Booking[] = [];
  const now = new Date();
  
  // Confirmed upcoming booking (tomorrow)
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);
  
  list.push({
    id: 'bk1',
    businessId: 'b1',
    serviceId: 's1', // Haircut
    staffId: 'st1',
    customerName: 'Rohan Verma',
    customerPhone: '+919988776655',
    bookingTime: tomorrow.toISOString(),
    price: 499,
    status: 'confirmed',
    bookingSource: 'chatbot',
    notes: 'Needs layer-cut styling',
    createdAt: new Date().toISOString()
  });

  // Pending booking (today evening)
  const todayEvening = new Date(now);
  todayEvening.setHours(17, 30, 0, 0);
  list.push({
    id: 'bk2',
    businessId: 'b1',
    serviceId: 's2', // Facial
    staffId: 'st2',
    customerName: 'Pooja Singh',
    customerPhone: '+918877665544',
    bookingTime: todayEvening.toISOString(),
    price: 1499,
    status: 'pending',
    bookingSource: 'whatsapp_link',
    createdAt: new Date().toISOString()
  });

  // Completed booking (yesterday)
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(14, 0, 0, 0);
  list.push({
    id: 'bk3',
    businessId: 'b1',
    serviceId: 's4', // Keratin Spa
    staffId: 'st1',
    customerName: 'Kirti Sen',
    customerPhone: '+917766554433',
    bookingTime: yesterday.toISOString(),
    price: 1999,
    status: 'completed',
    bookingSource: 'chatbot',
    createdAt: yesterday.toISOString()
  });

  // No-show booking (2 days ago)
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  twoDaysAgo.setHours(16, 0, 0, 0);
  list.push({
    id: 'bk4',
    businessId: 'b1',
    serviceId: 's1',
    staffId: 'st1',
    customerName: 'Harsh Patel',
    customerPhone: '+919654321098',
    bookingTime: twoDaysAgo.toISOString(),
    price: 499,
    status: 'no_show',
    bookingSource: 'whatsapp_link',
    createdAt: twoDaysAgo.toISOString()
  });

  return list;
})();

const DEFAULT_ANALYTICS = (): AnalyticsEvent[] => {
  const events: AnalyticsEvent[] = [];
  const now = new Date();
  
  // Seed past 7 days of views and bookings
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    // Priya's salon views (e.g. between 10 and 25 views per day)
    const viewsCount = Math.floor(Math.random() * 15) + 10;
    for (let v = 0; v < viewsCount; v++) {
      events.push({
        id: `ev-view-${i}-${v}`,
        businessId: 'b1',
        eventType: 'page_view',
        timestamp: new Date(date.getTime() - Math.random() * 36000000).toISOString()
      });
    }

    // Book now clicks (e.g. between 3 and 10 per day)
    const clicksCount = Math.floor(Math.random() * 7) + 3;
    for (let c = 0; c < clicksCount; c++) {
      events.push({
        id: `ev-click-${i}-${c}`,
        businessId: 'b1',
        eventType: 'book_now_click',
        timestamp: new Date(date.getTime() - Math.random() * 36000000).toISOString()
      });
    }
  }
  return events;
};

// Database class implementing storage and utilities
class LocalDB {
  private isClient = typeof window !== 'undefined';

  private getStorage<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue;
    try {
      const data = localStorage.getItem(`bookzy_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    if (!this.isClient) return;
    try {
      localStorage.setItem(`bookzy_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage write error', e);
    }
  }

  getBusinesses(): Business[] {
    return this.getStorage<Business[]>('businesses', DEFAULT_BUSINESSES);
  }

  getBusinessBySlug(slug: string): Business | undefined {
    return this.getBusinesses().find(b => b.slug === slug);
  }

  getBusinessById(id: string): Business | undefined {
    return this.getBusinesses().find(b => b.id === id);
  }

  saveBusiness(business: Business): void {
    const list = this.getBusinesses();
    const idx = list.findIndex(b => b.id === business.id);
    if (idx >= 0) {
      list[idx] = business;
    } else {
      list.push(business);
    }
    this.setStorage('businesses', list);
  }

  getServices(businessId: string): Service[] {
    return this.getStorage<Service[]>('services', DEFAULT_SERVICES)
      .filter(s => s.businessId === businessId);
  }

  getAllServicesList(): Service[] {
    return this.getStorage<Service[]>('services', DEFAULT_SERVICES);
  }

  saveService(service: Service): void {
    const list = this.getStorage<Service[]>('services', DEFAULT_SERVICES);
    const idx = list.findIndex(s => s.id === service.id);
    if (idx >= 0) {
      list[idx] = service;
    } else {
      list.push(service);
    }
    this.setStorage('services', list);
  }

  deleteService(serviceId: string): void {
    const list = this.getStorage<Service[]>('services', DEFAULT_SERVICES);
    const filtered = list.filter(s => s.id !== serviceId);
    this.setStorage('services', filtered);
  }

  getStaff(businessId: string): Staff[] {
    return this.getStorage<Staff[]>('staff', DEFAULT_STAFF)
      .filter(st => st.businessId === businessId);
  }

  saveStaff(staff: Staff): void {
    const list = this.getStorage<Staff[]>('staff', DEFAULT_STAFF);
    const idx = list.findIndex(st => st.id === staff.id);
    if (idx >= 0) {
      list[idx] = staff;
    } else {
      list.push(staff);
    }
    this.setStorage('staff', list);
  }

  deleteStaff(staffId: string): void {
    const list = this.getStorage<Staff[]>('staff', DEFAULT_STAFF);
    const filtered = list.filter(st => st.id !== staffId);
    this.setStorage('staff', filtered);
  }

  getBookings(businessId: string): Booking[] {
    return this.getStorage<Booking[]>('bookings', DEFAULT_BOOKINGS)
      .filter(b => b.businessId === businessId)
      .sort((a, b) => new Date(b.bookingTime).getTime() - new Date(a.bookingTime).getTime());
  }

  saveBooking(booking: Booking): void {
    const list = this.getStorage<Booking[]>('bookings', DEFAULT_BOOKINGS);
    const idx = list.findIndex(b => b.id === booking.id);
    if (idx >= 0) {
      list[idx] = booking;
    } else {
      list.push(booking);
    }
    this.setStorage('bookings', list);
    
    // Trigger analytical booking created log
    if (idx < 0) {
      this.logEvent(booking.businessId, 'booking_created');
    }
  }

  getAnalytics(businessId: string): AnalyticsEvent[] {
    return this.getStorage<AnalyticsEvent[]>('analytics', DEFAULT_ANALYTICS())
      .filter(e => e.businessId === businessId);
  }

  logEvent(businessId: string, eventType: 'page_view' | 'book_now_click' | 'booking_created'): void {
    if (!this.isClient) return;
    const list = this.getStorage<AnalyticsEvent[]>('analytics', DEFAULT_ANALYTICS());
    list.push({
      id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      businessId,
      eventType,
      timestamp: new Date().toISOString()
    });
    this.setStorage('analytics', list);
  }
}

export const db = new LocalDB();
export default db;
