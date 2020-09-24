import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class CustomerSearchModel extends Model {
  public id!: string;
  public customerId!: string;
  public keywords!: string;
  public latitude: number;
  public longittude: number;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

CustomerSearchModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customerId: {
      field: 'customer_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    keywords: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'keywords'
    },
    latitude: {
      field: 'latitude',
      type: DataTypes.STRING,
      defaultValue: 0
    },
    longitude: {
      field: 'longitude',
      type: DataTypes.STRING,
      defaultValue: 0
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
    tableName: 'customer_search',
    timestamps: true,
    paranoid: true
  }
);

export { CustomerSearchModel };
