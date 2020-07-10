import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
class StaffModel extends Model {
  public staffId: string;
  public fullName!: string;
  public gender: number;
  public phone!: string;
  public password: string;
  public email: string;
  public birthDate: Date;
  public passportNumber: string;
  public groupStaffId: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

StaffModel.init(
  {
    staffId: {
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
    groupStaffId: {
      type: DataTypes.UUIDV4,
      allowNull: false,
      field: 'group_staff_id'
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
