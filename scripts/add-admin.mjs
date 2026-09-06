// Добавляет пользователя в таблицу admin_users по его userId

import {isGuid} from '../src/backend/security.ts'
import {db} from '../src/backend/db/sqlite.ts'

const userId = process.argv[2]?.trim()

if (!userId) {
    console.error('Использование: bun run addadmin <userId>')
    process.exit(1)
}

if (!isGuid(userId)) {
    console.error(`[addadmin] "${userId}" не похож на userId (ожидается GUID вида xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)`)
    process.exit(1)
}

db.prepare(
    `INSERT INTO admin_users (userId, addedAt)
     VALUES (?, ?) ON CONFLICT(userId) DO
    UPDATE SET addedAt = excluded.addedAt`,
).run(userId, new Date().toISOString())

console.log(`[addadmin] ${userId} добавлен в admin_users`)
