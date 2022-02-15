import { Migration, MigrationStatus } from './Migration'
import { MigrationRepository } from './MigrationRepository'
import { Sequelize } from 'sequelize'
import { randomUUID } from 'crypto'
import glob from 'glob'
import path from 'path'

const isTs = Boolean(process.env.TS_NODE_DEV || (<any>process)[Symbol.for('ts-node.register.instance')])
const ext = isTs ? 'ts' : 'js'
const migrationsPath = path.resolve(__dirname, '../../migrations')

type RollbackOptions =
    { batch: string } |
    { id: string } |
    { step: number }

export class MigrationService {
    private readonly db: Sequelize
    private readonly repository: MigrationRepository

    public constructor(db: Sequelize) {
        this.db = db
        this.repository = new MigrationRepository(db)
    }

    public async run(): Promise<string> {
        const migrationsTableExists = await this.repository.hasMigrationsTable()

        if ( ! migrationsTableExists) {
            await this.repository.createMigrationsTable()
        }

        const incompleteCount = await this.repository.getIncompleteCount()

        if (incompleteCount > 0) {
            throw new Error('Failed to run migrations, at least one migration does not have status "finished"')
        }

        const completed = await this.repository.getCompletedIds()
        const batch = randomUUID()

        console.log(`Starting migrations batch=${batch}`)

        for (const migration of this.getAvailable()) {
            if (completed.includes(migration.id)) {
                console.log(`- ${migration.id}: ${migration.name}\t[Skipped]`)

                continue
            } else {
                console.log(`- ${migration.id}: ${migration.name}\t[Running]`)
            }

            await this.repository.setMigrationStarted(migration, batch)

            let migrationStatus = MigrationStatus.FAILED

            try {
                await migration.up()

                migrationStatus = MigrationStatus.FINISHED
            } finally {
                await this.repository.setMigrationFinished(migration, migrationStatus)
            }
        }

        return batch
    }

    public async rollback(options: RollbackOptions): Promise<void> {
        let migrations: Migration[] = []

        switch (true) {
            case 'batch' in options:
                migrations = []
                break
            case 'id' in options:
                migrations = []
                break
            case 'step' in options:
                migrations = []
                break
        }

        for (const migration of migrations) {
            console.log(`[${migration.id}]: ${migration.name}\tReverting`)
            await migration.down()
        }
    }

    private getAvailable(): Migration[] {
        const migrations: Migration[] = []

        /* eslint-disable @typescript-eslint/no-var-requires */
        glob.sync(`${migrationsPath}/*.${ext}`).map(filepath => {
            const ctor = require(filepath).default
            const migration = new ctor(this.db)

            migrations.push(migration)
        })
        /* eslint-enable @typescript-eslint/no-var-requires */

        return migrations
    }
}
