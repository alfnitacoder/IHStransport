# Using the remote database server (172.16.0.68)

The backend is configured to use **PostgreSQL** on the database server at **172.16.0.68**.

## On this machine (app server)

1. **Copy env and set the DB password**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `DB_HOST=172.16.0.68` and `DB_PASSWORD` to the same password used for `bus_user` on the database server.

2. **First-time setup (if the database is empty)**
   ```bash
   npm run migrate:pg
   ```
   This creates tables and the default admin user (admin / admin123).

3. **Start the backend**
   ```bash
   npm start
   ```
   You should see: `Using PostgreSQL at 172.16.0.68`

## On the database server (172.16.0.68)

- **postgresql.conf:** `listen_addresses = '*'`
- **pg_hba.conf:** Allow this app server’s IP for database `bus_cashless`, user `bus_user`, method `scram-sha-256`
- **Firewall:** Allow port 5432 from this app server

**If you see "Connection refused"** (e.g. `nc -zv 172.16.0.68 5432`): nothing is accepting TCP on 5432. On 172.16.0.68 ensure PostgreSQL is running, `listen_addresses` is not `localhost` only, and the firewall allows port 5432.

## Test connection

From the backend directory (no `psql` required):
```bash
npm run db:test
```
Or with `psql` if installed:
```bash
psql -h 172.16.0.68 -p 5432 -U bus_user -d bus_cashless -c "SELECT 1;"
```
If either works, the backend will connect using the host, port, user, and password in `.env`.

## Fix "no pg_hba.conf entry" error

If `npm run db:test` fails with:  
`no pg_hba.conf entry for host "172.16.0.25", user "bus_user", database "bus_cashless"`

Then on the **database server (172.16.0.68)** add a line to `pg_hba.conf` (use the IP from the error):

```
host    bus_cashless    bus_user    172.16.0.25/32    scram-sha-256
```

Or allow the whole subnet: `172.16.0.0/16`. Save, then reload PostgreSQL:

```bash
sudo systemctl reload postgresql
```

(or `pg_ctl reload` if you're not using systemd).

Then from the app server run again:

```bash
cd backend && npm run db:test
```

You need access to 172.16.0.68 (or someone who does) to change `pg_hba.conf`; the app repo can't change that file for you.
