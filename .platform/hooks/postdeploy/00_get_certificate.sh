#!/usr/bin/env bash
# .platform/hooks/postdeploy/00_get_certificate.sh
sudo certbot -n -d ellarisessola.is404.net --nginx --agree-tos --email osidesky@byu.edu
