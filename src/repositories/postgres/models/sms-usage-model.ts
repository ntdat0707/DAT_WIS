import { float } from 'aws-sdk/clients/lightsail';
import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class SmsUsageModel extends Model {
  public id: string;
  public planId!: string;
  public numberAllowed!: number;
  public smsUsage: number;
  public overCost: float;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}
SmsUsageModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    planId: {
      field: 'plan_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    numberAllowed: {
      field: 'number_allowed',
      type: DataTypes.INTEGER,
      allowNull: false
    },
    smsUsage: {
      field: 'sms_usage',
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    overCost: {
      field: 'over_cost',
      type: DataTypes.FLOAT,
      allowNull: true
    },
    createdAt: {
      field: 'created_at',
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      field: 'updated_at',
      type: 'TIMESTAMP',
      defaultValue: null
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
    tableName: 'sms_usage',
    timestamps: true,
    paranoid: true
  }
);
export { SmsUsageModel };
