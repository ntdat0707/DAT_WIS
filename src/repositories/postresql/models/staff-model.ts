import { Model, DataTypes, Sequelize } from 'sequelize';
import { GroupStaffModel } from './group-staff-model';
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
      field: 'staff_id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    password: { type: DataTypes.STRING, allowNull: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    gender: { type: DataTypes.TINYINT },
    phone: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    birthDate: { type: DataTypes.DATE },
    passportNumber: { type: DataTypes.STRING },
    groupStaffId: { type: DataTypes.UUIDV4, allowNull: false },
    createdAt: {
      field: 'created_at',
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      field: 'updated_at',
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
    }
  }
);

StaffModel.belongsTo(GroupStaffModel, { foreignKey: 'groupStaffId', targetKey: 'groupStaffId' });

export { StaffModel };
