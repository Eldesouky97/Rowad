#!/bin/bash
set -e

php artisan config:cache
php artisan route:cache

# محاولات بسيطة لتشغيل المايجريشن في حال كانت قاعدة البيانات الخارجية لسه بتبدأ
for i in 1 2 3 4 5; do
    if php artisan migrate --force; then
        break
    fi
    echo "migrate failed, retrying in 5s... ($i/5)"
    sleep 5
done

exec apache2-foreground
