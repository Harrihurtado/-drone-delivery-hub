# 🚁 Drone Delivery Hub

Actividad de Testing con Jest — Auditoría, depuración y aseguramiento de calidad
de una API REST (Node.js + Express).

**Integrantes:** [Tu nombre] y [Nombre de tu compañero/a]
**Backend asignado:** Drone Delivery Hub (plataforma de gestión de flota de drones de reparto)

---

## 1. De qué se trata el proyecto

Nos tocó una API que administra una flota de drones para reparto de paquetes.
La regla de negocio principal es simple: **1km recorrido = 2% de batería
consumida**. El sistema debe:

- Listar los drones disponibles (`idle`) para asignar entregas.
- Despachar un dron a una distancia determinada, validando que tenga batería
  suficiente y que esté libre.

El código venía con 2 bugs intencionales que tuvimos que encontrar y corregir
antes de poder confiar en nuestras propias pruebas.

## 2. Cómo correr el proyecto

```bash
npm install
npm test
```

Debe mostrar `Tests: 21 passed, 21 total`.

## 3. Estructura del proyecto

El código original venía todo junto en un solo `app.js`. Lo primero que
hicimos fue separarlo en capas (modelo / servicio / controlador / rutas),
sin tocar la lógica de negocio, porque así podíamos mockear cada capa por
separado a la hora de escribir las pruebas de integración Top-Down y
Bottom-Up. Si dejábamos todo junto, aislar las capas para mockear iba a ser
mucho más difícil.

```
src/
  models/droneModel.js        -> simula la "base de datos" en memoria
  services/droneService.js    -> lógica de negocio (aquí estaban los 2 bugs)
  controllers/droneController.js
  app.js                      -> rutas de Express
tests/
  unit/            -> 10 pruebas
  integration/     -> 9 pruebas (3 Top-Down, 3 Bottom-Up, 3 Big Bang)
  regression/      -> 2 pruebas
```

## 4. Los bugs que encontramos

### Bug 1: Cálculo de Drenaje mal hecho

El código original hacía esto:

```js
drone.battery -= distanceKm;
```

Es decir, restaba directamente los kilómetros recorridos en vez del consumo
real de batería. Como la regla dice que 1km = 2% de batería, un viaje de
10km debía gastar 20%, pero con este bug solo gastaba 10%. Nos dimos cuenta
al hacer la cuenta a mano y comparar con lo que devolvía la API: la batería
sobrante no cuadraba con lo esperado.

**Corrección:**

```js
const requiredBattery = distanceKm * 2;
drone.battery -= requiredBattery;
```

### Bug 2: Estado Fantasma

Después de despachar un dron, su `status` nunca se actualizaba. Seguía
apareciendo como `'idle'` en `getAvailable()` aunque ya estuviera en vuelo,
lo que en teoría permitía asignarle dos entregas al mismo tiempo — algo que
no tiene sentido en la vida real (un dron no puede estar en dos lugares a
la vez).

**Corrección:** agregamos `drone.status = 'en-vuelo';` justo después de
descontar la batería, así el dron queda bloqueado para nuevas asignaciones
hasta que vuelva a estar disponible.

## 5. Cómo organizamos las 21 pruebas

| Tipo | Cantidad | Archivo |
|---|---|---|
| Unitarias — Modelo | 4 | `tests/unit/droneModel.test.js` |
| Unitarias — Servicio (con mocks/spies) | 6 | `tests/unit/droneService.test.js` |
| Integración Top-Down | 3 | `tests/integration/topDown.test.js` |
| Integración Bottom-Up | 3 | `tests/integration/bottomUp.test.js` |
| Integración Big Bang | 3 | `tests/integration/bigBang.test.js` |
| Regresión | 2 | `tests/regression/regression.test.js` |

### Unitarias

Probamos por separado el modelo (búsqueda de drones y filtrado por estado
`idle`) y el servicio (cálculo de batería, validaciones de disponibilidad,
lanzamiento de errores). Para las del servicio usamos `jest.mock` sobre
`DroneModel`, así las pruebas del servicio no dependen de que el modelo
funcione bien — están completamente aisladas. En un caso además usamos
`jest.spyOn` para comprobar no solo el resultado, sino que la función
`findById` se llamó con el id correcto.

### Integración — los 3 enfoques

Esta fue la parte que más nos costó entender al principio, así que la
explicamos con calma:

- **Top-Down:** empezamos por arriba (las rutas HTTP) y mockeamos lo que
  hay debajo (`DroneService` y `DroneModel`). La idea es comprobar que el
  controlador y las rutas responden bien, sin depender de que la lógica de
  negocio de abajo ya esté terminada o correcta.

- **Bottom-Up:** al revés. Usamos el modelo y el servicio **reales**, sin
  ningún mock, y verificamos que se integran bien entre sí. Después subimos
  un nivel más y llamamos al controlador directamente (con objetos `req` y
  `res` simulados a mano), pero sin levantar un servidor HTTP real todavía.

- **Big Bang:** todo junto, de una sola vez. Hacemos una petición HTTP real
  contra la API completa (con `supertest`) y comprobamos tanto la respuesta
  como que el cambio haya quedado guardado en el modelo. Es la forma más
  parecida a como lo usaría un cliente real.

### Regresión

Las dos últimas pruebas existen para que, si en el futuro alguien vuelve a
romper el código sin querer, las pruebas fallen inmediatamente:

1. Confirma que un vuelo de 10km siempre consume exactamente 20% de
   batería (nunca 10%, que era lo que pasaba con el bug 1).
2. Confirma que, después de un despacho, el dron queda bloqueado y no se
   puede volver a asignar (si el bug 2 regresara, esta prueba fallaría).

## 6. Lo que aprendimos

Antes de esta actividad no teníamos muy claro para qué servían realmente
los mocks — pensábamos que eran solo "para no usar la base de datos real".
Haciendo las pruebas Top-Down vs Bottom-Up entendimos que en realidad sirven
para decidir **qué parte del sistema queremos aislar** en cada prueba, y que
las pruebas de integración no son todas iguales: cada enfoque responde una
pregunta distinta sobre el sistema.
