#!/usr/bin/env bash
# Генерирует самоподписанный SSL сертификат для локального использования.
# Браузер покажет предупреждение — нужно однократно добавить исключение.
# Для продакшена замените на Let's Encrypt (certbot).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="${SCRIPT_DIR}/ssl"

mkdir -p "${SSL_DIR}"

# Укажите IP или домен машины с Docker
COMMON_NAME="${1:-192.168.1.200}"

openssl req -x509 \
  -newkey rsa:4096 \
  -keyout "${SSL_DIR}/key.pem" \
  -out    "${SSL_DIR}/cert.pem" \
  -days   825 \
  -nodes \
  -subj "/CN=${COMMON_NAME}" \
  -addext "subjectAltName=IP:${COMMON_NAME},DNS:${COMMON_NAME},DNS:localhost"

echo ""
echo "SSL certificate generated: ${SSL_DIR}/cert.pem"
echo "Common Name / SAN: ${COMMON_NAME}"
echo ""
echo "Next step: import cert.pem into your browser/OS as a trusted CA"
echo "  macOS:   Security → Certificates → import cert.pem → Trust Always"
echo "  Android: Settings → Security → Install from storage"
echo "  Windows: certmgr.msc → Trusted Root Certification Authorities → import cert.pem"
