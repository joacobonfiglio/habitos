#!/usr/bin/env bash
# Independent application ID: installs beside original Pulso without touching its data/signature.
set -euo pipefail
cd "$(dirname "$0")"
SOURCE="$PWD"
TASK_BUILD="$(mktemp -d)"
trap 'rm -rf "$TASK_BUILD"' EXIT
cp -R app "$TASK_BUILD/app"
cp build.sh "$TASK_BUILD/build.sh"
python3 - "$TASK_BUILD" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
for p in root.glob('app/src/main/java/ar/pulso/*.java'):
    p.write_text(p.read_text().replace('ar.pulso','ar.pulso.connector').replace('LifeOS','Mi espacio'))
p=root/'app/src/main/AndroidManifest.xml'
p.write_text(p.read_text().replace('package="ar.pulso"','package="ar.pulso.connector"').replace('versionCode="3"','versionCode="1"').replace('versionName="0.3.0"','versionName="1.0.0"').replace('android:label="Pulso"','android:label="Pulso Conector"').replace('Pulso · contar','Pulso Conector · contar'))
p=root/'app/src/main/assets/index.html'
s=p.read_text().replace('LifeOS','Mi espacio').replace('</svg>Pulso</div>','</svg>Pulso Conector</div>').replace('<title>Pulso ·','<title>Pulso Conector ·').replace('Pulso 0.3 ·','Pulso Conector 1.0 ·')
s=s.replace('La sincronización es opcional y conserva el historial local.','Esta app se instala junto al Pulso original y conserva sus registros. Puede recuperar los eventos que Android todavía tenga disponibles; el historial antiguo de la otra app queda en ella.')
s=s.replace('Solo en tu teléfono','Vinculación opcional')
p.write_text(s)
PY
PULSO_UNSIGNED_ONLY=1 bash "$TASK_BUILD/build.sh"
mkdir -p "$SOURCE/build/connector"
cp "$TASK_BUILD/build/aligned.apk" "$SOURCE/build/connector/Pulso-Conector-unsigned.apk"
cp "${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}/build-tools/35.0.0/lib/apksigner.jar" "$SOURCE/build/connector/apksigner.jar"
echo 'Pulso Conector compiled separately. Sign only with its own release key.'
