import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
import { ETypeMarketPlaceField } from '../../../utils/consts';

class MarketPlaceFieldsModel extends Model {
  public id: string;
  public type!: string;
  public name!: string;
  public options?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

MarketPlaceFieldsModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      field: 'type',
      type: DataTypes.ENUM(...Object.keys(ETypeMarketPlaceField)),
      allowNull: false
    },
    name: {
      field: 'name',
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    options: {
      field: 'options',
      type: DataTypes.STRING,
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
    tableName: 'marketplace_fields',
    timestamps: true,
    paranoid: true
  }
);

export { MarketPlaceFieldsModel };
