1. initialize postgres service
   `sudo service postgresql start`

2. get into it
   `sudo -u postgres pqsl`

3. create new user
   `CREATE ROLE myuser WITH LOGIN PASSWORD 'mypassword';`

4. create database
   `CREATE DATABASE mydatabase;`

5. grants all permissions

```
GRANT ALL ON SCHEMA public TO hyperchessuser;
GRANT ALL ON ALL TABLES IN SCHEMA "public" TO hyperchessuser;
GRANT ALL ON DATABASE your_database TO hyperchessuser;
ALTER DATABASE your_database OWNER TO hyperchessuser;
GRANT USAGE, CREATE ON SCHEMA PUBLIC TO hyperchessuser;
```

1. url:
   `postgresql://myuser:mypassword@localhost/mydatabase`
