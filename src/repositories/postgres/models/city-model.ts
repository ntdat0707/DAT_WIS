import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class CityModel extends Model {
  public id: string;
  public name: string;
  public cityCode!: string;
  public countryId!: string;
  public countryCode!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

CityModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      field: 'name',
      type: DataTypes.STRING,
      allowNull: true
    },
    countryId: {
      field: 'country_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    countryCode: {
      field: 'country_code',
      type: DataTypes.STRING,
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
    tableName: 'city',
    timestamps: true,
    paranoid: true
  }
);

export { CityModel };