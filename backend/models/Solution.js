import { DataTypes } from 'sequelize'
import sequelize from '../lib/database.js'

const Solution = sequelize.define(
  'Solution',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    steps: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category_id: DataTypes.UUID,
    tags: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: []
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    helpful_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    created_by: DataTypes.UUID
  },
  {
    tableName: 'solutions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
)

export default Solution
