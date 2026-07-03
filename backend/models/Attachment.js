import { DataTypes } from 'sequelize'
import sequelize from '../lib/database.js'

const Attachment = sequelize.define(
  'Attachment',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    ticket_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    file_size: DataTypes.INTEGER,
    file_type: DataTypes.STRING(100),
    mime_type: DataTypes.STRING(100),
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'attachments',
    timestamps: false
  }
)

export default Attachment
