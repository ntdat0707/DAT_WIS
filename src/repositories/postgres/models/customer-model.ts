import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
class CustomerModel extends Model {
  public id: string;
  public fullName!: string;
  public gender: number;
  public phone!: string;
  public email: string;
  public birthDate: Date;
  public passportNumber: string;
  public address: string;
  public companyId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

CustomerModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'full_name'
    },
    gender: {
      type: DataTypes.TINYINT,
      field: 'gender',
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'phone'
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      field: 'email'
    },
    birthDate: {
      type: DataTypes.DATE,
      field: 'birth_date'
    },
    passportNumber: {
      type: DataTypes.STRING,
      field: 'passport_number'
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'address'
    },
    companyId: {
      field: 'company_id',
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    deletedAt: {
      field: 'deleted_at',
      type: 'TIMESTAMP',
      defaultValue: null
    }
  },
  {
    sequelize: sequelize,
    freezeTableName: true,
    tableName: 'customer',
    // scopes: {},
    timestamps: true,
    paranoid: true
  }
);

export { CustomerModel };
