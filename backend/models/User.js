import { DataTypes } from 'sequelize'
import sequelize from '../lib/database.js'

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password_hash: DataTypes.STRING(255),
    full_name: DataTypes.STRING(255),
    role: {
      type: DataTypes.ENUM('user', 'agent', 'admin'),
      allowNull: false,
      defaultValue: 'user'
    },
    phone: DataTypes.STRING(50),
    job_title: DataTypes.STRING(255),
    company: DataTypes.STRING(255),
    avatar_url: DataTypes.TEXT,
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_login: DataTypes.DATE
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
)

export default User
