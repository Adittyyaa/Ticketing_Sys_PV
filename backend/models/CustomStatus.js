import { DataTypes } from 'sequelize'
import sequelize from '../lib/database.js'

const CustomStatus = sequelize.define(
  'CustomStatus',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '#10B981'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'custom_statuses',
    timestamps: false
  }
)

export default CustomStatus
