FROM nginx:alpine

COPY ./build /var/www

COPY ./etc/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./etc/csp.conf /etc/nginx/conf.d/csp.conf
COPY ./build/swap-intent-redirects.map /etc/nginx/swap-intent-redirects.map

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
