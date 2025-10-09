import jsPDF from "jspdf";
import amiriFont from "../../../fontBase64";
import React from "react";
// eslint-disable-next-line react/prop-types
const PDF = ({ name, fullDescription, Images, price, profit }) => {
  const generatePDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ===== إضافة الخط العربي =====
    doc.addFileToVFS("Amiri-Regular.ttf", amiriFont);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri");

    // ===== بيانات مثال =====
    const title = name;
    const description = fullDescription
    const images = Images;
    const pdfPrice = String(price);
    const pdfProfit = String(profit);
    const fontSize = 14;
    const lineHeight = 6;
    const marginX = 10;
    let y = 30; // بداية المحتوى أسفل العنوان

    // ===== العنوان =====
    doc.setFontSize(22);
    doc.text(title, pageWidth - 10, 20, { align: "right" });
    // ===== price&profit=====
    const priceY = 28; // أسفل العنوان مباشرة
    const priceX = pageWidth - 10; // من جهة اليمين
    const profitX = pageWidth - 60; // على بعد 50mm من اليمين (أو عدّل حسب رغبتك)

    doc.setFontSize(18);
    doc.text("Price: " + pdfPrice, priceX, priceY, { align: "right" });
    doc.setTextColor(0, 128, 0); // لو تحب تميز السعر باللون الأخضر

    doc.setFontSize(18);
    doc.text("Profit: " + pdfProfit, profitX, priceY, { align: "right" });
    doc.setTextColor(0, 0, 0); // إعادة اللون الأسود للنص العادي
    // ===== تقسيم النص داخل الصندوق =====
    const splitText = doc.splitTextToSize(description, 300);

    // حساب ارتفاع الصندوق + دعم تعدد الصفحات
    const bottomMargin = 10;
    let linesInPage = [];
    let descStartY = y;

    splitText.forEach((line) => {
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
    <button onClick={generatePDF} type="button">
      Generate PDF
    </button>
  );
};

export default PDF;
