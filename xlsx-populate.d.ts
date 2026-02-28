declare module 'xlsx-populate' {
  class XlsxPopulate {
    static fromDataAsync(data: Buffer | Uint8Array | string): Promise<Workbook>
    static fromBlankAsync(): Promise<Workbook>
  }

  interface Workbook {
    sheet(name: string): Sheet | undefined
    addSheet(name: string): Sheet
    outputAsync(options?: { type: string }): Promise<Buffer | Uint8Array>
  }

  interface Sheet {
    cell(address: string): Cell
  }

  interface Cell {
    value(value?: string | number | boolean | Date): Cell | string | number | boolean | Date
    style(styleObj?: Record<string, unknown>): Cell | Record<string, unknown>
  }

  export default XlsxPopulate
}
