# Wait a few seconds for the database to start up, then:
# Copy the init.sql file into the container
docker cp db/init.sql krokobil-db-1:/init.sql

# Run the init script inside the container
docker exec -i krokobil-db-1 psql -U postgres -d rideshare -f /init.sql
