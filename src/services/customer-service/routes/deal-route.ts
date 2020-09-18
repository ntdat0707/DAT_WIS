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
    this.router.get('/get-pipelineStage/:pipelineId?', isAuthenticated, this.dealController.getPipelineStageByPipelineId);
    this.router.post('/create-pipelineStage', isAuthenticated, this.dealController.createPipelineStage);
    this.router.put('/update-pipelineStage/:pipelineStageId?', isAuthenticated, this.dealController.updatePipelineStage);
    this.router.delete('/delete-pipelineStage/:pipelineStageId?', isAuthenticated, this.dealController.deletePipelineStage);
  }
}
