import { Model, DataTypes, Sequelize } from 'sequelize';
import { EPaymentMethodType } from '../../../utils/consts';
import sequelize from '../configs/db-connector';

class PaymentMethodModel extends Model {
  public id: string;
  public companyId!: string;
  public paymentType: string;
  public paymentTypeNumber: number; //1:cash, 2:card, 3:waller, 4:other
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}
PaymentMethodModel.init(
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
    paymentType: {
      field: 'payment_type',
      type: DataTypes.ENUM(...Object.values(EPaymentMethodType)),
      defaultValue: EPaymentMethodType.CASH
    },
    paymentTypeNumber: {
      field: 'payment_type_number',
      type: DataTypes.INTEGER,
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
    tableName: 'payment_method',
    timestamps: true,
    paranoid: true
  }
);

export { PaymentMethodModel };
