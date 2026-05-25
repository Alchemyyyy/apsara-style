# SABY ORDER SQL

This folder separates fresh-database setup from incremental migrations.

## Structure

```text
server/sql/
  schema/
    base.sql
    production.sql
  migrations/
    migrate_*.sql
```

## Fresh Production Database

Use the consolidated production schema for a new empty PostgreSQL database:

```bash
psql "$DATABASE_URL" -f server/sql/schema/production.sql
```

With split DB environment variables:

```bash
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f server/sql/schema/production.sql
```

## Existing Database

Use files in `migrations/` only when upgrading an existing database that was created from an older schema.

Run only the migrations that have not already been applied. Most migration files are written with `IF NOT EXISTS`, but data-changing migrations should still be reviewed before running on production.

Common migration order for older databases:

```bash
psql "$DATABASE_URL" -f server/sql/migrations/migrate_orders_add_session.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_orders_add_order_code.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_order_status_history.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_inventory_reservations.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_admin_auth_rbac.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_password_reset_tokens.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_categories_normalize_types.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_products_add_product_code.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_admin_audit_logs.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_admin_refresh_tokens.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_order_return_requests.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_order_return_status_history.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_orders_add_payment_fields.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_users_add_token_version.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_notifications.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_user_notification_preferences.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_wishlists_to_session.sql
```

## Notes

- `schema/production.sql` is the recommended file for a new VPS deployment.
- `schema/base.sql` is the consolidated application schema without the extra production header.
- Do not store database passwords or production dumps in this folder.
