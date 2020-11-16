import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class MedicalHistoryCustomerModel extends Model {
  public id: string;
  public customerWisereId!: string;
  public medicalHistoryId!: string;
  public note: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}
MedicalHistoryCustomerModel.init(
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
      allowNull: false
    },
    medicalHistoryId: {
      field: 'medical_history_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    note: {
      field: 'note',
      type: DataTypes.STRING(150),
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
    tableName: 'medical_history_customer',
    timestamps: true,
    paranoid: true
  }
);

export { MedicalHistoryCustomerModel };
