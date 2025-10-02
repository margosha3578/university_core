#!/bin/bash

# Wait for PostgreSQL to be ready using Python
echo "Waiting for PostgreSQL..."
python << END
import socket
import time

while True:
    try:
        sock = socket.create_connection(("db", 5432), timeout=1)
        sock.close()
        break
    except socket.error:
        time.sleep(0.1)
END
echo "PostgreSQL started"

# Show current working directory and its contents
echo "Current working directory: $(pwd)"
echo "Listing files and directories:"
ls -al

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Create superuser if it doesn't exist (only in development)
if [ "$DEBUG" = "True" ]; then
    echo "Creating superuser..."
    python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin / admin123')
else:
    print('Superuser already exists')
"
fi

# Collect static files (if not already done in Dockerfile)
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start server
echo "Starting server..."
exec "$@"
