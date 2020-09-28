import * as express from 'express';
import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { DealController } from '../controllers/deal-controller';
require('dotenv').config();

export class DealRoutes {
  public router: express.Router = express.Router();
  private dealController = new DealController();

  constructor() {
    this.config();
  }

  private config(): void {
    this.router.get('/all-pipeline', isAuthenticated, this.dealController.getAllPipeline);
    this.router.post('/create-pipeline', isAuthenticated, this.dealController.createPipeline);
    this.router.put('/update-pipeline/:pipelineId?', isAuthenticated, this.dealController.updatePipeline);
    this.router.delete('/delete-pipeline/:pipelineId?', isAuthenticated, this.dealController.deletePipeline);
    this.router.get(
      '/get-pipelineStage/:pipelineId?',
      isAuthenticated,
      this.dealController.getPipelineStageByPipelineId
    );
    this.router.post('/setting-pipelineStage/:pipelineId?', isAuthenticated, this.dealController.settingPipelineStage);
    this.router.get('/get-all-deal', isAuthenticated, this.dealController.getAllDeal);
    this.router.post('/create-deal', isAuthenticated, this.dealController.createDeal);
    this.router.get('/get-deal/:dealId?', isAuthenticated, this.dealController.getDealById);
  }
}
