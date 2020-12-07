import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class ServiceMaterialModel extends Model {
  public id: string;
  public serviceId!: string;
  public materialId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

ServiceMaterialModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    serviceId: {
      field: 'service_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    materialId: {
      field: 'material_id',
      type: DataTypes.UUIDV4,
      allowNull: false
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
    tableName: 'service_material',
    timestamps: true,
    paranoid: true
  }
);

export { ServiceMaterialModel };
