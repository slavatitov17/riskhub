import type { ReportFilters, ProjectReportFilters } from '@/components/analytics/analytics-view'
import type { PageCopy } from '@/lib/page-copy'

function joinFilterValues(values: string[], allLabel: string) {
  if (values.length === 0) return allLabel
  return values.join(', ')
}

/**
 * Builds human-readable lines describing applied risk analytics filters for PDF export.
 */
export function formatRiskPdfFilterLines(
  a: PageCopy['analytics'],
  f: ReportFilters
): string[] {
  const lines: string[] = []
  lines.push(`${a.periodLabel}: ${a.periodFrom} ${f.periodFrom} — ${a.periodTo} ${f.periodTo}`)
  lines.push(`${a.riskProbability}: ${joinFilterValues(f.probability, a.all)}`)
  lines.push(`${a.riskImpact}: ${joinFilterValues(f.impact, a.all)}`)
  lines.push(`${a.riskStatus}: ${joinFilterValues(f.status, a.all)}`)
  lines.push(`${a.riskId}: ${joinFilterValues(f.riskId, a.all)}`)
  lines.push(`${a.riskCategory}: ${joinFilterValues(f.category, a.allCategories)}`)
  lines.push(`${a.project}: ${joinFilterValues(f.project, a.allProjects)}`)
  if (f.keywords.trim())
    lines.push(`${a.keywords}: ${f.keywords.trim()}`)
  return lines
}

/**
 * Builds human-readable lines describing applied project analytics filters for PDF export.
 */
export function formatProjectPdfFilterLines(
  a: PageCopy['analytics'],
  f: ProjectReportFilters
): string[] {
  const lines: string[] = []
  lines.push(`${a.periodLabel}: ${a.periodFrom} ${f.periodFrom} — ${a.periodTo} ${f.periodTo}`)
  lines.push(`${a.projectStatus}: ${joinFilterValues(f.status, a.all)}`)
  lines.push(`${a.projectCategory}: ${joinFilterValues(f.category, a.allCategories)}`)
  lines.push(`${a.participants}: ${joinFilterValues(f.participants, a.all)}`)
  lines.push(`${a.projectId}: ${joinFilterValues(f.projectId, a.all)}`)
  if (f.keywords.trim())
    lines.push(`${a.keywords}: ${f.keywords.trim()}`)
  return lines
}

function addCanvasToPdfPage(
  pdf: import('jspdf').default,
  canvas: HTMLCanvasElement,
  marginMm: number
) {
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const maxW = pageW - marginMm * 2
  const maxH = pageH - marginMm * 2
  const imgData = canvas.toDataURL('image/png', 1)
  const ratio = canvas.height / canvas.width
  let w = maxW
  let h = w * ratio
  if (h > maxH) {
    h = maxH
    w = h / ratio
  }
  const x = marginMm + (maxW - w) / 2
  const y = marginMm + (maxH - h) / 2
  pdf.addImage(imgData, 'PNG', x, y, w, h, undefined, 'FAST')
}

export interface AnalyticsPdfSlide {
  readonly element: HTMLElement
}

/**
 * Renders each element to a canvas and appends it as an A4 PDF page, then triggers download.
 */
export async function exportAnalyticsPdfDocument(options: {
  readonly slides: AnalyticsPdfSlide[]
  readonly fileName: string
}): Promise<void> {
  if (options.slides.length === 0) return

  if (typeof document !== 'undefined' && document.fonts?.ready)
    await document.fonts.ready

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ])

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const marginMm = 10

  for (let i = 0; i < options.slides.length; i++) {
    if (i > 0) pdf.addPage()
    const el = options.slides[i]!.element
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight
    })
    addCanvasToPdfPage(pdf, canvas, marginMm)
  }

  pdf.save(options.fileName)
}
