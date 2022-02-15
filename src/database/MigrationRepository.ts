import { DataTypes, QueryTypes, Sequelize } from 'sequelize'
import { Migration, MigrationStatus } from './Migration'

function now(): string {
    return new Date().toISOString().replace(/\.[0-9]+Z$/, '')
}

export class MigrationRepository {
    protected readonly db: Sequelize

    public constructor(db: Sequelize) {
        this.db = db
    }

    public async hasMigrationsTable(): Promise<boolean> {
        const res = await this.db.query(
            "SELECT COUNT(name) AS count FROM sqlite_master WHERE type = 'table' AND name = 'migrations'", {
                type: QueryTypes.SELECT,
            }) as [{ count: number }]

        return res[0].count > 0
    }

    public async createMigrationsTable(): Promise<void> {
        await this.db.getQueryInterface().createTable('migrations', {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            started_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            finished_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM,
                values: [
                    MigrationStatus.STARTED,
                    MigrationStatus.FINISHED,
                    MigrationStatus.FAILED,
                ],
                defaultValue: MigrationStatus.STARTED,
            },
            batch: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        })

        await this.db.getQueryInterface().addIndex('migrations', { name: 'migrations_status_idx', fields: ['status'] })
        await this.db.getQueryInterface().addIndex('migrations', { name: 'migrations_batch_idx', fields: ['batch'] })
    }

    public async setMigrationStarted(migration: Migration, batch: string): Promise<void> {
        await this.db.query(
            'INSERT INTO migrations (id, name, started_at, batch) VALUES (?, ?, ?, ?)', {
                type: QueryTypes.INSERT,
                replacements: [migration.id, migration.name, now(), batch],
            })
    }

    public async setMigrationFinished(
        migration: Migration,
        status: MigrationStatus.FINISHED | MigrationStatus.FAILED,
    ): Promise<void> {
        await this.db.query(
            'UPDATE migrations SET finished_at = ?, status = ? WHERE id = ? AND name = ?', {
                type: QueryTypes.UPDATE,
                replacements: [now(), status, migration.id, migration.name],
            })
    }

    public async getIncompleteCount(): Promise<number> {
        const res = await this.db.query(
            'SELECT COUNT(id) AS count FROM migrations WHERE status != ?', {
                type: QueryTypes.SELECT,
                replacements: [ MigrationStatus.FINISHED],
            }) as [{ count: number }]

        return res[0].count
    }

    public async getCompletedIds(): Promise<string[]> {
        const rows: { id: string}[] = await this.db.query(
            'SELECT id FROM migrations ORDER BY id', {
                type: QueryTypes.SELECT,
            })

        return rows.map(row => row.id)
    }
}
