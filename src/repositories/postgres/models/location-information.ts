import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '../configs/db-connector';
import { EPayment, EParkingStatus } from '../../../utils/consts';

class LocationInformationModel extends Model {
  public id: string;
  public title?: string;
  public locationId!: string;
  public payment?: EPayment;
  public parking?: EParkingStatus;
  public rating?: number;
  public recoveryRooms?: number;
  public totalBookings?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date;
}

LocationInformationModel.init(
  {
    id: {
      field: 'id',
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      field: 'title',
      type: DataTypes.STRING,
      allowNull: true
    },
    locationId: {
      field: 'location_id',
      type: DataTypes.UUIDV4,
      allowNull: false
    },
    payment: {
      field: 'payment',
      type: DataTypes.ENUM(EPayment.CASH, EPayment.CARD, EPayment.ALL),
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
    }
  },
  {
    sequelize,
    freezeTableName: true,
    tableName: 'location_information',
    timestamps: true,
    paranoid: true
  }
);

export { LocationInformationModel };
