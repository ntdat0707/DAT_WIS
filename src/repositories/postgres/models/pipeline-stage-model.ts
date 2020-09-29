import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class PipelineStageModel extends Model {
  public id: string;
  public pipelineId!: string;
  public name!: string;
  public rottingIn: number;
  public order: number;
  public probability: number;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

PipelineStageModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    pipelineId: {
      field: 'pipeline_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    name: {
      field: 'name',
      type: DataTypes.STRING(255),
      allowNull: false
    },
    rottingIn: {
      type: DataTypes.TINYINT,
      field: 'rotting_in',
      defaultValue: 0
    },
    order: {
      type: DataTypes.TINYINT,
      field: 'order'
    },
    probability: {
      field: 'probability',
      type: DataTypes.TINYINT,
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
    tableName: 'pipeline_stage',
    timestamps: true,
    paranoid: true
  }
);

export { PipelineStageModel };
