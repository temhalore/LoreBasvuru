// TODO: Hiçbir yerde kullanılmıyor. Kaldırılacak!

import { FileModel } from '../models/common/file.model';
import { KodModel } from '../models/common/kod.model';

export class FileToBase64Service {
  constructor() { }

  // Çoklu dosyayı FileModel'e çeviren metod
  static async convertFilesToFileModel(files: File[]): Promise<FileModel[]> {
    const promises = files.map(file => this.convertFileToFileModel(file));
    return Promise.all(promises);
  }

  // Tek dosyayı FileModel'e çeviren metod
  static convertFileToFileModel(file: File): Promise<FileModel> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          const base64Data = reader.result.split(',')[1];

          const fileModel: FileModel = {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            lastModified: file.lastModified,
            lastModifiedDate: new Date(file.lastModified),
            base64File: base64Data,
            fileTypeCodeDto: new KodModel(), // Dosya tipi kodu (örn: 'application/pdf', 'image/jpeg')
            eid: ''
          };

          resolve(fileModel);
        }
      };

      reader.onerror = () => {
        reject(new Error(`Dosya okuma hatası: ${file.name}`));
      };

      reader.readAsDataURL(file);
    });
  }

  // Çoklu dosyayı base64'e çeviren metod
  static async convertFilesToBase64(files: File[]): Promise<{ fileName: string, base64: string }[]> {
    const promises = files.map(file => this.convertFileToBase64(file));
    return Promise.all(promises);
  }

  // Tek dosyayı base64'e çeviren metod
  static convertFileToBase64(file: File): Promise<{ fileName: string, base64: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          const base64Data = reader.result.split(',')[1];
          resolve({
            fileName: file.name,
            base64: base64Data
          });
        }
      };

      reader.onerror = () => {
        reject(new Error(`Dosya okuma hatası: ${file.name}`));
      };

      reader.readAsDataURL(file);
    });
  }
}