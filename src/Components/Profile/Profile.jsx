import React from "react";
import jsPDF from "jspdf";
import amiriFont from "../../../fontBase64";

export default function App() {
  const generatePDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ===== إضافة الخط العربي =====
    doc.addFileToVFS("Amiri-Regular.ttf", amiriFont);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri");

    // ===== بيانات مثال =====
    const title = "السلام عليكم! هذا نص عربي";
    const description =
      "هذا نص عربي طويل جدًا يمكن أن يمتد لأكثر من صفحة. ".repeat(50);
    const images = [
      "https://placehold.co/600x400@2x.png",
      "https://placehold.co/600x400@2x.png",
      "https://placehold.co/600x400@2x.png",
      "https://placehold.co/600x400@2x.png"
    ];

    const fontSize = 14;
    const lineHeight = 6;
    const marginX = 10;
    let y = 30; // بداية المحتوى أسفل العنوان

    // ===== العنوان =====
    doc.setFontSize(22);
    doc.text(title, pageWidth - 10, 20, { align: "right" });

    // ===== تقسيم النص داخل الصندوق =====
    const splitText = doc.splitTextToSize(description, 370);

    // حساب ارتفاع الصندوق + دعم تعدد الصفحات
    const bottomMargin = 10;
    let linesInPage = [];
    let descStartY = y;

    splitText.forEach((line, index) => {
      if (descStartY + lineHeight > pageHeight - bottomMargin) {
        // رسم الصندوق للنص الموجود قبل إضافة صفحة جديدة
        const boxHeight = linesInPage.length * lineHeight + 8;
        doc.setDrawColor(150);
        doc.setFillColor(245, 245, 245);
        doc.rect(marginX, y, pageWidth - 2 * marginX, boxHeight, "FD");

        // رسم النص داخل الصندوق
        doc.setFontSize(fontSize);
        doc.text(linesInPage, pageWidth - marginX - 5, y + 4, {
          align: "right",
        });

        doc.addPage();
        descStartY = 20;
        y = descStartY;
        linesInPage = [];
      }

      linesInPage.push(line);
      descStartY += lineHeight;
    });

    // رسم الصندوق للنص المتبقي
    if (linesInPage.length > 0) {
      const boxHeight = linesInPage.length * lineHeight + 8;
      doc.setDrawColor(150);
      doc.setFillColor(245, 245, 245);
      doc.rect(marginX, y, pageWidth - 2 * marginX, boxHeight, "FD");

      doc.setFontSize(fontSize);
      doc.text(linesInPage, pageWidth - marginX - 5, y + 4, { align: "right" });
      y += boxHeight + 10; // تحديث y بعد الصندوق
    }

    // ===== إضافة الصور مع روابط وقسمة الصفحات =====
    let imgX = marginX;
    let imgY = y;
    const imgWidth = 45;
    const imgHeight = 30;
    const gap = 5;

    images.forEach((img, index) => {
      if (imgY + imgHeight > pageHeight - bottomMargin) {
        doc.addPage();
        imgY = 20;
        imgX = marginX;
      }

      doc.addImage(img, "PNG", imgX, imgY, imgWidth, imgHeight);
      doc.link(imgX, imgY, imgWidth, imgHeight, { url: img });

      imgX += imgWidth + gap;
      if ((index + 1) % 4 === 0) {
        imgX = marginX;
        imgY += imgHeight + gap;
      }
    });

    doc.save("arabic_desc_box_multi_page.pdf");
  };

  return (
    <button onClick={generatePDF}>
      تحميل PDF بالعربي مع صندوق ديناميكي وصور
    </button>
  );
}
