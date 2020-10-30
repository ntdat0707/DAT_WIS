import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
import { EContactType } from '../../../utils/consts';

class ContactModel extends Model {
  public id: string;
  public customerWisereId!: string;
  public email: string;
  public phone: string;
  public type!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

ContactModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customerWisereId: {
      field: 'customer_wisere_id',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    email: {
      field: 'email',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone: {
      field: 'phone',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    type: {
      field: 'type',
      type: DataTypes.ENUM(...Object.values(EContactType)),
      allowNull: false,
      defaultValue: EContactType.WORK
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
    tableName: 'contact',
    timestamps: true,
    paranoid: true
  }
);

export { ContactModel };
