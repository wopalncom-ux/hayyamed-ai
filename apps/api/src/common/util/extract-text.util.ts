// Extract plain text from an uploaded knowledge file (PDF / TXT / CSV / MD / JSON).
export async function extractText(file: Express.Multer.File): Promise<string> {
  const name = (file.originalname || '').toLowerCase()
  const mime = file.mimetype || ''
  if (name.endsWith('.pdf') || mime === 'application/pdf') {
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(file.buffer)
    return data.text || ''
  }
  // txt, csv, md, json and other text types — decode the buffer
  return file.buffer.toString('utf-8')
}
