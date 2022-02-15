import { Migration } from '../src/database/Migration'

export default class UsersEmailUnique_20220214193540 extends Migration {
    public async up(): Promise<void> {
        await this.dbal.addConstraint('users', {
            name: 'users_email_unique',
            fields: ['email'],
            type: 'unique',
        })
    }

    public async down(): Promise<void> {
        await this.dbal.removeConstraint('users', 'users_email_unique')
    }
}
