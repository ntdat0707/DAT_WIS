import { Model, DataTypes, Sequelize } from 'sequelize';
import { ETeamStaffType } from '../../../utils/consts';

import sequelize from '../configs/db-connector';
class TeamStaffModel extends Model {
  public id: string;
  public staffId!: string;
  public teamId!: string;
  public position: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

TeamStaffModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    staffId: {
      field: 'staff_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    teamId: {
      field: 'team_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    position: {
      field: 'position',
      type: DataTypes.ENUM(...Object.values(ETeamStaffType)),
      allowNull: false,
      defaultValue: ETeamStaffType.MEMBER
    },
    createdAt: {
      field: 'created_at',
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      field: 'updated_at',
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    deletedAt: {
      field: 'deleted_at',
      type: 'TIMESTAMP',
      defaultValue: null
    }
  },
  {
    sequelize,
    freezeTableName: true,
    tableName: 'team_staff'
  }
);

export { TeamStaffModel };
