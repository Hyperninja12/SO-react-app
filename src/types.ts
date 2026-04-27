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
  /** When BARANGAY OFFICES is selected, the specific barangay chosen */
  selectedBarangay?: string
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
