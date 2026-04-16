export interface TechnicalReportItem {
  request: string
  actionDone: string
  recommendation: string
}

export interface WorkSlipEntry {
  id: string
  soNumber: string
  date: string
  areaInHouse: boolean
  areaOnSite: boolean
  areaInteragency: boolean
  offices: string[]
  /** When DEP-ED is selected in offices, optional school name */
  schoolName?: string
  timeStarted: string
  timeEnded: string
  actionDone: string
  recommendation: string
  requesterSignature: string
  technicianName: string
  approvedBy: string
  createdAt: string
  printerBrand?: string
  printerModel?: string
  /** 1 = Jan–Mar, 2 = Apr–Jun, 3 = Jul–Sep, 4 = Oct–Dec */
  quarter?: number
  /** Multiple technical report entries (request + recommendation per row) */
  technicalReports?: TechnicalReportItem[]
}
export interface Technician {
  id: string
  name: string
}
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
  "COUNCILOR ONG", "SKCF DILG", "ABC", "CIO", "COA", "PCSO", "TCYDO", "LYDO"
] as const
