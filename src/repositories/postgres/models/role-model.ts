import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
import { EStatusRole } from '../../../utils/consts';

class RoleModel extends Model {
  public id: string;
  public roleName!: string;
  public description: string;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

RoleModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    roleName: {
      field: 'role_name',
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      field: 'description',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      field: 'status',
      type: DataTypes.ENUM(...Object.values(EStatusRole)),
      defaultValue: EStatusRole.INACTIVE
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
    tableName: 'role',
    timestamps: true,
    paranoid: true
  }
);

export { RoleModel };
