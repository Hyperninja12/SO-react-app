export const OFFICES_IN_HOUSE = [
  "ABC", "BAC", "BPLO", "CACCO", "CASSO", "CBO", "CCRO", "CEO", "CHOUSING",
  "CHRMO", "CICTMO", "CIO", "CIPO/TCBIC", "CLO", "CMO-ADMIN",
  "CMO-BACKSTOPPING/FISCAL MGT.", "CMO-EDUKASYON", "CMO-GAD",
  "CMO-HOUSEKEEPPING", "CMO-IAS", "CMO-LIBRARY", "CMO-MUSLIM AFFAIRS",
  "CMO-SECRETARY", "CMO-SPECIAL PERMITS", "CMO-SPECIAL PROGRAMS/PROJECT CO",
  "CMO-SPM", "COA", "COMELEC", "COUNCILOR AALA", "COUNCILOR CAASI",
  "COUNCILOR CATAYAS", "COUNCILOR COQUILLA", "COUNCILOR ELLIOT",
  "COUNCILOR LEMOS", "COUNCILOR ONG", "COUNCILOR PEREZ/IPMR",
  "COUNCILOR REVITA", "COUNCILOR UY-SALAZAR", "COUNCILOR WAKAN",
  "CPDO", "CPDO-MRP", "CSWD", "CTO", "CVMO", "GSO-UTILITY", "LYDO",
  "NEGOSYO CENTER", "PCSO", "PDAO", "PEESO", "SKCF DILG", "SP SECRETARIAT",
  "TCYDO"
] as const

export const OFFICES_ON_SITE = [
  "CADAC", "CAGRO", "CARCHO", "CDRRMO", "CEEO", "CENRO", "CEO-CONSTRUCTION",
  "CEO – Electrical", "CEO – Fabrication", "CEO – Maintenance",
  "CEO – Motorpool", "CHO-CANOCOTAN", "CHO-MABINI", "CLibrary",
  "CMO-INSPECTORATE", "CMO-MUSIC", "CMO – Sports", "CSU", "CVET",
  "CVET-Slaughter", "GSO-ADMIN", "GSO-PSD", "TMU", "Tourism"
] as const

export const OFFICES_INTERAGENCY = [
  "BARANGAY OFFICES", "BJMP", "DEP-ED", "PAO", "PNP"
] as const

export const BARANGAY_OFFICES = [
  "Apokon", "Busaon", "Canocotan", "Cuambogan", "La Filipina", "Liboganon",
  "Madaum", "Magugpo East", "Magugpo Poblacion", "Magugpo South", "Magugpo West",
  "Mankilam", "New Balamban", "Nueva Fuerza", "Pagsabangan", "Pandapan",
  "San Isidro", "Visayan"
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
