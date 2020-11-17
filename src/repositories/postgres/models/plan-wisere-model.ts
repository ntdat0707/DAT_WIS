import { Model, DataTypes } from 'sequelize';

import sequelize from '../configs/db-connector';
import { EBusinessPlanType } from '../../../utils/consts';

class PlanWisereModel extends Model {
  public id: string;
  public companyId!: string;
  public businessPlanType: string;
  public startedPlanAt!: Date;
  public endPlantAt!: Date;
  public isActivated: boolean;
  public deletedAt: Date;
}
PlanWisereModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    businessPlanType: {
      field: 'sms_plan_type',
      type: DataTypes.ENUM(EBusinessPlanType.STANDARD, EBusinessPlanType.BASIC, EBusinessPlanType.PREMIUM),
      allowNull: false,
      defaultValue: EBusinessPlanType.BASIC
    },
    startedPlanAt: {
      field: 'started_plan_at',
      type: 'TIMESTAMP',
      allowNull: false
    },
    endPlanAt: {
      field: 'end_plan_at',
      type: 'TIMESTAMP',
      allowNull: false
    },
    isActivated: {
      field: 'is_activated',
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deletedAt: {
      field: 'deleted_at',
      type: 'TIMESTAMP',
      allowNull: true
    }
  },
  {
    sequelize,
    freezeTableName: true,
    tableName: 'sms_wisere',
    timestamps: true,
    paranoid: true
  }
);

export { PlanWisereModel };
