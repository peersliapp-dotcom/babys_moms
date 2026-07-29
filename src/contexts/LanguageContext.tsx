import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Language = 'en' | 'bn'

type Translations = {
  nav: {
    home: string
    baby: string
    mom: string
    shopAll: string
    about: string
    contact: string
    account: string
    admin: string
    adminDashboard: string
  }
  search: {
    placeholder: string
    searching: string
    suggestions: string
    viewAll: string
    noResults: string
  }
  home: {
    madeWithLove: string
    heroTitle: string
    heroSubtitle: string
    shopCollection: string
    ourStory: string
    featured: string
    shopByCategory: string
    viewAll: string
  }
  product: {
    addToCart: string
    buyNow: string
    outOfStock: string
    lowStock: string
    selectSize: string
    quantity: string
    sizeGuide: string
    reviews: string
    writeReview: string
    description: string
    relatedProducts: string
  }
  cart: {
    title: string
    empty: string
    subtotal: string
    shipping: string
    total: string
    checkout: string
    continueShopping: string
    remove: string
  }
  checkout: {
    title: string
    shipping: string
    payment: string
    review: string
    shippingAddress: string
    fullName: string
    phone: string
    email: string
    addressLine1: string
    city: string
    district: string
    postalCode: string
    orderNotes: string
    paymentMethod: string
    reviewOrder: string
    placeOrder: string
    orderSummary: string
  }
  footer: {
    shop: string
    help: string
    getInTouch: string
    shipping: string
    returns: string
    aboutUs: string
    contactUs: string
    sizeGuide: string
  }
  common: {
    loading: string
    error: string
    success: string
    save: string
    cancel: string
    delete: string
    edit: string
    close: string
    search: string
  }
}

const en: Translations = {
  nav: {
    home: 'Home', baby: 'Baby', mom: 'Mom', shopAll: 'Shop All', about: 'About', contact: 'Contact',
    account: 'Account', admin: 'Admin', adminDashboard: 'Dashboard',
  },
  search: {
    placeholder: 'Search for products...', searching: 'Searching...', suggestions: 'Suggestions',
    viewAll: 'View all results for', noResults: 'No products found. Try a different search.',
  },
  home: {
    madeWithLove: 'Made with love', heroTitle: 'For you & your little one',
    heroSubtitle: 'Premium baby and maternity clothing, crafted with the softest fabrics and the utmost care.',
    shopCollection: 'Shop Collection', ourStory: 'Our Story', featured: 'Featured Products',
    shopByCategory: 'Shop by Category', viewAll: 'View All',
  },
  product: {
    addToCart: 'Add to Cart', buyNow: 'Buy Now', outOfStock: 'Out of Stock', lowStock: 'Only {n} left in stock!',
    selectSize: 'Select Size', quantity: 'Quantity', sizeGuide: 'Size Guide', reviews: 'Customer Reviews',
    writeReview: 'Write a Review', description: 'Description', relatedProducts: 'You May Also Like',
  },
  cart: {
    title: 'Shopping Cart', empty: 'Your cart is empty', subtotal: 'Subtotal', shipping: 'Shipping',
    total: 'Total', checkout: 'Checkout', continueShopping: 'Continue Shopping', remove: 'Remove',
  },
  checkout: {
    title: 'Checkout', shipping: 'Shipping', payment: 'Payment', review: 'Review',
    shippingAddress: 'Shipping Address', fullName: 'Full Name', phone: 'Phone', email: 'Email',
    addressLine1: 'Address Line 1', city: 'City / Area', district: 'District', postalCode: 'Postal Code',
    orderNotes: 'Order Notes (optional)', paymentMethod: 'Payment Method', reviewOrder: 'Review Order',
    placeOrder: 'Place Order', orderSummary: 'Order Summary',
  },
  footer: {
    shop: 'Shop', help: 'Help', getInTouch: 'Get in Touch', shipping: 'Shipping & Delivery',
    returns: 'Returns & Exchange', aboutUs: 'About Us', contactUs: 'Contact Us', sizeGuide: 'Size Guide',
  },
  common: {
    loading: 'Loading...', error: 'Error', success: 'Success', save: 'Save', cancel: 'Cancel',
    delete: 'Delete', edit: 'Edit', close: 'Close', search: 'Search',
  },
}

