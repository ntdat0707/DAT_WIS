import * as express from 'express';
import { uploadAsMiddleware } from '../../../utils/file-manager';

import { isAuthenticated } from '../../../utils/middlewares/staff/auth';
import { TeamController } from '../controllers/team-controller';
require('dotenv').config();
export class TeamRoutes {
  public router: express.Router = express.Router();
  private teamController = new TeamController();
  constructor() {
    this.config();
  }
  private config(): void {
    this.router.get('/get-teams-location/:locationId', isAuthenticated, this.teamController.getTeamsLocation);
    this.router.post('/create-team', uploadAsMiddleware('photo'), isAuthenticated, this.teamController.createTeam);
    this.router.put(
      '/update-team/:teamId',
      uploadAsMiddleware('photo'),
      isAuthenticated,
      this.teamController.updateTeam
    );
    this.router.get('/get-sub-teams/:parentId', isAuthenticated, this.teamController.getSubTeams);
    this.router.get('/get-team/:teamId', isAuthenticated, this.teamController.getTeam);
  }
}
