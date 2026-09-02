/**
 * Recursive Character-Based Chunker
 * Target chunk size: ~800 characters
 * Chunk overlap: ~150 characters
 * Splits along natural boundaries: paragraphs (\n\n), lines (\n), sentences (. ! ?), clauses (; ,), and spaces.
 */

function recursiveSplitText(text, maxChunkSize = 800, overlap = 150) {
  if (!text || typeof text !== 'string') return [];

  const separators = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' '];

  function splitRecursively(currentText, sepIndex) {
    if (currentText.length <= maxChunkSize) {
      const trimmed = currentText.trim();
      return trimmed ? [trimmed] : [];
    }

    if (sepIndex >= separators.length) {
      // Hard split fallback if no natural separator worked
      const chunks = [];
      let start = 0;
      while (start < currentText.length) {
        let end = Math.min(start + maxChunkSize, currentText.length);
        const chunk = currentText.substring(start, end).trim();
        if (chunk) chunks.push(chunk);
        if (end >= currentText.length) break;
        start += maxChunkSize - overlap;
      }
      return chunks;
    }

    const separator = separators[sepIndex];
    const splits = currentText.split(separator);

    const resultChunks = [];
    let currentAccumulator = '';

    for (let i = 0; i < splits.length; i++) {
      const piece = splits[i];
      const pieceWithSep = i < splits.length - 1 ? piece + separator : piece;

      if (!currentAccumulator) {
        if (pieceWithSep.length > maxChunkSize) {
          // Piece itself is too large, recurse with finer separator
          const subChunks = splitRecursively(pieceWithSep, sepIndex + 1);
          resultChunks.push(...subChunks);
        } else {
          currentAccumulator = pieceWithSep;
        }
      } else if (currentAccumulator.length + pieceWithSep.length <= maxChunkSize) {
        currentAccumulator += pieceWithSep;
      } else {
        resultChunks.push(currentAccumulator.trim());

        // Compute overlapping prefix from end of currentAccumulator
        let overlapPrefix = '';
        if (overlap > 0 && currentAccumulator.length > overlap) {
          const overlapTail = currentAccumulator.slice(-overlap);
          // Try to find clean word boundary in overlap
          const spaceIdx = overlapTail.indexOf(' ');
          overlapPrefix = spaceIdx !== -1 ? overlapTail.substring(spaceIdx + 1) : overlapTail;
        }

        if (pieceWithSep.length > maxChunkSize) {
          const subChunks = splitRecursively(pieceWithSep, sepIndex + 1);
          resultChunks.push(...subChunks);
          currentAccumulator = '';
        } else {
          currentAccumulator = overlapPrefix ? overlapPrefix + pieceWithSep : pieceWithSep;
        }
      }
    }

    if (currentAccumulator.trim()) {
      resultChunks.push(currentAccumulator.trim());
    }

    return resultChunks;
  }

  return splitRecursively(text, 0);
}

/**
 * Chunks structured page/section documents with metadata
 */
function chunkDocumentPages(pages, maxChunkSize = 800, overlap = 150) {
  const allChunks = [];
  let chunkIndex = 0;

  for (const page of pages) {
    const pageNumber = page.pageNumber || 1;
    const pageText = page.text || '';
    if (!pageText.trim()) continue;

    const textChunks = recursiveSplitText(pageText, maxChunkSize, overlap);
    for (const chunk of textChunks) {
      if (chunk && chunk.length > 20) {
        allChunks.push({
          content: chunk,
          pageNumber,
          chunkIndex: chunkIndex++,
        });
      }
    }
  }

  return allChunks;
}

module.exports = {
  recursiveSplitText,
  chunkDocumentPages,
};
