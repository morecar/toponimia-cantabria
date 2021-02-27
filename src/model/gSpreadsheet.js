import { GoogleSpreadsheet } from 'google-spreadsheet';
import { GOOGLE_DOC_ID, GOOGLE_DB_SHEET_TITLE, GOOGLE_INFO_SHEET_TITLE, GOOGLE_INFO_SHEET_CELL, GOOGLE_SHEETS_API_KEY } from '../staticData/googleCredentials'

export default class GSpreadsheet {
  static async load() {
    const doc = this.connect()
    await doc.loadInfo(); 
    console.log(`Spreadsheets: loaded document ${doc.title}`);

    const info_sheet = await doc.sheetsByTitle[GOOGLE_INFO_SHEET_TITLE]
    await info_sheet.loadCells(`${GOOGLE_INFO_SHEET_CELL}:${GOOGLE_INFO_SHEET_CELL}`)
    
    return  {
              hash: info_sheet.getCellByA1(GOOGLE_INFO_SHEET_CELL).value,
              sheet: await doc.sheetsByTitle[GOOGLE_DB_SHEET_TITLE]
            }
  }

  static connect() {
    const doc = new GoogleSpreadsheet(GOOGLE_DOC_ID);
    doc.useApiKey(GOOGLE_SHEETS_API_KEY)
    return doc
  }
}