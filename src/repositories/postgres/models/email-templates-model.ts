import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';

class EmailTemplatesModel extends Model {
  public id: string;
  public templateName: string;
  public emailSubject: string;
  public emailText: string;
  public createdAt!: Date;
  public readonly deletedAt: Date;
  public updatedAt: Date;
}
EmailTemplatesModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    templateName: {
      field: 'template_name',
      type: DataTypes.STRING,
      allowNull: false
    },
    emailSubject: {
      field: 'email_subject',
      type: DataTypes.STRING,
      allowNull: false
    },
    emailText: {
      field: 'email_text',
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
export { EmailTemplatesModel };
