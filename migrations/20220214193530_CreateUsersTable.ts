import { DataTypes } from 'sequelize'
import { Migration } from '../src/database/Migration'

export default class CreateUsersTable_20220214193530 extends Migration {
    public async up(): Promise<void> {
        await this.dbal.createTable('users', {
            id:     { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
            name:   { type: DataTypes.STRING, allowNull: false },
            email:  { type: DataTypes.STRING, allowNull: false },
        })

        await this.dbal.addIndex('users', { name: 'users_email_idx', fields: ['email'] })
    }

    public async down(): Promise<void> {
        await this.dbal.dropTable('users')
    }
}
