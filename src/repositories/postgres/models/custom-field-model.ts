import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
import { ETypeCustomField, ETypeOfPeople } from '../../../utils/consts';

class CustomFieldModel extends Model {
  public id: string;
  public companyId!: string;
  public name!: string;
  public type!: string;
  public options?: string;
  public typeOfPeople?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

CustomFieldModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    type: {
      field: 'type',
      type: DataTypes.ENUM(...Object.values(ETypeCustomField)),
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
      type: DataTypes.JSONB,
      allowNull: true
    },
    typeOfPeople: {
      field: 'type_of_people',
      type: DataTypes.ENUM(...Object.values(ETypeOfPeople)),
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
    tableName: 'custom_field',
    timestamps: true,
    paranoid: true
  }
);

export { CustomFieldModel };
