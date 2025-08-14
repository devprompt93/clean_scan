// Centralized list of South African cities and large towns
// Keep this list sorted alphabetically for easier maintenance
export const SA_CITIES = [
  'Albany',
  'Alberton',
  'Alexandra',
  'Alice',
  'Atlantis',
  'Barberton',
  'Beaufort West',
  'Bellville',
  'Bethal',
  'Bethlehem',
  'Bloemfontein',
  'Bloemhof',
  'Bothaville',
  'Botshabelo',
  'Boksburg',
  'Brakpan',
  'Brits',
  'Cape Town',
  'Caledon',
  'Carletonville',
  'Centurion',
  'Cradock',
  'De Aar',
  'Durban',
  'East London',
  'eMalahleni (Witbank)',
  'Empangeni',
  'Ermelo',
  'Franschhoek',
  'Galeshewe',
  'Gansbaai',
  'George',
  'Germiston',
  'Graaff-Reinet',
  'Grabouw',
  'Port Elizabeth (Gqeberha)',
  'Greytown',
  'Harrismith',
  'Hermanus',
  'Howick',
  'Jeffreys Bay',
  'Johannesburg',
  'Kathu',
  'Khayelitsha',
  'Kimberley',
  'Klerksdorp',
  'Knysna',
  'Kokstad',
  'Komatipoort',
  'Krugersdorp',
  'KwaDukuza (Stanger)',
  'KwaMashu',
  'Ladybrand',
  'Ladysmith',
  'Lephalale',
  'Louis Trichardt (Makhado)',
  'Lichtenburg',
  'Lydenburg (Mashishing)',
  'Maake',
  'Mahikeng (Mafikeng)',
  'Malmesbury',
  'Malalane (Malelane)',
  'Mamelodi',
  'Margate',
  'Nelspruit (Mbombela)',
  'Middelburg (EC)',
  'Middelburg (MP)',
  'Midrand',
  'Mitchells Plain',
  'Mokopane (Potgietersrus)',
  'Mossel Bay',
  'Musina (Messina)',
  'Newcastle',
  'Orkney',
  'Oudtshoorn',
  'Paarl',
  'Phalaborwa',
  'Phuthaditjhaba (QwaQwa)',
  'Pietermaritzburg',
  'Piet Retief (eMkhondo)',
  'Pinetown',
  'Plettenberg Bay',
  'Polokwane',
  'Port Alfred',
  'Port Shepstone',
  'Potchefstroom',
  'Pretoria',
  'Prieska',
  'Queenstown (Komani)',
  'Randburg',
  'Rustenburg',
  'Sasolburg',
  'Secunda',
  'Seshego',
  'Somerset West',
  'Soweto',
  'Springs',
  'Stellenbosch',
  'Standerton',
  'Swellendam',
  'Tembisa',
  'Thohoyandou',
  'Tzaneen',
  'Uitenhage (Kariega)',
  'Ulundi',
  'Umhlanga',
  'Upington',
  'Vanderbijlpark',
  'Vereeniging',
  'Vredenburg',
  'Vryburg',
  'Vryheid',
  'Welkom',
  'Worcester',
  'Zeerust',
]

// Prefer familiar or commonly used abbreviations when available.
const CITY_PREFIX_OVERRIDES = {
  'Cape Town': 'CPT',
  'Durban': 'DBN',
  'Johannesburg': 'JHB',
  'Pretoria': 'PTA',
  'Gqeberha (Port Elizabeth)': 'PE',
  'East London': 'EL',
  'Bloemfontein': 'BLM',
  'Polokwane': 'PLK',
  'Mbombela (Nelspruit)': 'NLP',
  'Kimberley': 'KBY',
  'Rustenburg': 'RST',
  'Pietermaritzburg': 'PMB',
  'George': 'GRG',
  'Stellenbosch': 'STB',
  'Mossel Bay': 'MSB',
  'Knysna': 'KNY',
  'Oudtshoorn': 'ODS',
  'Worcester': 'WRC',
  'Somerset West': 'SSW',
  'Vereeniging': 'VRG',
  'Vanderbijlpark': 'VDP',
  'Krugersdorp': 'KDP',
  'Centurion': 'CTN',
  'Midrand': 'MDR',
  'Soweto': 'SWT',
}

export function getCityPrefix(city) {
  if (!city || typeof city !== 'string') return 'GEN'
  const trimmed = city.trim()
  if (CITY_PREFIX_OVERRIDES[trimmed]) return CITY_PREFIX_OVERRIDES[trimmed]
  // Build a prefix from the first letters of up to three words
  const words = trimmed
    .replace(/\(([^)]+)\)/g, '$1') // remove parentheses but keep inner text
    .split(/\s|[-]/)
    .filter(Boolean)
  let letters = words.map(w => w[0]).join('')
  if (letters.length >= 3) return letters.slice(0, 3).toUpperCase()
  // Fallback: take first three alphas of the city name
  const alphas = trimmed.replace(/[^A-Za-z]/g, '')
  return (alphas.slice(0, 3) || 'GEN').toUpperCase()
}

export function generateNextProviderCode(city, users) {
  const prefix = getCityPrefix(city)
  const numbers = (users || [])
    .filter(u => u.role === 'provider' && u.city === city && typeof u.providerCode === 'string' && u.providerCode.startsWith(prefix + '-'))
    .map(u => parseInt(u.providerCode.split('-')[1] || '0', 10))
    .filter(n => !isNaN(n))
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

export function ensureProviderCode(user, users) {
  if (!user || user.role !== 'provider' || !user.city) return user
  const prefix = getCityPrefix(user.city)
  if (user.providerCode && user.providerCode.startsWith(prefix + '-')) return user
  return { ...user, providerCode: generateNextProviderCode(user.city, users) }
}


