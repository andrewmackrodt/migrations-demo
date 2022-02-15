import { QueryInterface, Sequelize } from 'sequelize'

export enum MigrationStatus {
    STARTED   = 'started',
    FINISHED  = 'finished',
    FAILED    = 'failed',
}

export abstract class Migration {
    public readonly id: string
    public readonly name: string
    protected readonly db: Sequelize

    public constructor(db: Sequelize) {
        const names: string[] = Object.getPrototypeOf(this).constructor.name.split('_')
        this.id = names.pop()!
        this.name = names.join('_')
        this.db = db
    }

    public get dbal(): QueryInterface {
        return this.db.getQueryInterface()
    }

    public abstract up(): Promise<void>
    public abstract down(): Promise<void>
}
