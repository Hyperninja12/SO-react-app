export const OFFICES_IN_HOUSE = [
  "CASSO", "CTO", "CHOUSING", "COMELEC", "CEO", "CCRO", "CSWD", "PDAO", 
  "CIPO/TCBIC", "NEGOSYO CENTER", "GSO-UTILITY", "BPLO", "CBO", "CLO", 
  "CACCO", "CMO-SECRETARY", "CMO-BACKSTOPPING/FISCAL MGT.", 
  "CMO-SPECIAL PERMITS", "CMO-ADMIN", "CMO-SPECIAL PROGRAMS/PROJECT CO", 
  "CMO-IAS", "CMO-LIBRARY", "CMO-SPM", "CMO-EDUKASYON", "CMO-GAD", 
  "CMO-MUSLIM AFFAIRS", "PEESO", "CHRMO", "BAC", "CPDO", "CPDO-MRP", 
  "SP SECRETARIAT", "CICTMO", "CVMO", "COUNCILOR REVITA", 
  "COUNCILOR CAASI", "COUNCILOR ELLIOT", "COUNCILOR AALA", 
  "COUNCILOR COQUILLA", "COUNCILOR PEREZ/IPMR", "COUNCILOR UY-SALAZAR", 
  "COUNCILOR CATAYAS", "COUNCILOR LEMOS", "COUNCILOR WAKAN", 
  "COUNCILOR ONG", "SKCF DILG", "ABC", "CIO", "COA", "PCSO", "TCYDO"
] as const

export const OFFICES_ON_SITE = [
  "CEO – Motorpool", "CEO – Fabrication", "CEO – Maintenance", 
  "CEO – Electrical", "CMO – Sports", "Tourism", "CLibrary", "CVET", 
  "CVET-Slaughter", "CSU", "TMU", "CAGRO", "CENRO", "CADAC", 
  "CHO-CANOCOTAN", "CHO-MABINI", "CDRRMO", "CEEO", "CARCHO", 
  "CMO-INSPECTORATE", "GSO-PSD", "GSO-ADMIN", "CEO-CONSTRUCTION", "CMO-MUSIC"
] as const

export const OFFICES_INTERAGENCY = [
  "DEP-ED", "PAO", "PNP", "BJMP", "BARANGAY OFFICES"
] as const

export const BARANGAY_OFFICES = [
  "Apokon", "Visayan", "La Filipina", "Mankilam", "Magugpo South", 
  "Magugpo Poblacion", "Magugpo East", "Magugpo West", "San Isidro", 
  "Nueva Fuerza", "Madaum", "Busaon", "Pandapan", "Liboganon", 
  "New Balamban", "Cuambogan", "Canocotan", "Pagsabangan"
] as const

export const TECHNICIANS = [
  "Joyce Israel",
  "Nick Palaca",
  "Adrian Monton",
  "Vence Jabilles",
  "Balong Callena"
] as const

export const REQUEST_TYPES = [
  "Computer isolation",
  "Software isolation installation and checking",
  "Network isolation installation and checking",
  "Hardware installation and checking",
  "Activation of operating system and MS office",
  "Password recovery",
  "Printer isolation (reset,installation, printer sharing, and checking)"
] as const

/** Request types that count as Hardware (for reports) */
export const REQUEST_HARDWARE = [
  "Computer isolation",
  "Network isolation installation and checking",
  "Hardware installation and checking",
  "Printer isolation (reset,installation, printer sharing, and checking)"
] as const

/** Request types that count as Software (for reports) */
export const REQUEST_SOFTWARE = [
  "Software isolation installation and checking",
  "Activation of operating system and MS office",
  "Password recovery"
] as const

export function getRequestCategory(actionDone: string): 'hardware' | 'software' | null {
  if ((REQUEST_HARDWARE as readonly string[]).includes(actionDone)) return 'hardware'
  if ((REQUEST_SOFTWARE as readonly string[]).includes(actionDone)) return 'software'
  return null
}

/** Q1=Jan–Mar, Q2=Apr–Jun, Q3=Jul–Sep, Q4=Oct–Dec */
export const QUARTER_OPTIONS = [
  { value: 1, label: 'First Quarter (Jan, Feb, Mar)' },
  { value: 2, label: 'Second Quarter (Apr, May, Jun)' },
  { value: 3, label: 'Third Quarter (Jul, Aug, Sep)' },
  { value: 4, label: 'Fourth Quarter (Oct, Nov, Dec)' },
] as const

export function getQuarterFromDate(dateStr: string): number {
  if (!dateStr) return 1
  const m = new Date(dateStr + 'T12:00:00').getMonth() + 1
  return Math.ceil(m / 3) as 1 | 2 | 3 | 4
}

export const PRINTER_BRANDS = [
  "Epson",
  "Canon",
  "HP",
  "Kyocera",
  "Brother"
] as const