const bn: Translations = {
  nav: {
    home: 'হোম', baby: 'বেবি', mom: 'মা', shopAll: 'সব পণ্য', about: 'আমাদের সম্পর্কে', contact: 'যোগাযোগ',
    account: 'অ্যাকাউন্ট', admin: 'অ্যাডমিন', adminDashboard: 'ড্যাশবোর্ড',
  },
  search: {
    placeholder: 'পণ্য খুঁজুন...', searching: 'খুঁজছি...', suggestions: 'পরামর্শ',
    viewAll: 'সব ফলাফল দেখুন', noResults: 'কোনো পণ্য পাওয়া যায়নি। অন্য কিছু খুঁজে দেখুন।',
  },
  home: {
    madeWithLove: 'ভালোবাসায় তৈরি', heroTitle: 'আপনার এবং আপনার সন্তানের জন্য',
    heroSubtitle: 'প্রিমিয়াম বেবি ও মায়েদের পোশাক, নরম কাপড় ও যত্ন দিয়ে তৈরি।',
    shopCollection: 'কালেকশন দেখুন', ourStory: 'আমাদের গল্প', featured: 'ফিচার্ড পণ্য',
    shopByCategory: 'ক্যাটাগরি অনুযায়ী কিনুন', viewAll: 'সব দেখুন',
  },
  product: {
    addToCart: 'কার্টে যোগ করুন', buyNow: 'এখনই কিনুন', outOfStock: 'স্টকে নেই', lowStock: 'মাত্র {n}টি বাকি!',
    selectSize: 'সাইজ নির্বাচন করুন', quantity: 'পরিমাণ', sizeGuide: 'সাইজ গাইড', reviews: 'কাস্টমার রিভিউ',
    writeReview: 'রিভিউ লিখুন', description: 'বিবরণ', relatedProducts: 'আপনার পছন্দ হতে পারে',
  },
  cart: {
    title: 'শপিং কার্ট', empty: 'আপনার কার্ট খালি', subtotal: 'সাবটোটাল', shipping: 'ডেলিভারি চার্জ',
    total: 'মোট', checkout: 'চেকআউট', continueShopping: 'কেনাকাটা চালিয়ে যান', remove: 'মুছুন',
  },
  checkout: {
    title: 'চেকআউট', shipping: 'শিপিং', payment: 'পেমেন্ট', review: 'রিভিউ',
    shippingAddress: 'শিপিং ঠিকানা', fullName: 'পুরো নাম', phone: 'ফোন', email: 'ইমেইল',
    addressLine1: 'ঠিকানা', city: 'শহর / এলাকা', district: 'জেলা', postalCode: 'পোস্ট কোড',
    orderNotes: 'অর্ডার নোট (ঐচ্ছিক)', paymentMethod: 'পেমেন্ট মেথড', reviewOrder: 'অর্ডার রিভিউ',
    placeOrder: 'অর্ডার দিন', orderSummary: 'অর্ডার সারাংশ',
  },
  footer: {
    shop: 'কেনাকাটা', help: 'সাহায্য', getInTouch: 'যোগাযোগ', shipping: 'শিপিং ও ডেলিভারি',
    returns: 'রিটার্ন ও এক্সচেঞ্জ', aboutUs: 'আমাদের সম্পর্কে', contactUs: 'যোগাযোগ করুন', sizeGuide: 'সাইজ গাইড',
  },
  common: {
    loading: 'লোড হচ্ছে...', error: 'ত্রুটি', success: 'সফল', save: 'সংরক্ষণ', cancel: 'বাতিল',
    delete: 'মুছুন', edit: 'সম্পাদনা', close: 'বন্ধ', search: 'খুঁজুন',
  },
}

type LanguageContextType = {
  lang: Language
  toggleLang: () => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const stored = localStorage.getItem('bm_lang') as Language | null
    return stored ?? 'en'
  })

  useEffect(() => {
    localStorage.setItem('bm_lang', lang)
  }, [lang])

  const toggleLang = () => setLang((prev) => (prev === 'en' ? 'bn' : 'en'))

  const t = (key: string): string => {
    const dict = lang === 'en' ? en : bn
    const parts = key.split('.')
    let result: unknown = dict
    for (const part of parts) {
      if (typeof result === 'object' && result !== null && part in result) {
        result = (result as Record<string, unknown>)[part]
      } else {
        return key
      }
    }
    return typeof result === 'string' ? result : key
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
