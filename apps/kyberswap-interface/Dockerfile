# Pinned so both stages resolve to the same nginx build: the modules compiled below are only loadable by a
# matching nginx, and a floating tag can drift between a cached builder layer and a freshly pulled runtime.
# 1.31.3-alpine is what `nginx:alpine` resolved to when this was pinned — bump both stages together here.
ARG NGINX_VERSION=1.31.3

# Compile the ngx_brotli dynamic modules against that same nginx so `brotli_static` works in the final image
# (stock nginx:alpine ships no brotli). --with-compat keeps the resulting .so loadable across compatible
# nginx builds.
FROM nginx:${NGINX_VERSION}-alpine AS brotli-builder

# Pinned to a commit rather than tracking master, so rebuilding this image cannot silently compile different
# third-party source into the runtime.
ARG NGX_BROTLI_SHA=a71f9312c2deb28875acc7bacfdd5695a111aa53

RUN set -eux; \
    apk add --no-cache --virtual .build-deps git build-base cmake pcre-dev zlib-dev openssl-dev linux-headers; \
    NGINX_VERSION="$(nginx -v 2>&1 | sed -e 's|.*nginx/||')"; \
    mkdir -p /ngx_brotli; \
    cd /ngx_brotli; \
    git init -q .; \
    git remote add origin https://github.com/google/ngx_brotli.git; \
    git fetch -q --depth 1 origin "${NGX_BROTLI_SHA}"; \
    git checkout -q FETCH_HEAD; \
    git submodule update -q --init --recursive --depth 1; \
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

FROM nginx:${NGINX_VERSION}-alpine

# Bring in the compiled modules and load them from the main context (load_module is not valid inside the
# http/server block that etc/nginx.conf lives in).
COPY --from=brotli-builder /modules/ /etc/nginx/modules/
RUN sed -i '1i load_module /etc/nginx/modules/ngx_http_brotli_filter_module.so;\nload_module /etc/nginx/modules/ngx_http_brotli_static_module.so;' /etc/nginx/nginx.conf

COPY ./build /var/www

COPY ./etc/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./etc/csp.conf /etc/nginx/conf.d/csp.conf
COPY ./build/swap-intent-redirects.map /etc/nginx/swap-intent-redirects.map

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
