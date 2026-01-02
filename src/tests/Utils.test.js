import { describe, it, expect, vi } from 'vitest';
import { exportToCSV, exportToTXT } from '../utils/exportHelper';
import { saveAs } from 'file-saver';

// Mock de file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}));

// Mock de XLSX (parcial)
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(),
    sheet_to_csv: vi.fn().mockReturnValue('col1,col2\nval1,val2'),
    book_new: vi.fn(),
    book_append_sheet: vi.fn()
  },
  writeFile: vi.fn()
}));

describe('Utilidades de Exportación', () => {
  const mockData = [{ id: 1, name: 'Test' }];

  it('exportToCSV llama a saveAs con el blob correcto', () => {
    exportToCSV(mockData, 'test_file');
    
    expect(saveAs).toHaveBeenCalled();
    // Verificamos que el primer argumento sea un Blob
    const blobArg = saveAs.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    // Verificamos el nombre del archivo
    expect(saveAs.mock.calls[0][1]).toMatch(/test_file.*\.csv/);
  });

  it('exportToTXT genera formato legible', () => {
    exportToTXT(mockData, 'test_txt');
    
    expect(saveAs).toHaveBeenCalled();
    const blobArg = saveAs.mock.calls[0][0];
    expect(blobArg.type).toContain('text/plain');
  });
});