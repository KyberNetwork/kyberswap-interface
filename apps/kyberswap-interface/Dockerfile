FROM nginx:alpine

COPY ./build /var/www

COPY ./etc/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./etc/csp.conf /etc/nginx/conf.d/csp.conf

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
