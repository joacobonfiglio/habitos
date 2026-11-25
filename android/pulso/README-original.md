# Pulso · Android 0.2

App local de hábitos de uso para Android 8 o posterior. Versión de prueba para Samsung, sin cuenta ni permiso de Internet.

## Actualizar desde 0.1

Abrir `Pulso-0.2.apk` en el teléfono y elegir actualizar. Usa el mismo paquete `ar.pulso`, un versionCode mayor y la misma firma que 0.1. **No desinstalar la versión anterior:** eso borraría sus datos locales. Las notificaciones guardadas conservan su base de datos; el historial diario de uso se incorpora en esta versión.

## Novedades

- Selector **Mes**, con navegación a meses anteriores y calendario mensual (hasta 24 meses).
- Totales, días registrados y días completos disponibles para cada período.
- Comparación total y por aplicación: tiempo del período comparable, tiempo anterior, diferencia absoluta y porcentaje de aumento/disminución.
- **Semana** muestra los últimos 7 días completos, hasta ayer, y compara con los 7 días completos anteriores.
- Mes actual: muestra el total hasta ahora, pero compara solamente los días completos hasta ayer con el mismo número de días del mes anterior.
- Meses finalizados: compara desde el día 1 hasta el menor número de días de ambos meses. Por ejemplo, octubre y septiembre se comparan del 1 al 30; el total mensual de octubre sigue incluyendo el 31.
- Si falta algún día completo, no calcula porcentajes. Los días faltantes se muestran como “Sin datos”. No equivalen a cero uso.
- Base anterior de cero: “Sin uso anterior”, nunca un porcentaje infinito. Si una app deja de usarse en un período completo, puede mostrar −100%.
- Historial local de hasta 24 meses; recupera los eventos que Android aún conserva y guarda resúmenes diarios.
- Captura al abrir/refrescar Pulso y mediante JobScheduler aproximadamente cada 6 horas. Android puede retrasar la tarea; no requiere un servicio permanente ni conexión a Internet.
- Barra inferior protegida por insets nativos: un contenedor reduce el tamaño real del WebView, dejando los botones del sistema fuera de la interfaz. Incluye margen adicional de 8 dp.

## Qué historial puede recuperar

Android conserva eventos detallados durante un tiempo limitado. Esta versión **no puede reconstruir meses que Android ya eliminó ni que Pulso 0.1 no guardó**. El selector permite revisar meses anteriores, pero se verán sin datos cuando no haya registros.

En cada captura se consultan hasta 8 días de eventos. El primer día retenido se considera potencialmente incompleto; los días posteriores ya finalizados se guardan como completos según los eventos disponibles. Se preservan los resúmenes completos anteriores cuando una consulta posterior tiene menos información. El día actual siempre es parcial hasta una captura posterior a medianoche.

“Completo” significa que la ventana diaria está cubierta por el historial consultado; no garantiza que Android haya emitido todos los eventos. Multiventana, reinicios, cambios de zona horaria y restricciones del fabricante pueden afectar las estimaciones. Si el teléfono impide las capturas durante más tiempo que la retención del sistema, habrá huecos. Los días se asignan usando la zona horaria del teléfono al capturarlos.

## Configurar

1. Abrir Pulso y habilitar **Permitir acceso de uso** en los ajustes de Android.
2. Opcionalmente, en **Ajustes → Gestionar acceso a notificaciones**, habilitar Pulso. Android concede acceso amplio, pero el código guarda solamente aplicación y hora; no guarda títulos, mensajes ni adjuntos.
3. **Ajustes → Añadir widget**, o mantener presionada la pantalla de inicio y buscar Pulso en Widgets.
4. Si Android bloquea una instalación o permiso, revisar el mensaje exacto antes de cambiar protecciones del teléfono.

## Funciones conservadas

Resumen, lista con búsqueda, detalle por app, horas de uso, sesiones estimadas, duración media y máxima, notificaciones por app y hora, widget con refresco manual. Los datos permanecen en el dispositivo; copia de seguridad Android deshabilitada.

## Límites

- No incluye ventana flotante, límites ni bloqueo de aplicaciones.
- Tiempo en aplicaciones excluye launcher y System UI; no equivale al tiempo total de pantalla.
- Se reconstruye una sola app en primer plano. Sesiones que cruzan medianoche se dividen en tramos diarios. Las aperturas son inicios de estos tramos, no lanzamientos físicos exactos.
- Notificaciones: se registran desde que se activa el servicio, por hasta 90 días. No se recuperan avisos anteriores ni se cuentan actualizaciones de un aviso activo, resúmenes de grupos o avisos permanentes. No equivale al número de mensajes.
- El botón de borrar conteos elimina solamente las notificaciones guardadas. No borra el archivo diario de uso ni las estadísticas de Android.
- Widget automático aproximadamente cada 30 minutos, sujeto al sistema. También al refrescar el resumen y al tocar Actualizar. No funciona como contador en tiempo real.
- Hasta 40 sesiones recientes en Hábitos y hasta 30 por app entre las últimas 200 del período. Los agregados diarios conservan hasta 200 sesiones para el detalle; sus totales incluyen todas las sesiones disponibles.
- APK de prueba, no publicado en Play Store. Compilación, lógica y UI probadas; pendiente validación de esta actualización en Samsung físico/emulador, especialmente SQLite, JobScheduler, permisos e insets con botones/gestos.

## Verificaciones

- Compilación contra API 35; mínimo 26. Firma v2/v3 válida y certificado idéntico al APK 0.1.
- 11 pruebas de sesiones y 13 de períodos/comparaciones: fin de rango, medianoche, no solapamiento, meses de 28/29/30/31 días, cambio de año, mes futuro, día 1, aumento, reducción, base cero y −100%.
- Chromium: navegación, búsqueda, detalle, selección de mes, comparación semanal, porcentajes por app, ausencia de porcentajes con datos incompletos, días desconocidos, cero anterior, anchos de 320/393/800/1000 px y barra dentro de un viewport reducido.
- Los tests web inyectan datos ficticios. El APK no contiene datos de muestra.

## Compilar

JDK 17 y SDK Android con `platforms;android-35` y `build-tools;35.0.0`:

```bash
export ANDROID_SDK_ROOT=/ruta/al/sdk
./build.sh
```

Salida: `build/Pulso-0.2.apk`. Sin Gradle ni librerías externas. El script firma con `build/pulso-test.jks` (contraseña de desarrollo `android`), o con la ruta de `PULSO_KEYSTORE`. El almacén privado no se incluye en el archivo de fuentes; debe conservarse para futuras actualizaciones. No usar claves de desarrollo para una distribución pública.

```bash
mkdir -p build/tests
javac -d build/tests app/src/main/java/ar/pulso/Sessions.java app/src/main/java/ar/pulso/Periods.java tests/SessionsTest.java tests/PeriodsTest.java
java -cp build/tests SessionsTest
java -cp build/tests PeriodsTest
```

## Prueba pendiente en Samsung

- Instalar encima de 0.1; comprobar que conserva permisos y conteos.
- Navegar Hoy/Semana/Mes, elegir meses previos y comprobar estados sin historial.
- Comparar el uso observado con un par de apps abiertas durante intervalos conocidos.
- Verificar barra inferior con navegación de 3 botones, gestos, teclado y orientación horizontal.
- Dejar capturar durante varios días, cerrar/reabrir y comprobar que persisten los resúmenes y se habilitan comparaciones cuando existe cobertura suficiente.
- Reiniciar y comprobar que se mantiene la tarea periódica. El cierre forzado o restricciones de batería pueden impedirla.
