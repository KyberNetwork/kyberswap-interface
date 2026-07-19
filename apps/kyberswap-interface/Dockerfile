# Compile the ngx_brotli dynamic modules against the same nginx:alpine used below so `brotli_static`
# works in the final image (stock nginx:alpine ships no brotli). --with-compat keeps the resulting .so
# loadable across compatible nginx builds.
FROM nginx:alpine AS brotli-builder

RUN set -eux; \
    apk add --no-cache --virtual .build-deps git build-base cmake pcre-dev zlib-dev openssl-dev linux-headers; \
    NGINX_VERSION="$(nginx -v 2>&1 | sed -e 's|.*nginx/||')"; \
    git clone --depth 1 --recurse-submodules https://github.com/google/ngx_brotli.git /ngx_brotli; \
    # Build the bundled brotli static libs the module links against (-lbrotlienc/-lbrotlicommon).
    cd /ngx_brotli/deps/brotli && mkdir -p out && cd out; \
    cmake -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DCMAKE_C_FLAGS="-fPIC" ..; \
    cmake --build . --config Release --target brotlienc; \
    wget -qO /tmp/nginx.tar.gz "https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz"; \
    mkdir -p /tmp/nginx && tar -xzf /tmp/nginx.tar.gz -C /tmp/nginx --strip-components=1; \
    cd /tmp/nginx; \
    ./configure --with-compat --add-dynamic-module=/ngx_brotli >/dev/null; \
    make -j"$(nproc)" modules; \
    mkdir -p /modules; \
    cp objs/ngx_http_brotli_filter_module.so objs/ngx_http_brotli_static_module.so /modules/

FROM nginx:alpine

# Bring in the compiled modules and load them from the main context (load_module is not valid inside the
# http/server block that etc/nginx.conf lives in).
COPY --from=brotli-builder /modules/ /etc/nginx/modules/
RUN sed -i '1i load_module /etc/nginx/modules/ngx_http_brotli_filter_module.so;\nload_module /etc/nginx/modules/ngx_http_brotli_static_module.so;' /etc/nginx/nginx.conf

COPY ./build /var/www

COPY ./etc/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./etc/csp.conf /etc/nginx/conf.d/csp.conf

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
