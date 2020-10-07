import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
import { ESource, ELabel } from '../../../utils/consts';
class CustomerWisereModel extends Model {
  public id: string;
  public firstName!: string;
  public lastName!: string;
  public gender: number;
  public phone!: string;
  public email: string;
  public birthDate: Date;
  public passportNumber: string;
  public address: string;
  public companyId!: string;
  public otpCode: string;
  public avatarPath: string;
  public ownerId: string;
  public source: string;
  public code: string;
  public label: string;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

CustomerWisereModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name'
    },
    gender: {
      type: DataTypes.TINYINT,
      field: 'gender',
      allowNull: true
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
    code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      field: 'code'
    },
    birthDate: {
      type: DataTypes.DATE,
      field: 'birth_date'
    },
    passportNumber: {
      type: DataTypes.STRING,
      field: 'passport_number'
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'address'
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    otpCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'otp_code'
    },
    avatarPath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'avatar_path'
    },
    ownerId: {
      field: 'owner_id',
      type: DataTypes.UUIDV4,
      allowNull: true
    },
    source: {
      type: DataTypes.ENUM(
        ESource.FACEBOOK,
        ESource.MARKETPLACE,
        ESource.OTHER,
        ESource.SHOPEE,
        ESource.WISERE,
        ESource.ZALO
      ),
      allowNull: true,
      field: 'source',
      defaultValue: ESource.OTHER
    },
    label: {
      type: DataTypes.ENUM(ELabel.COLD_LEAD, ELabel.CUSTOMER, ELabel.HOT_LEAD, ELabel.NONE, ELabel.WARM_LEAD),
      allowNull: true,
      field: 'label',
      defaultValue: ELabel.NONE
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
    tableName: 'customer_wisere',
    scopes: {},
    timestamps: true,
    paranoid: true
  }
);

export { CustomerWisereModel };
