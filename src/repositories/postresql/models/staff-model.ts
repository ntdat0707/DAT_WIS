import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
class StaffModel extends Model {
  public id: string;
  public fullName!: string;
  public gender: number;
  public phone: string;
  public password: string;
  public email: string;
  public birthDate: Date;
  public passportNumber: string;
  public groupStaffId: string;
  public isBusinessAccount: boolean;
  public locationId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

StaffModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'password'
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'full_name'
    },
    gender: {
      type: DataTypes.TINYINT,
      field: 'gender'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
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
    groupStaffId: {
      type: DataTypes.UUIDV4,
      allowNull: true,
      field: 'group_staff_id'
    },
    isBusinessAccount: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_business_account'
    },
    locationId: {
      field: 'location_id',
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
    tableName: 'staff',
    scopes: {
      safe: {
        attributes: {
          exclude: ['password']
        }
      }
    },
    timestamps: true,
    paranoid: true
  }
);

export { StaffModel };
