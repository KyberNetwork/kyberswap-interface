FROM nginx:alpine

COPY ./dist /var/www

COPY ./etc/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
