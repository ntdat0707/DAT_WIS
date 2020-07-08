import { Model, DataTypes, Sequelize } from 'sequelize';

import { StaffModel } from './staff-model';

import sequelize from '../configs/db-connector';
class GroupStaffModel extends Model {
  public groupStaffId: string;
  public name!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

GroupStaffModel.init(
  {
    groupStaffId: {
      field: 'group_staff_id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
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
    tableName: 'group_staff'
  }
);

GroupStaffModel.hasMany(StaffModel, { foreignKey: 'goupStaffId', sourceKey: 'goupStaffId', as: 'staffs' });

export { GroupStaffModel };
