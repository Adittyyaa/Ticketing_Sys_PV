import { DataTypes } from 'sequelize'
import sequelize from '../lib/database.js'

const Category = sequelize.define(
  'Category',
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
    color: {
      type: DataTypes.STRING(50),
      defaultValue: '#3B82F6'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'categories',
    timestamps: false
  }
)

export default Category
