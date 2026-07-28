export const BD_DISTRICTS: { district: string; division: string }[] = [
  { district: 'Dhaka', division: 'Dhaka' },
  { district: 'Chittagong', division: 'Chittagong' },
  { district: 'Khulna', division: 'Khulna' },
  { district: 'Rajshahi', division: 'Rajshahi' },
  { district: 'Sylhet', division: 'Sylhet' },
  { district: 'Barisal', division: 'Barisal' },
  { district: 'Rangpur', division: 'Rangpur' },
  { district: 'Mymensingh', division: 'Mymensingh' },
  { district: 'Comilla', division: 'Chittagong' },
  { district: 'Narayanganj', division: 'Dhaka' },
  { district: 'Gazipur', division: 'Dhaka' },
  { district: 'Narsingdi', division: 'Dhaka' },
  { district: 'Manikganj', division: 'Dhaka' },
  { district: 'Munshiganj', division: 'Dhaka' },
  { district: 'Faridpur', division: 'Dhaka' },
  { district: 'Madaripur', division: 'Dhaka' },
  { district: 'Gopalganj', division: 'Dhaka' },
  { district: 'Tangail', division: 'Dhaka' },
  { district: 'Kishoreganj', division: 'Dhaka' },
  { district: 'Sherpur', division: 'Mymensingh' },
  { district: 'Jamalpur', division: 'Mymensingh' },
  { district: 'Netrokona', division: 'Mymensingh' },
  { district: 'Bogra', division: 'Rajshahi' },
  { district: 'Pabna', division: 'Rajshahi' },
  { district: 'Sirajganj', division: 'Rajshahi' },
  { district: 'Natore', division: 'Rajshahi' },
  { district: 'Nawabganj', division: 'Rajshahi' },
  { district: 'Naogaon', division: 'Rajshahi' },
  { district: 'Joypurhat', division: 'Rajshahi' },
  { district: 'Dinajpur', division: 'Rangpur' },
  { district: 'Thakurgaon', division: 'Rangpur' },
  { district: 'Panchagarh', division: 'Rangpur' },
  { district: 'Nilphamari', division: 'Rangpur' },
  { district: 'Kurigram', division: 'Rangpur' },
  { district: 'Lalmonirhat', division: 'Rangpur' },
  { district: 'Gaibandha', division: 'Rangpur' },
  { district: 'Jashore', division: 'Khulna' },
  { district: 'Satkhira', division: 'Khulna' },
  { district: 'Magura', division: 'Khulna' },
  { district: 'Narail', division: 'Khulna' },
  { district: 'Jhenaidah', division: 'Khulna' },
  { district: 'Chuadanga', division: 'Khulna' },
  { district: 'Kushtia', division: 'Khulna' },
  { district: 'Meherpur', division: 'Khulna' },
  { district: 'Bagerhat', division: 'Khulna' },
  { district: 'Jhalokati', division: 'Barisal' },
  { district: 'Patuakhali', division: 'Barisal' },
  { district: 'Pirojpur', division: 'Barisal' },
  { district: 'Barguna', division: 'Barisal' },
  { district: 'Bhola', division: 'Barisal' },
  { district: 'Habiganj', division: 'Sylhet' },
  { district: 'Moulvibazar', division: 'Sylhet' },
  { district: 'Sunamganj', division: 'Sylhet' },
  { district: 'Cox\'s Bazar', division: 'Chittagong' },
  { district: 'Feni', division: 'Chittagong' },
  { district: 'Brahmanbaria', division: 'Chittagong' },
  { district: 'Chandpur', division: 'Chittagong' },
  { district: 'Noakhali', division: 'Chittagong' },
  { district: 'Lakshmipur', division: 'Chittagong' },
  { district: 'Rangamati', division: 'Chittagong' },
  { district: 'Khagrachari', division: 'Chittagong' },
  { district: 'Bandarban', division: 'Chittagong' },
]

export const SHIPPING_RATES: Record<string, number> = {
  Dhaka: 60,
  'Narayanganj': 60,
  'Gazipur': 60,
  'Narsingdi': 60,
  'Manikganj': 80,
  'Munshiganj': 80,
  'Tangail': 80,
  'Kishoreganj': 80,
  'Faridpur': 100,
  'Madaripur': 100,
  'Gopalganj': 100,
}

export function getShippingCost(district: string): number {
  if (SHIPPING_RATES[district] !== undefined) return SHIPPING_RATES[district]
  return 120
}

export const FREE_SHIPPING_THRESHOLD = 3000

export const PAYMENT_METHODS = [
  { id: 'bkash', name: 'bKash', description: 'Pay with bKash mobile wallet', icon: '📱' },
  { id: 'nagad', name: 'Nagad', description: 'Pay with Nagad mobile wallet', icon: '💰' },
  { id: 'card', name: 'Card', description: 'Visa / Mastercard / Amex', icon: '💳' },
  { id: 'cod', name: 'Cash on Delivery', description: 'Pay when you receive your order', icon: '🚚' },
] as const

export function formatBDT(amount: number): string {
  return '৳' + amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
