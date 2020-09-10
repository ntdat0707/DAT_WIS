import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
import { ELocationStatus, EPayment, EParkingStatus, EFavorite } from '../../../utils/consts';

class LocationModel extends Model {
  public id: string;
  public companyId!: string;
  public name!: string;
  public phone!: string;
  public email: string;
  public photo: string;
  public status!: ELocationStatus;
  public city: string;
  public district: string;
  public ward: string;
  public address: string;
  public latitude: number;
  public longitude: number;
  public title?: string;
  public payment?: EPayment;
  public parking?: EParkingStatus;
  public rating?: number;
  public recoveryRooms?: number;
  public totalBookings?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
  public openedAt?: Date;
}

LocationModel.init(
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
    name: {
      field: 'name',
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      field: 'phone',
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      field: 'email',
      type: DataTypes.STRING
    },
    photo: {
      field: 'photo',
      type: DataTypes.STRING
    },
    status: {
      field: 'status',
      type: DataTypes.ENUM(ELocationStatus.ACTIVE, ELocationStatus.INACTIVE),
      defaultValue: ELocationStatus.ACTIVE
    },
    city: {
      field: 'city',
      type: DataTypes.STRING,
      allowNull: true
    },
    district: {
      field: 'district',
      type: DataTypes.STRING,
      allowNull: true
    },
    ward: {
      field: 'ward',
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      field: 'address',
      type: DataTypes.STRING,
      allowNull: true
    },
    latitude: {
      field: 'latitude',
      type: DataTypes.STRING,
      defaultValue: 0
    },
    longitude: {
      field: 'longitude',
      type: DataTypes.STRING,
      defaultValue: 0
    },
    title: {
      field: 'title',
      type: DataTypes.STRING,
      allowNull: true
    },
    payment: {
      field: 'payment',
      type: DataTypes.ENUM(EPayment.CASH, EPayment.CARD,EPayment.ALL),
      defaultValue: EPayment.ALL
    },
    parking: {
      field: 'parking',
      type: DataTypes.ENUM(EParkingStatus.ACTIVE, EParkingStatus.INACTIVE),
      defaultValue: EParkingStatus.ACTIVE
    },
    rating: {
      field: 'rating',
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    recoveryRooms: {
      field: 'recovery_rooms',
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalBookings: {
      field: 'total_bookings',
      type: DataTypes.INTEGER,
      defaultValue: 0
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
    },
    openedAt: {
      field: 'opened_at',
      type: 'TIMESTAMP',
      defaultValue: null
    },
  },
  {
    sequelize,
    freezeTableName: true,
    tableName: 'location',
    timestamps: true,
    paranoid: true
  }
);

export { LocationModel };
