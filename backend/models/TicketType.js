import { DataTypes } from 'sequelize'
import sequelize from '../lib/database.js'

const TicketType = sequelize.define(
  'TicketType',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    description: DataTypes.TEXT,
    icon: DataTypes.STRING(100),
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'ticket_types',
    timestamps: false
  }
)

export default TicketType
