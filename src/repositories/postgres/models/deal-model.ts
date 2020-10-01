import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class DealModel extends Model {
  public id: string;
  public dealTitle!: string;
  public customerWisereId: string;
  public source: string;
  public amount: number;
  public currency: string;
  public note: string;
  public ownerId: string;
  public pipelineStageId: string;
  public status: string;
  public expectedCloseDate: Date;
  public closingDate: Date;
  public probability: number;
  public createdBy: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

DealModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    dealTitle: {
      field: 'deal_title',
      type: DataTypes.STRING,
      allowNull: true
    },
    customerWisereId: {
      field: 'customer_wisere_id',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    source: {
      field: 'source',
      type: DataTypes.STRING,
      allowNull: true
    },
    amount: {
      field: 'amount',
      type: DataTypes.TINYINT
    },
    currency: {
      field: 'currency',
      type: DataTypes.STRING,
      allowNull: true
    },
    note: {
      field: 'note',
      type: DataTypes.STRING,
      allowNull: true
    },
    ownerId: {
      field: 'owner_id',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    pipelineStageId: {
      field: 'pipeline_stage_id',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    status: {
      field: 'status',
      type: DataTypes.STRING,
      defaultValue: 'Open'
    },
    expectedCloseDate: {
      field: 'expected_close_date',
      type: DataTypes.DATE,
      allowNull: true
    },
    closingDate: {
      field: 'closing_date',
      type: DataTypes.DATE,
      allowNull: true
    },
    probability: {
      field: 'probability',
      type: DataTypes.TINYINT,
      allowNull: true
    },
    createdBy: {
      field: 'created_by',
      type: DataTypes.UUIDV4,
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
    tableName: 'deal',
    timestamps: true,
    paranoid: true
  }
);

export { DealModel };
