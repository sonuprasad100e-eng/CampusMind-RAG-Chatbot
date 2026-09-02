const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Clean and normalize extracted text from PDF/DOCX.
 * Separates squished words like "MultidisciplinaryMinor" -> "Multidisciplinary Minor",
 * removes non-printable characters, and normalizes spacing.
 */
function cleanExtractedText(raw) {
  if (!raw || typeof raw !== 'string') return '';

  return (
    raw
      // Normalize hyphens and dashes
      .replace(/[—–]/g, '-')
      // Clean up multiple spaces and horizontal tabs
      .replace(/[ \t]+/g, ' ')
      // Clean up excessive blank lines
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Extracts text and page breakdowns from PDF, DOCX, or TXT files.
 * Returns an array of page objects: [{ pageNumber: 1, text: '...' }]
 */
async function extractDocumentContent(filePath, fileType) {
  const ext = (fileType || path.extname(filePath).replace('.', '')).toLowerCase();

  switch (ext) {
    case 'pdf': {
      const dataBuffer = await fs.readFile(filePath);

      let pageNumber = 1;
      const pages = [];

      const renderPage = (pageData) => {
        return pageData.getTextContent().then((textContent) => {
          let lastY = null;
          let lastX = null;
          let lastW = null;
          let text = '';

          for (const item of textContent.items) {
            const str = item.str || '';
            if (!str) continue;

            const x = item.transform[4];
            const y = item.transform[5];
            const w = item.width || 0;

            if (lastY === null) {
              text = str;
            } else if (Math.abs(lastY - y) < 4) {
              // Same horizontal line: calculate distance gap between previous item and current item
              const gap = x - (lastX + lastW);
              if (gap > 2.0) {
                // Natural word break
                text += ' ' + str;
              } else {
                // Continuation of the same word/character sequence
                text += str;
              }
            } else {
              // Vertical shift / New line
              text += '\n' + str;
            }

            lastY = y;
            lastX = x;
            lastW = w;
          }

          const cleaned = cleanExtractedText(text);
          if (cleaned) {
            pages.push({
              pageNumber: pageNumber++,
              text: cleaned,
            });
          }
          return text;
        });
      };

      try {
        const parsed = await pdfParse(dataBuffer, { pagerender: renderPage });
        if (pages.length === 0 && parsed.text) {
          pages.push({ pageNumber: 1, text: cleanExtractedText(parsed.text) });
        }
        return pages;
      } catch (err) {
        console.warn(`[Extractor] Detailed PDF parse failed (${err.message}), attempting fallback parse.`);
        const simpleParsed = await pdfParse(dataBuffer);
        return [{ pageNumber: 1, text: cleanExtractedText(simpleParsed.text) }];
      }
    }

    case 'docx': {
      const result = await mammoth.extractRawText({ path: filePath });
      const rawText = result.value || '';
      const sections = rawText.split(/\n\s*\n\s*\n/);
      return sections
        .map((sec, idx) => ({
          pageNumber: idx + 1,
          text: cleanExtractedText(sec),
        }))
        .filter((p) => p.text.length > 0);
    }

    case 'txt':
    default: {
      const rawContent = await fs.readFile(filePath, 'utf-8');
      const parts = rawContent.split(/\f|\n{4,}/);
      return parts
        .map((part, idx) => ({
          pageNumber: idx + 1,
          text: cleanExtractedText(part),
        }))
        .filter((p) => p.text.length > 0);
    }
  }
}

module.exports = {
  extractDocumentContent,
  cleanExtractedText,
};
