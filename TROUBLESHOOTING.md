# Troubleshooting — sesión de depuración (11 sep 2026)

Registro de los problemas reales que aparecieron al correr Segurito por
primera vez en un celular (Android, vía Expo Go y luego un development
build de EAS), con causa raíz y arreglo aplicado. Guardado en el repo para
que no haya que volver a investigarlos si reaparecen.

## 1. Error 500 al escanear el QR: "expo-router is no longer compatible with react-navigation"

**Síntoma:** Metro devolvía un error 500 apenas se abría la app:

```
Metro has encountered an error: As of SDK 56, expo-router is no longer
compatible with react-navigation. For more information, see
https://docs.expo.dev/router/migrate/sdk-55-to-56/.
```

**Causa raíz:** `package.json` tenía instaladas directamente
`@react-navigation/native`, `@react-navigation/bottom-tabs` y
`@react-navigation/native-stack`. Desde Expo SDK 56+, `expo-router`
vendoriza su propia copia interna de React Navigation
(`expo-router/react-navigation`) y el bundler aborta con error 500 en
cuanto detecta que código de la app (fuera de `node_modules`) importa
`@react-navigation/*` directamente — sin importar si es Expo Go o un dev
build.

El único uso real en el código era `useFocusEffect` en
`src/screens/SecureVaultScreen.tsx`, importado de `@react-navigation/native`.

**Arreglo:**
- Se cambió el import a `useFocusEffect` desde `expo-router` (ya lo
  re-exporta con la misma firma).
- Se quitaron las tres dependencias `@react-navigation/*` de
  `package.json` (innecesarias; `expo-router` trae su propia versión).

## 2. "Cannot find native module 'ExpoMediaLibraryNext'"

**Síntoma:** Tras arreglar el punto 1, la app cargaba pero crasheaba en
`FileService.ts` al importar `expo-media-library`.

**Causa raíz:** se estaba abriendo la app con **Expo Go**, que no incluye
los módulos nativos custom de esta app (`expo-media-library` con su API
nueva basada en clases, `expo-local-authentication`, `expo-file-system`,
`expo-document-picker`, `expo-video`). Esto ya estaba documentado en el
README, pero es fácil pasarlo por alto al escanear el QR con la cámara del
celular (que abre Expo Go por default si sigue instalada).

**Arreglo:** no es un bug de código. Se generó un **development build**
con EAS (`eas build --profile development --platform android`) que sí
compila estos módulos nativos, y se instaló ese `.apk` en el celular en
vez de usar Expo Go. Ver la sección "Development build con EAS" en el
`README.md` para los pasos completos.

Nota: para el primer build hubo que instalar `expo-dev-client`
(`npx expo install expo-dev-client`) — es requisito para cualquier build
con perfil `development` en `eas.json` y no venía instalado.

## 3. Warning "The action 'GO_BACK' was not handled by any navigator"

**Síntoma:** ya con el dev build funcionando de punta a punta (ocultar un
archivo desde la fototeca funcionaba y mostraba el diálogo "Listo"),
aparecía este warning rojo justo después.

**Causa raíz:** en `src/screens/MediaPreviewScreen.tsx`, los tres flujos
(`handleHide`, `handleRestore`, `handleDelete`) llamaban a
`router.back()` sin comprobar antes si `/preview` tenía algo en el
historial de navegación al que volver. Si el stack ya estaba vacío (por
ejemplo, el usuario alcanzó a presionar "atrás" del sistema mientras el
`Alert` de confirmación seguía abierto, y el callback async de
ocultar/restaurar/eliminar llega después), `router.back()` dispara este
warning. Es un warning de desarrollo (no crashea, no aparece en
producción), pero indica un manejo de navegación no defensivo.

**Arreglo:** se agregó un helper `goBackSafely()` que revisa
`router.canGoBack()` antes de llamar a `back()`, y si no hay historial usa
`router.replace('/')` como fallback. Reemplaza las tres llamadas directas
a `router.back()` en ese archivo.

## Resumen de lo que se probó de punta a punta

- ✅ Build de desarrollo Android generado con EAS (`eas build --profile
  development --platform android`), proyecto vinculado como
  `@ralendaykino/Segurito`.
- ✅ Instalado el `.apk` en un celular real y conectado al Metro local vía
  el deep link `segurito://expo-development-client/?url=...`.
- ✅ Flujo de "ocultar foto" probado en el dispositivo real: seleccionar
  una foto de la fototeca → confirmar → se copia a la carpeta segura y se
  borra el original → diálogo "Listo" con el nombre del archivo.
- ⬜ Restaurar, eliminar definitivo, documentos y video no se probaron
  todavía en el dispositivo (solo por lectura de código) — probarlos antes
  de dar la app por completa.
- ⬜ iOS no se ha compilado ni probado (requiere macOS, ver README).
