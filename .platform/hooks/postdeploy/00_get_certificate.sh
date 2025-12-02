#!/usr/bin/env bash
# .platform/hooks/postdeploy/00_get_certificate.sh

# Install or renew the certificate.
# We use --nginx which attempts to configure nginx.
# If the cert is already valid, 'certbot run' (default) often skips the installation step.
sudo certbot -n -d ellarisessola.is404.net --nginx --agree-tos --email osidesky@byu.edu --redirect

# Explicitly run the install command to ensure the Nginx configuration is updated 
# even if the certificate was already present (which happens on re-deployments).
sudo certbot install --nginx -n -d ellarisessola.is404.net

# Reload Nginx to ensure changes take effect
sudo systemctl reload nginx
