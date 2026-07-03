import { DataTypes } from 'sequelize'
import sequelize from '../lib/database.js'

const Tag = sequelize.define(
  'Tag',
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
    color: {
      type: DataTypes.STRING(50),
      defaultValue: '#6B7280'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'tags',
    timestamps: false
  }
)

export default Tag
