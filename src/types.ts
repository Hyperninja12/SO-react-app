export interface TechnicalReportItem {
  /** The selected request type (dropdown) */
  request: string
  /** What was actually done (free text) */
  actionDone: string
  /** Recommendation (free text) */
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
