import * as express from 'express';
import { uploadAsMiddleware } from '../../../utils/file-manager';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { MedicalDocumentController } from '../controllers/medical-document-controller';

export class MedicalDocumentRoutes {
  public router: express.Router = express.Router();
  private medicalDocumentController = new MedicalDocumentController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.post(
      '/create-file',
      isAuthenticated,
      uploadAsMiddleware('photo'),
      this.medicalDocumentController.createMedicalDocumentFile
    );
    this.router.get(
      '/get-all-medical-document/:treatmentId',
      isAuthenticated,
      this.medicalDocumentController.getAllMedicalDocument
    );
    this.router.get(
      '/get-medical-document/:medicalDocumentId',
      isAuthenticated,
      this.medicalDocumentController.getMedicalDocument
    );
    this.router.delete(
      '/delete-file/:medicalFileId',
      isAuthenticated,
      this.medicalDocumentController.deleteMedicalFile
    );
  }
}
