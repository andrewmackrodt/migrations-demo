import { MigrationService } from './database/MigrationService'
import { Sequelize } from 'sequelize'
import path from 'path'

export const db = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '../demo.db'),
    logging: false,
})

const migrationService = new MigrationService(db)

void migrationService.run()
