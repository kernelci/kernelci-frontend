FROM tiangolo/uwsgi-nginx-flask:python2.7

### Install dependencies

RUN apt-get update && apt-get install -y build-essential python2.7-dev uwsgi-plugin-python rsync nodejs

### Install application

# Install code dependencies
COPY requirements.txt /requirements.txt
RUN pip install -r /requirements.txt

# Copy source code
COPY app /app

# Remove unnecessary example
RUN rm main.py

# Create additional config folders
RUN mkdir /etc/linaro

# Copy application settings
RUN touch /etc/flask_settings
COPY etc/flask_settings /etc/linaro/kernelci-frontend.cfg

### Nginx configuration

# Create root directory
RUN mkdir -p /usr/share/nginx/html/kernelci \
    && chown www-data:www-data /usr/share/nginx/html/kernelci

# Copy and build static assets
RUN nodejs /app/dashboard/static/js/lib/r.js -o /app/dashboard/static/js/build.js \
    && rsync -a -u /tmp/assets-build/ /usr/share/nginx/html/kernelci/static

# COPY maintenance page
COPY html/maintenance.html /usr/share/nginx/html/kernelci/maintenance.html.not 

#  Nginx configuration
COPY etc/nginx.conf /etc/nginx/conf.d/kernelci.conf
COPY etc/upstreams.conf /etc/nginx/conf.d/frontend-upstreams.conf

### uWSGI configuration

# uWSGI configuration
COPY etc/uwsgi.ini /app/uwsgi.ini
