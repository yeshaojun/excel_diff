// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare module 'xlsx-populate' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class XlsxPopulate {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromDataAsync(data: Buffer | Uint8Array | string): Promise<Workbook>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromBlankAsync(): Promise<Workbook>
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Workbook {
    sheet(name: string): Sheet | undefined
    addSheet(name: string): Sheet
    outputAsync(options?: { type: string }): Promise<Buffer | Uint8Array>
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Sheet {
    cell(address: string): Cell
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Cell {
    value(value: string | number | boolean | Date): Cell
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    style(styleObj: Record<string, unknown>): Cell
  }

  export default XlsxPopulate
}
