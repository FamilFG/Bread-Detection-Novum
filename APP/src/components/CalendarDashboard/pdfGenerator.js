import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function handleDownloadPDF({
  month,
  year,
  monthName,
  total,
  avgPerDay,
  counts,
  bestDay,
  maxCount,
  days,
}) {
  const doc = new jsPDF();
  const fileName = `BreadTrack_Report_${monthName}_${year}.pdf`;

  // ── Header ──
  doc.setFontSize(22);
  doc.setTextColor(79, 142, 247); // var(--primary)
  doc.text("BreadTrack AI", 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Monthly Capture Report: ${monthName} ${year}`, 14, 28);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 34);

  // ── Summary Section ──
  doc.setDrawColor(230, 230, 230);
  doc.line(14, 40, 196, 40);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("MONTHLY SUMMARY", 14, 48);

  doc.setFont("helvetica", "normal");
  doc.text(`Total Breads Captured:`, 14, 56);
  doc.text(total.toLocaleString(), 80, 56);

  doc.text(`Daily Average:`, 14, 62);
  doc.text(avgPerDay.toLocaleString(), 80, 62);

  doc.text(`Days Tracked:`, 14, 68);
  doc.text(counts.length.toString(), 80, 68);

  if (bestDay) {
    doc.text(`Peak Day:`, 14, 74);
    doc.text(
      `${monthName.slice(0, 3)} ${bestDay.day} (${maxCount.toLocaleString()} loaves)`,
      80,
      74,
    );
  }

  // ── Table Section ──
  const tableData = days.map((d) => [
    `${monthName.slice(0, 3)} ${d.day}, ${year}`,
    d.count != null ? d.count.toLocaleString() : "—",
  ]);

  autoTable(doc, {
    startY: 85,
    head: [["Date", "Loaves Captured"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [79, 142, 247] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | BreadTrack AI Business Intelligence`,
      14,
      285,
    );
  }

  doc.save(fileName);
}
