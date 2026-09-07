# صورة جاهزة تجمع Nginx + PHP-FPM، وهي الطريقة الموثّقة رسميًا من Render لنشر Laravel
# المرجع: https://render.com/docs/deploy-php-laravel-docker
FROM richarvey/nginx-php-fpm:3.1.6

COPY . .

# إعدادات الصورة
ENV SKIP_COMPOSER=1
ENV WEBROOT=/var/www/html/public
ENV PHP_ERRORS_STDERR=1
ENV RUN_SCRIPTS=1
ENV REAL_IP_HEADER=1

# إعدادات Laravel الافتراضية للإنتاج (يمكن تجاوزها من متغيرات البيئة في Render)
ENV APP_ENV=production
ENV APP_DEBUG=false
ENV LOG_CHANNEL=stderr

# السماح لـ composer بالعمل كـ root داخل الحاوية
ENV COMPOSER_ALLOW_SUPERUSER=1

CMD ["/start.sh"]
