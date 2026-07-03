import { DataTypes } from 'sequelize'
import sequelize from '../lib/database.js'

const Ticket = sequelize.define(
  'Ticket',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    number: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      unique: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category_id: DataTypes.UUID,
    type_id: DataTypes.UUID,
    product: DataTypes.STRING(100),
    product_reference_number: DataTypes.STRING(255),
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      allowNull: false,
      defaultValue: 'MEDIUM'
    },
    status: {
      type: DataTypes.ENUM('UNTOUCHED', 'PENDING', 'OPENED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'SOLVED', 'CLOSED'),
      allowNull: false,
      defaultValue: 'UNTOUCHED'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: []
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    assigned_to: DataTypes.UUID,
    resolved_at: DataTypes.DATE
  },
  {
    tableName: 'tickets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
)

export default Ticket
