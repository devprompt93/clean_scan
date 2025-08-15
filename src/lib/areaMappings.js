// Area mappings for major South African cities
// This enables dependent dropdown functionality in the Manage Toilets page

export const MAJOR_CITIES = [
  'Cape Town',
  'Durban', 
  'Johannesburg',
  'Pretoria',
  'Port Elizabeth (Gqeberha)',
  'East London',
  'Bloemfontein',
  'Polokwane',
  'Nelspruit (Mbombela)',
  'Kimberley',
  'Rustenburg',
  'Pietermaritzburg',
  'George',
  'Stellenbosch',
  'Mossel Bay',
  'Knysna',
  'Oudtshoorn',
  'Worcester',
  'Somerset West',
  'Vereeniging',
  'Vanderbijlpark',
  'Krugersdorp',
  'Centurion',
  'Midrand',
  'Soweto'
]

export const CITY_AREAS = {
  'Cape Town': [
    'Bellville', 'Khayelitsha', 'Milnerton', 'Parow', 'Delft', 'Mitchells Plain',
    'Observatory', 'Sea Point', 'Green Point', 'Camps Bay', 'Claremont', 'Newlands',
    'Rondebosch', 'Mowbray', 'Woodstock', 'Salt River', 'Langa',
    'Gugulethu', 'Nyanga', 'Philippi', 'Manenberg', 'Bonteheuwel', 'Athlone',
    'Lansdowne', 'Ottery', 'Grassy Park', 'Lotus River', 'Wynberg', 'Tokai',
    'Constantia', 'Hout Bay', 'Kommetjie', 'Noordhoek', 'Fish Hoek', 'Simon\'s Town',
    'Muizenberg', 'St James', 'Kalk Bay', 'Glencairn', 'Scarborough'
  ],
  'Durban': [
    'Berea', 'Glenwood', 'Musgrave', 'Morningside', 'North Beach', 'South Beach',
    'Point', 'Victoria Street', 'Greyville', 'Berea West', 'Berea East', 'Essenwood',
    'Northcliff', 'Westville', 'Pinetown', 'Hillcrest', 'Kloof', 'Gillitts',
    'Waterfall', 'Assagay', 'Botha\'s Hill'
  ],
  'Johannesburg': [
    'Sandton', 'Rosebank', 'Melville', 'Parktown', 'Braamfontein', 'Hillbrow',
    'Yeoville', 'Bellevue', 'Bellevue East', 'Bellevue West', 'Bellevue North',
    'Bellevue South', 'Bellevue Central', 'Bellevue Heights', 'Bellevue Gardens',
    'Bellevue Park', 'Bellevue Estate', 'Bellevue Manor', 'Bellevue Ridge',
    'Bellevue View'
  ],
  'Pretoria': [
    'Arcadia', 'Brooklyn', 'Hatfield', 'Lynnwood', 'Menlo Park', 'Waterkloof',
    'Waterkloof Glen', 'Waterkloof Ridge', 'Waterkloof Heights', 'Waterkloof Park',
    'Waterkloof Estate', 'Waterkloof Manor'
  ],
  'Port Elizabeth (Gqeberha)': [
    'Summerstrand', 'Humewood', 'Mill Park', 'Mount Croix', 'Walmer'
  ],
  'East London': [
    'Vincent', 'Quigney', 'Berea', 'Berea West', 'Berea East', 'Berea North',
    'Berea South', 'Berea Central', 'Berea Heights', 'Berea Gardens', 'Berea Park',
    'Berea Estate', 'Berea Manor', 'Berea Ridge'
  ],
  'Bloemfontein': [
    'Westdene', 'Langenhoven Park', 'Fichardt Park', 'Bayswater', 'Bayswater Park',
    'Bayswater Estate', 'Bayswater Manor', 'Bayswater Ridge', 'Bayswater Heights',
    'Bayswater Gardens'
  ],
  'Polokwane': [
    'Polokwane Central', 'Polokwane West', 'Polokwane East', 'Polokwane North',
    'Polokwane South', 'Polokwane Heights', 'Polokwane Gardens', 'Polokwane Park',
    'Polokwane Estate', 'Polokwane Manor', 'Polokwane Ridge'
  ],
  'Nelspruit (Mbombela)': [
    'Nelspruit Central', 'Nelspruit West', 'Nelspruit East', 'Nelspruit North',
    'Nelspruit South', 'Nelspruit Heights', 'Nelspruit Gardens', 'Nelspruit Park',
    'Nelspruit Estate', 'Nelspruit Manor', 'Nelspruit Ridge'
  ],
  'Kimberley': [
    'Kimberley Central', 'Kimberley West', 'Kimberley East', 'Kimberley North',
    'Kimberley South', 'Kimberley Heights', 'Kimberley Gardens', 'Kimberley Park',
    'Kimberley Estate', 'Kimberley Manor', 'Kimberley Ridge'
  ],
  'Rustenburg': [
    'Rustenburg Central', 'Rustenburg West', 'Rustenburg East', 'Rustenburg North',
    'Rustenburg South', 'Rustenburg Heights', 'Rustenburg Gardens', 'Rustenburg Park',
    'Rustenburg Estate', 'Rustenburg Manor', 'Rustenburg Ridge'
  ],
  'Pietermaritzburg': [
    'Pietermaritzburg Central', 'Pietermaritzburg West', 'Pietermaritzburg East',
    'Pietermaritzburg North', 'Pietermaritzburg South', 'Pietermaritzburg Heights',
    'Pietermaritzburg Gardens', 'Pietermaritzburg Park', 'Pietermaritzburg Estate',
    'Pietermaritzburg Manor', 'Pietermaritzburg Ridge'
  ],
  'George': [
    'George Central', 'George West', 'George East', 'George North', 'George South',
    'George Heights', 'George Gardens', 'George Park', 'George Estate',
    'George Manor', 'George Ridge'
  ]
}

// Helper function to get areas for a specific city
export function getAreasForCity(city) {
  if (!city || city === 'All') return []
  return CITY_AREAS[city] || []
}

// Helper function to get providers for a specific city and area
export function getProvidersForLocation(city, area, allProviders) {
  if (!city || city === 'All' || !area || area === 'All') return allProviders || []
  if (!allProviders || !Array.isArray(allProviders)) return []
  
  return allProviders.filter(provider => 
    provider && 
    typeof provider === 'object' && 
    provider.city === city && 
    provider.area === area
  )
}

// Utility function to ensure unique areas for a city (prevents future duplicates)
export function getUniqueAreasForCity(city) {
  if (!city || city === 'All') return []
  const areas = CITY_AREAS[city] || []
  return [...new Set(areas)] // Remove any duplicates using Set
}
