FROM php:8.3-fpm

# System dependencies needed to compile PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip

# PHP extensions Laravel 13 needs
RUN docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd

# Copy Composer from its official image — no need to install it manually
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

RUN composer install --no-interaction --optimize-autoloader

# Laravel needs write access to these two folders
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]
