#!/bin/sh
cd "$(dirname "$0")" || exit 1
printf 'Abre http://localhost:8000 en Chrome o Edge.\n'
python3 -m http.server 8000
