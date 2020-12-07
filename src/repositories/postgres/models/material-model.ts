import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class MaterialModel extends Model {
  public id: string;
  public code!: string;
  public nameVi: string;
  public name: string;
  public path: string;
  public unit!: string;
  public price: number;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

MaterialModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      field: 'code',
      type: DataTypes.STRING,
      allowNull: true
    },
    nameVi: {
      field: 'name_vi',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    name: {
      field: 'name',
      type: DataTypes.STRING(255),
      allowNull: false
    },
    path: {
      field: 'path',
      type: DataTypes.TEXT,
      allowNull: true
    },
    unit: {
      field: 'unit',
      type: DataTypes.STRING,
      allowNull: true
    },
    price: {
      field: 'price',
      type: DataTypes.NUMBER,
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
    tableName: 'material',
    timestamps: true,
    paranoid: true
  }
);

export { MaterialModel };
