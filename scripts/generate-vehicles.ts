#!/usr/bin/env node
/**
 * Synthetic dataset generator.
 *
 * Reads the canonical seed dataset (public/data/vehicles.json — the original
 * 200-vehicle set shipped with the repo) and appends 19,800 synthetic vehicles
 * with the exact same schema. The combined 20,000-record result is written
 * to public/data/vehicles-large.json.
 *
 * The canonical seed file is never modified. The output lives alongside the
 * seed under public/data/ so it can be served as a static asset (avoids
 * bundling a 30MB JSON into the app chunk).
 *
 * Usage:  npx tsx scripts/generate-vehicles.ts
 *         (or `node --experimental-strip-types scripts/generate-vehicles.ts`
 *          on Node 22.6+)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

interface Vehicle {
  id: string
  vin: string
  year: number
  make: string
  model: string
  trim: string
  body_style: string
  exterior_color: string
  interior_color: string
  engine: string
  transmission: string
  drivetrain: string
  odometer_km: number
  fuel_type: string
  condition_grade: number
  condition_report: string
  damage_notes: string[]
  title_status: 'clean' | 'rebuilt' | 'salvage'
  province: string
  city: string
  auction_start: string
  starting_bid: number
  reserve_price: number | null
  buy_now_price: number | null
  images: string[]
  selling_dealership: string
  lot: string
  current_bid: number | null
  bid_count: number
}

// Deterministic RNG — same seed → same dataset every run.
function mulberry32(seed: number): () => number {
  return function next() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(424242)
const CURRENT_YEAR = new Date().getFullYear()
const AUCTION_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

const PROVINCE_WEIGHTS: Record<string, number> = {
  Ontario: 40,
  Quebec: 23,
  'British Columbia': 14,
  Alberta: 12,
  Manitoba: 4,
  Saskatchewan: 3,
  'Nova Scotia': 2,
  'New Brunswick': 2,
}

interface ModelInfo {
  body: string
  engines: string[]
  trims: string[]
}

const MAKES_MODELS: Record<string, Record<string, ModelInfo>> = {
  Toyota: {
    Camry: { body: 'sedan', engines: ['2.5L I4', '2.5L Hybrid I4', '3.5L V6'], trims: ['LE', 'SE', 'XLE', 'XSE', 'TRD'] },
    RAV4: { body: 'SUV', engines: ['2.5L I4', '2.5L Hybrid I4'], trims: ['LE', 'XLE', 'XLE Premium', 'Adventure', 'TRD Off-Road'] },
    Corolla: { body: 'sedan', engines: ['1.8L I4', '2.0L I4', '1.8L Hybrid I4'], trims: ['L', 'LE', 'SE', 'XLE', 'XSE'] },
    Highlander: { body: 'SUV', engines: ['2.5L Hybrid I4', '3.5L V6'], trims: ['L', 'LE', 'XLE', 'Limited', 'Platinum'] },
    Tacoma: { body: 'truck', engines: ['2.7L I4', '3.5L V6'], trims: ['SR', 'SR5', 'TRD Sport', 'TRD Off-Road', 'Limited'] },
    Tundra: { body: 'truck', engines: ['3.5L Twin-Turbo V6', '3.5L Hybrid Twin-Turbo V6'], trims: ['SR', 'SR5', 'Limited', 'Platinum', '1794 Edition'] },
  },
  Honda: {
    Civic: { body: 'sedan', engines: ['2.0L I4', '1.5L Turbo I4'], trims: ['LX', 'Sport', 'EX', 'Touring'] },
    'CR-V': { body: 'SUV', engines: ['1.5L Turbo I4', '2.0L Hybrid I4'], trims: ['LX', 'EX', 'EX-L', 'Touring'] },
    Accord: { body: 'sedan', engines: ['1.5L Turbo I4', '2.0L Turbo I4', '2.0L Hybrid I4'], trims: ['LX', 'Sport', 'EX-L', 'Touring'] },
    Pilot: { body: 'SUV', engines: ['3.5L V6'], trims: ['LX', 'Sport', 'EX-L', 'Touring', 'Elite'] },
  },
  Ford: {
    'F-150': { body: 'truck', engines: ['2.7L EcoBoost V6', '3.5L EcoBoost V6', '5.0L V8', '3.5L PowerBoost Hybrid V6'], trims: ['XL', 'XLT', 'Lariat', 'King Ranch', 'Platinum'] },
    Escape: { body: 'SUV', engines: ['1.5L EcoBoost I3', '2.0L EcoBoost I4', '2.5L Hybrid I4'], trims: ['S', 'SE', 'SEL', 'Titanium'] },
    Explorer: { body: 'SUV', engines: ['2.3L EcoBoost I4', '3.0L EcoBoost V6', '3.3L Hybrid V6'], trims: ['Base', 'XLT', 'Limited', 'ST', 'Platinum'] },
    Mustang: { body: 'coupe', engines: ['2.3L EcoBoost I4', '5.0L V8'], trims: ['EcoBoost', 'EcoBoost Premium', 'GT', 'GT Premium', 'Mach 1'] },
    Bronco: { body: 'SUV', engines: ['2.3L EcoBoost I4', '2.7L EcoBoost V6'], trims: ['Base', 'Big Bend', 'Black Diamond', 'Outer Banks', 'Wildtrak', 'Badlands'] },
  },
  Chevrolet: {
    'Silverado 1500': { body: 'truck', engines: ['2.7L Turbo I4', '5.3L V8', '6.2L V8', '3.0L Duramax Diesel I6'], trims: ['WT', 'Custom', 'LT', 'RST', 'LT Trail Boss', 'LTZ', 'High Country'] },
    Equinox: { body: 'SUV', engines: ['1.5L Turbo I4'], trims: ['LS', 'LT', 'RS', 'Premier'] },
    Malibu: { body: 'sedan', engines: ['1.5L Turbo I4'], trims: ['LS', 'RS', 'LT', 'Premier'] },
    Traverse: { body: 'SUV', engines: ['3.6L V6'], trims: ['LS', 'LT', 'RS', 'Premier', 'High Country'] },
  },
  BMW: {
    '3 Series': { body: 'sedan', engines: ['2.0L Turbo I4', '3.0L Turbo I6'], trims: ['330i', '330i xDrive', 'M340i', 'M340i xDrive'] },
    X3: { body: 'SUV', engines: ['2.0L Turbo I4', '3.0L Turbo I6'], trims: ['sDrive30i', 'xDrive30i', 'M40i'] },
    X5: { body: 'SUV', engines: ['3.0L Turbo I6', '4.4L Twin-Turbo V8'], trims: ['xDrive40i', 'xDrive45e', 'M50i'] },
    '5 Series': { body: 'sedan', engines: ['2.0L Turbo I4', '3.0L Turbo I6', '4.4L Twin-Turbo V8'], trims: ['530i', '530i xDrive', '540i', '540i xDrive', 'M550i'] },
  },
  Tesla: {
    'Model 3': { body: 'sedan', engines: ['Electric Single Motor', 'Electric Dual Motor'], trims: ['Standard Range Plus', 'Long Range', 'Performance'] },
    'Model Y': { body: 'SUV', engines: ['Electric Dual Motor'], trims: ['Long Range', 'Performance'] },
    'Model S': { body: 'sedan', engines: ['Electric Dual Motor', 'Electric Tri Motor'], trims: ['Long Range', 'Plaid'] },
  },
  Ram: {
    '1500': { body: 'truck', engines: ['3.6L V6', '5.7L HEMI V8', '3.0L EcoDiesel V6'], trims: ['Tradesman', 'Big Horn', 'Laramie', 'Rebel', 'Limited', 'TRX'] },
  },
  Hyundai: {
    Tucson: { body: 'SUV', engines: ['2.5L I4', '1.6L Turbo Hybrid I4'], trims: ['SE', 'SEL', 'N Line', 'Limited'] },
    Elantra: { body: 'sedan', engines: ['2.0L I4', '1.6L Turbo I4', '1.6L Hybrid I4'], trims: ['SE', 'SEL', 'N Line', 'Limited', 'N'] },
    'Santa Fe': { body: 'SUV', engines: ['2.5L I4', '2.5L Turbo I4', '1.6L Turbo Hybrid I4'], trims: ['SE', 'SEL', 'XRT', 'Limited', 'Calligraphy'] },
    'Ioniq 5': { body: 'SUV', engines: ['Electric Single Motor', 'Electric Dual Motor'], trims: ['SE Standard Range', 'SE Long Range', 'SEL', 'Limited'] },
  },
  Kia: {
    Forte: { body: 'sedan', engines: ['2.0L I4', '1.6L Turbo I4'], trims: ['FE', 'LXS', 'GT-Line', 'GT'] },
    Sportage: { body: 'SUV', engines: ['2.5L I4', '1.6L Turbo Hybrid I4'], trims: ['LX', 'EX', 'SX', 'SX Prestige', 'X-Pro'] },
    Telluride: { body: 'SUV', engines: ['3.8L V6'], trims: ['LX', 'S', 'EX', 'SX', 'SX Prestige', 'X-Pro'] },
  },
  Mazda: {
    'CX-5': { body: 'SUV', engines: ['2.5L I4', '2.5L Turbo I4'], trims: ['Sport', 'Select', 'Preferred', 'Carbon Edition', 'Turbo', 'Signature'] },
    Mazda3: { body: 'sedan', engines: ['2.0L I4', '2.5L I4', '2.5L Turbo I4'], trims: ['GX', 'GS', 'GT', 'Turbo'] },
  },
  Subaru: {
    Outback: { body: 'SUV', engines: ['2.5L I4', '2.4L Turbo I4'], trims: ['Base', 'Premium', 'Limited', 'Touring', 'Wilderness', 'Onyx Edition XT'] },
    Crosstrek: { body: 'SUV', engines: ['2.0L I4', '2.5L I4'], trims: ['Base', 'Premium', 'Sport', 'Limited'] },
    WRX: { body: 'sedan', engines: ['2.4L Turbo I4'], trims: ['Base', 'Premium', 'Limited', 'GT'] },
  },
  Volkswagen: {
    Jetta: { body: 'sedan', engines: ['1.5L Turbo I4'], trims: ['S', 'Sport', 'SE', 'SEL'] },
    Tiguan: { body: 'SUV', engines: ['2.0L Turbo I4'], trims: ['S', 'SE', 'SE R-Line', 'SEL', 'SEL R-Line'] },
    'Golf GTI': { body: 'hatchback', engines: ['2.0L Turbo I4'], trims: ['S', 'SE', 'Autobahn'] },
  },
  GMC: {
    'Sierra 1500': { body: 'truck', engines: ['2.7L Turbo I4', '5.3L V8', '6.2L V8', '3.0L Duramax Diesel I6'], trims: ['Pro', 'SLE', 'Elevation', 'SLT', 'AT4', 'Denali'] },
    Terrain: { body: 'SUV', engines: ['1.5L Turbo I4'], trims: ['SLE', 'SLT', 'AT4', 'Denali'] },
  },
  Jeep: {
    Wrangler: { body: 'SUV', engines: ['2.0L Turbo I4', '3.6L V6', '3.0L EcoDiesel V6'], trims: ['Sport', 'Sport S', 'Sahara', 'Rubicon'] },
    'Grand Cherokee': { body: 'SUV', engines: ['2.0L Turbo I4', '3.6L V6', '5.7L HEMI V8'], trims: ['Laredo', 'Limited', 'Overland', 'Summit', 'Trailhawk'] },
  },
  Nissan: {
    Rogue: { body: 'SUV', engines: ['1.5L Turbo I3'], trims: ['S', 'SV', 'SL', 'Platinum'] },
    Altima: { body: 'sedan', engines: ['2.5L I4', '2.0L Turbo I4'], trims: ['S', 'SV', 'SR', 'SL', 'Platinum'] },
    Pathfinder: { body: 'SUV', engines: ['3.5L V6'], trims: ['S', 'SV', 'SL', 'Platinum', 'Rock Creek'] },
  },
}

const EXTERIOR_COLORS = [
  'White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Dark Blue', 'Midnight Blue', 'Pearl White',
  'Glacier White', 'Magnetic Grey', 'Oxford White', 'Shadow Black', 'Rapid Red', 'Iconic Silver',
  'Celestial Silver', 'Lunar Silver', 'Crystal Black', 'Platinum White', 'Burgundy', 'Green',
  'Dark Green', 'Bronze', 'Champagne', 'Orange',
]

const INTERIOR_COLORS = [
  'Black', 'Grey', 'Dark Grey', 'Light Grey', 'Tan', 'Beige', 'Brown', 'Saddle Brown', 'Cognac',
  'Red', 'White', 'Cream',
]

const PROVINCES_CITIES: Record<string, string[]> = {
  Ontario: ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham', 'Vaughan', 'Kitchener', 'Windsor', 'Barrie'],
  'British Columbia': ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Kelowna', 'Victoria', 'Abbotsford', 'Langley'],
  Alberta: ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'Airdrie'],
  Quebec: ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke'],
  Manitoba: ['Winnipeg', 'Brandon'],
  Saskatchewan: ['Saskatoon', 'Regina'],
  'Nova Scotia': ['Halifax', 'Dartmouth'],
  'New Brunswick': ['Moncton', 'Saint John', 'Fredericton'],
}

const DEALERSHIPS_BY_PROVINCE: Record<string, string[]> = {
  Ontario: [
    'AutoPark Toronto', 'Capital City Auto', 'Durham Auto Exchange', 'Golden Horseshoe Motors',
    'Grand Touring Motors', 'Highway 7 Auto Sales', 'King City Auto', 'Lakeshore Auto Group',
    'Maple Motors', 'Northland Chrysler', 'Parkway Ford',
  ],
  Quebec: [
    'Champlain Motors', 'Laurentian Auto Group', 'Metropolitain Auto', 'Rive-Sud Motors',
    'St-Laurent Auto Exchange',
  ],
  'British Columbia': [
    'Fraser Valley Auto Group', 'Harbour City Auto', 'Island Auto Exchange', 'Mountain View Motors',
    'Pacific Gateway Motors', 'Westcoast Auto Sales',
  ],
  Alberta: [
    'Chinook Auto Group', 'Foothills Auto Sales', 'Northern Ridge Motors', 'Prairie Motors',
    'Stampede Auto Exchange',
  ],
  Manitoba: ['Keystone Auto Group', 'Prairie Sun Motors'],
  Saskatchewan: ['Grain Belt Auto', 'Horizon Motors'],
  'Nova Scotia': ['Atlantic Auto Exchange', 'Harbourfront Motors'],
  'New Brunswick': ['Acadian Auto Exchange', 'Fundy Motors'],
}

const DAMAGE_ITEMS = [
  'Minor scratches on front bumper', 'Small dent on driver-side door',
  'Curb rash on front-right wheel', 'Chip in windshield (passenger side)',
  'Scratch on rear bumper from parking', 'Paint touch-up on hood (rock chips)',
  'Minor scrape on passenger-side mirror', 'Light hail damage on roof',
  'Dent on rear quarter panel', 'Scratch along driver-side fender',
  'Worn leather on driver seat bolster', 'Crack in rear taillight housing',
  'Small tear in rear seat upholstery', 'Scuff marks on door sill plates',
  'Faded headlight lenses', 'Minor rust on wheel wells', 'Dent on tailgate',
  'Scratch on liftgate', 'Paint peeling on roof rack', 'Cracked front grille',
  'Missing wheel center cap', 'Damaged mud flap (rear left)',
  'Worn brake rotors - due for replacement', 'AC compressor intermittent - needs diagnosis',
  'Check engine light - catalytic converter code',
  'Transmission slips between 2nd and 3rd gear',
  'Water damage to rear cargo area carpet', 'Frame damage - right front (repaired)',
  'Airbag deployed - replaced with OEM parts', 'Flood damage - electrical issues present',
]

interface ConditionBand {
  min: number
  max: number
  templates: string[]
}

const CONDITION_REPORTS: ConditionBand[] = [
  {
    min: 4.0, max: 5.0,
    templates: [
      'Vehicle is in excellent condition overall. Interior is clean with minimal wear. Exterior shows only minor imperfections consistent with age.',
      'Well-maintained vehicle with full service history available. Paint is in very good condition. Interior shows light use consistent with mileage.',
      'Above-average condition for year and mileage. All mechanical systems functioning properly. Recently serviced with new tires.',
      'Exceptional condition. Single previous owner. Garage kept. No mechanical issues reported.',
      'Very clean vehicle inside and out. Minor cosmetic wear only. All electronics and features fully functional.',
    ],
  },
  {
    min: 3.0, max: 3.9,
    templates: [
      'Vehicle shows average wear for its age and mileage. Some cosmetic imperfections noted. Mechanically sound.',
      'Fair condition overall. Interior has some wear but no major damage. A few exterior blemishes. Drives well.',
      'Average condition. Has some visible wear on high-touch surfaces. Engine and transmission perform within normal parameters.',
      'Reasonable condition with expected wear. Would benefit from detailing. No major mechanical concerns identified.',
      'Moderate wear throughout. Previous daily driver. Runs and drives without issue. Cosmetic touch-ups recommended.',
    ],
  },
  {
    min: 2.0, max: 2.9,
    templates: [
      'Vehicle shows significant wear. Multiple cosmetic issues noted. Mechanical inspection recommended before purchase.',
      'Below-average condition. Visible damage present. May require immediate maintenance to address noted issues.',
      'Condition reflects heavy use. Several repairs recommended. Priced accordingly to account for needed work.',
      'Rough condition with notable damage. Suitable for buyer comfortable with repairs. Core mechanical systems operational.',
    ],
  },
  {
    min: 1.0, max: 1.9,
    templates: [
      'Vehicle has substantial damage. Sold as-is. Recommended for parts or significant rebuild only.',
      'Major mechanical and cosmetic issues present. Not roadworthy in current state. For experienced rebuilders.',
      'Extensive damage from incident. Frame integrity should be professionally assessed. Salvage title.',
    ],
  },
]

function rand() { return rng() }
function randomBetween(min: number, max: number) { return min + rand() * (max - min) }
function randInt(min: number, max: number) { return Math.floor(randomBetween(min, max + 1)) }
function choice<T>(values: readonly T[]): T { return values[randInt(0, values.length - 1)]! }

function weightedChoice(weightMap: Record<string, number>): string {
  const entries = Object.entries(weightMap)
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let target = randomBetween(0, total)
  for (const [value, weight] of entries) {
    target -= weight
    if (target <= 0) return value
  }
  return entries[entries.length - 1]![0]
}

function roundToNearest500(value: number) { return Math.round(value / 500) * 500 }

function generateVin(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
  let vin = ''
  for (let i = 0; i < 17; i += 1) {
    vin += i === 8 ? String(randInt(0, 9)) : choice(chars.split(''))
  }
  return vin
}

function getFuelType(engine: string): string {
  if (engine.includes('Electric')) return 'electric'
  if (engine.includes('Hybrid')) return 'hybrid'
  if (engine.includes('Diesel') || engine.includes('EcoDiesel') || engine.includes('Duramax')) return 'diesel'
  return 'gasoline'
}

function getTransmission(engine: string, model: string, bodyStyle: string): string {
  if (engine.includes('Electric')) return 'single-speed'
  const manualEligible = bodyStyle === 'coupe' || ['WRX', 'Golf GTI', 'Mustang'].includes(model)
  if (manualEligible) return choice(['manual', 'automatic', 'automatic', 'automatic'])
  return choice(['automatic', 'automatic', 'automatic', 'CVT'])
}

function getDrivetrain(make: string, model: string, bodyStyle: string): string {
  if (make === 'Tesla') return choice(['AWD', 'RWD'])
  if (make === 'Subaru') return 'AWD'
  if (bodyStyle === 'truck') return choice(['4WD', '4WD', 'RWD', 'AWD'])
  if (['Wrangler', 'Bronco'].includes(model)) return '4WD'
  if (make === 'BMW') return choice(['AWD', 'RWD'])
  if (bodyStyle === 'SUV') return choice(['AWD', 'FWD', 'AWD', '4WD'])
  return choice(['FWD', 'FWD', 'AWD'])
}

function sampleWithoutReplacement<T>(values: readonly T[], count: number): T[] {
  const pool = [...values]
  const out: T[] = []
  while (pool.length > 0 && out.length < count) {
    out.push(pool.splice(randInt(0, pool.length - 1), 1)[0]!)
  }
  return out
}

function generateCondition(year: number, odometerKm: number, titleStatus: Vehicle['title_status']) {
  const age = CURRENT_YEAR - year
  let base = 4.5 - age * 0.15 - odometerKm / 200000
  if (titleStatus === 'salvage') base = randomBetween(1.0, 2.5)
  else if (titleStatus === 'rebuilt') base = randomBetween(2.0, 3.5)

  const grade = Math.round(Math.max(1.0, Math.min(5.0, base + randomBetween(-0.5, 0.5))) * 10) / 10
  const band = CONDITION_REPORTS.find(g => grade >= g.min && grade <= g.max) ?? CONDITION_REPORTS[1]!
  const report = choice(band.templates)

  let damageNotes: string[] = []
  if (grade < 2.0) {
    damageNotes = [
      ...sampleWithoutReplacement(DAMAGE_ITEMS.slice(22), randInt(1, 3)),
      ...sampleWithoutReplacement(DAMAGE_ITEMS.slice(0, 22), randInt(1, 3)),
    ]
  } else if (grade < 3.0) {
    damageNotes = sampleWithoutReplacement(DAMAGE_ITEMS.slice(0, 25), randInt(2, 5))
  } else if (grade < 4.0 && rand() < 0.6) {
    damageNotes = sampleWithoutReplacement(DAMAGE_ITEMS.slice(0, 22), randInt(1, 3))
  } else if (grade >= 4.0 && rand() < 0.2) {
    damageNotes = sampleWithoutReplacement(DAMAGE_ITEMS.slice(0, 15), 1)
  }

  return { conditionGrade: grade, conditionReport: report, damageNotes }
}

function estimatePrice(
  year: number, make: string, model: string,
  odometerKm: number, conditionGrade: number, titleStatus: Vehicle['title_status'],
) {
  const premiumTrucks = ['F-150', 'Silverado 1500', 'Sierra 1500', '1500', 'Tundra']
  const midTrucks = ['Tacoma']
  const premiumSuvs = ['X5', 'Grand Cherokee', 'Telluride', 'Highlander', 'Pilot', 'Explorer']
  const compactSuvs = ['CR-V', 'RAV4', 'Tucson', 'Sportage', 'Equinox', 'Escape', 'CX-5', 'Crosstrek', 'Rogue', 'Tiguan', 'Terrain', 'Bronco']

  let base = randInt(25000, 40000)
  if (make === 'Tesla' && model === 'Model S') base = randInt(85000, 120000)
  else if (make === 'Tesla') base = randInt(50000, 75000)
  else if (make === 'BMW' && ['X5', '5 Series'].includes(model)) base = randInt(65000, 95000)
  else if (make === 'BMW') base = randInt(48000, 70000)
  else if (premiumTrucks.includes(model)) base = randInt(50000, 80000)
  else if (midTrucks.includes(model)) base = randInt(38000, 55000)
  else if (premiumSuvs.includes(model)) base = randInt(45000, 70000)
  else if (compactSuvs.includes(model)) base = randInt(32000, 48000)
  else if (['Mustang', 'WRX', 'Golf GTI'].includes(model)) base = randInt(35000, 55000)
  else if (model === 'Wrangler') base = randInt(42000, 60000)

  const age = CURRENT_YEAR - year
  let depreciation = 0.92
  if (age === 1) depreciation = 0.82
  else if (age === 2) depreciation = 0.73
  else if (age > 2) depreciation = 0.73 - (age - 2) * 0.055
  depreciation = Math.max(0.3, depreciation)

  const expectedKm = age > 0 ? age * 18000 : 5000
  const mileageRatio = odometerKm / Math.max(expectedKm, 5000)
  let mileageFactor = 1.0
  if (mileageRatio < 0.8) mileageFactor = 1.05
  else if (mileageRatio >= 1.2 && mileageRatio < 1.5) mileageFactor = 0.92
  else if (mileageRatio >= 1.5) mileageFactor = 0.8

  const conditionFactor = 0.7 + (conditionGrade / 5) * 0.35
  const titleFactor = titleStatus === 'salvage' ? 0.45 : titleStatus === 'rebuilt' ? 0.68 : 1
  const wholesaleValue = Math.max(
    2500,
    Math.floor(base * depreciation * mileageFactor * conditionFactor * titleFactor),
  )

  const startingBid = Math.max(1000, roundToNearest500(wholesaleValue * randomBetween(0.5, 0.75)))
  const reservePrice = rand() < 0.7 ? roundToNearest500(wholesaleValue * randomBetween(0.85, 0.98)) : null
  const buyNowPrice = rand() < 0.2 ? roundToNearest500(wholesaleValue * randomBetween(1.02, 1.18)) : null
  return { startingBid, reservePrice, buyNowPrice }
}

function generateBidState(startingBid: number, reservePrice: number | null, buyNowPrice: number | null) {
  if (rand() >= 0.38) return { currentBid: null as number | null, bidCount: 0 }
  const bidCount = randInt(1, 18)
  const softCeiling = reservePrice ?? buyNowPrice ?? roundToNearest500(startingBid * randomBetween(1.3, 2.4))
  let currentBid = roundToNearest500(Math.max(startingBid + 500, softCeiling * randomBetween(0.72, 1.02)))
  if (buyNowPrice) currentBid = Math.min(currentBid, buyNowPrice - 500)
  currentBid = Math.max(startingBid + 500, currentBid)
  return { currentBid, bidCount }
}

function pickProvinceAndCity() {
  const province = weightedChoice(PROVINCE_WEIGHTS)
  return { province, city: choice(PROVINCES_CITIES[province]!) }
}

function formatLocalDateTime(date: Date) {
  const y = String(date.getFullYear())
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:00:00`
}

function generateAuctionStart() {
  const base = new Date()
  base.setDate(base.getDate() + 1 + randInt(0, 6))
  base.setHours(choice(AUCTION_HOURS), 0, 0, 0)
  return formatLocalDateTime(base)
}

function lotNumberForIndex(index: number) {
  const lane = String.fromCharCode(65 + Math.floor(index / 50) % 26)
  return `${lane}-${String((index % 50) + 1).padStart(4, '0')}`
}

// Simple UUID v4-like generator (seeded, so output is deterministic).
function generateId(): string {
  const hex = '0123456789abcdef'
  let out = ''
  for (let i = 0; i < 32; i += 1) {
    if (i === 8 || i === 12 || i === 16 || i === 20) out += '-'
    if (i === 12) out += '4'
    else if (i === 16) out += hex[8 + randInt(0, 3)]
    else out += hex[randInt(0, 15)]
  }
  return out
}

function generateVehicle(index: number): Vehicle {
  const makes = Object.keys(MAKES_MODELS)
  const make = choice(makes)!
  const modelMap = MAKES_MODELS[make]!
  const models = Object.keys(modelMap)
  const model = choice(models)!
  const info = modelMap[model]!
  const year = randInt(CURRENT_YEAR - 10, CURRENT_YEAR)
  const trim = choice(info.trims)
  const engine = choice(info.engines)
  const bodyStyle = info.body
  const fuelType = getFuelType(engine)
  const transmission = getTransmission(engine, model, bodyStyle)
  const drivetrain = getDrivetrain(make, model, bodyStyle)

  let odometerKm = Math.max(
    500,
    Math.floor((CURRENT_YEAR - year) * randInt(12000, 25000) * randomBetween(0.7, 1.3)),
  )
  if (fuelType === 'electric') odometerKm = Math.floor(odometerKm * 0.7)

  const titleRoll = rand()
  const titleStatus: Vehicle['title_status'] = titleRoll < 0.08 ? 'salvage' : titleRoll < 0.15 ? 'rebuilt' : 'clean'
  const { conditionGrade, conditionReport, damageNotes } = generateCondition(year, odometerKm, titleStatus)
  const { province, city } = pickProvinceAndCity()
  const { startingBid, reservePrice, buyNowPrice } = estimatePrice(year, make, model, odometerKm, conditionGrade, titleStatus)
  const { currentBid, bidCount } = generateBidState(startingBid, reservePrice, buyNowPrice)
  const imageCount = randInt(3, 6)

  return {
    id: generateId(),
    vin: generateVin(),
    year, make, model, trim,
    body_style: bodyStyle,
    exterior_color: choice(EXTERIOR_COLORS),
    interior_color: choice(INTERIOR_COLORS),
    engine, transmission, drivetrain,
    odometer_km: odometerKm,
    fuel_type: fuelType,
    condition_grade: conditionGrade,
    condition_report: conditionReport,
    damage_notes: damageNotes,
    title_status: titleStatus,
    province, city,
    auction_start: generateAuctionStart(),
    starting_bid: startingBid,
    reserve_price: reservePrice,
    buy_now_price: buyNowPrice,
    images: Array.from({ length: imageCount }, (_, i) => (
      `https://placehold.co/800x600/1a1a2e/eaeaea?text=${year}+${make.replaceAll(' ', '+')}+${model.replaceAll(' ', '+')}+Photo+${i + 1}`
    )),
    selling_dealership: choice(DEALERSHIPS_BY_PROVINCE[province]!),
    lot: lotNumberForIndex(index),
    current_bid: currentBid,
    bid_count: bidCount,
  }
}

const scriptDir = dirname(fileURLToPath(import.meta.url))
const seedPath = resolve(scriptDir, '../public/data/vehicles.json')
const outputPath = resolve(scriptDir, '../public/data/vehicles-large.json')

console.log(`Reading seed from ${seedPath}`)
const seed = JSON.parse(readFileSync(seedPath, 'utf-8')) as Vehicle[]
const seedCount = seed.length
const TARGET_TOTAL = 20000
const synthCount = Math.max(0, TARGET_TOTAL - seedCount)
console.log(`Seed contains ${seedCount} vehicles. Generating ${synthCount} synthetic vehicles…`)

const start = Date.now()
const synthetic: Vehicle[] = []
for (let i = 0; i < synthCount; i += 1) {
  synthetic.push(generateVehicle(seedCount + i))
}

const combined = [...seed, ...synthetic]

writeFileSync(outputPath, JSON.stringify(combined))
const elapsed = Date.now() - start

const summary = {
  total: combined.length,
  seedPreserved: seedCount,
  synthesized: synthCount,
  withCurrentBid: combined.filter(v => v.current_bid !== null).length,
  withBuyNow: combined.filter(v => v.buy_now_price !== null).length,
  titleStatus: combined.reduce<Record<string, number>>((acc, v) => {
    acc[v.title_status] = (acc[v.title_status] ?? 0) + 1
    return acc
  }, {}),
  elapsedMs: elapsed,
  outputPath,
}

console.log(JSON.stringify(summary, null, 2))
