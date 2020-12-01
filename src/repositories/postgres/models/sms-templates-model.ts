import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class SmsTemplatesModel extends Model {
  public id: string;
  public companyId!: string;
  public templateName: string;
  public smsText: string;
  public createdAt!: Date;
  public readonly deletedAt: Date;
  public updatedAt: Date;
}
SmsTemplatesModel.init(
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
    templateName: {
      field: 'template_name',
      type: DataTypes.STRING,
      allowNull: false
    },
    smsText: {
      field: 'sms_text',
      type: DataTypes.STRING,
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
    tableName: 'email_templates',
    timestamps: true,
    paranoid: true
  }
);
export { SmsTemplatesModel };
