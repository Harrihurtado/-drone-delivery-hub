# 🚁 Drone Delivery Hub — Testing con Jest

## 1. Cómo correr el proyecto

```bash
npm install
npm test
```

Deberías ver `Tests: 21 passed, 21 total`.

Estructura:

```
src/
  models/droneModel.js        <- "base de datos" en memoria
  services/droneService.js    <- lógica de negocio (aquí estaban los 2 bugs)
  controllers/droneController.js
  app.js                      <- rutas Express
tests/
  unit/            (10 pruebas)
  integration/     (9 pruebas: 3 top-down, 3 bottom-up, 3 big bang)
  regression/      (2 pruebas)
```

Refactoricé el `app.js` original (que tenía todo en un solo archivo) en 4 archivos
separados (modelo / servicio / controlador / app). **Esto no cambia la lógica**,
solo permite mockear cada capa de forma independiente, que es justo lo que pide
la guía (Top-Down mockea capas bajas, Bottom-Up prueba capas bajas reales, etc.).
En la sustentación puedes explicar esto como una decisión de *testeabilidad*.

---

## 2. Los 2 bugs (para tu exposición)

### 🐛 Bug 1 — "Cálculo de Drenaje"
**Antes:** `drone.battery -= distanceKm;`
**Problema:** restaba directamente los km recorridos en vez del consumo real
(`distanceKm * 2`). Un dron que hacía un viaje de 10km debía gastar 20% de
batería, pero solo perdía 10%. Esto rompía la regla de negocio "1km = 2% de
batería" y permitía que, con vuelos largos repetidos, un dron terminara
"volando" con menos batería de la que el sistema creía tener disponible.

**Fix:** `drone.battery -= requiredBattery;` (donde `requiredBattery = distanceKm * 2`).

### 🐛 Bug 2 — "Estado Fantasma"
**Antes:** el `status` del dron nunca se actualizaba tras el despacho.
**Problema:** el dron seguía figurando como `'idle'` en `getAvailable()`
incluso estando ya en vuelo, por lo que podía ser asignado a **múltiples
entregas al mismo tiempo** — algo físicamente imposible y peligroso en un
sistema real de logística.

**Fix:** `drone.status = 'en-vuelo';` justo después de descontar la batería.

---

## 3. Cómo distribuí las 21 pruebas

| Tipo | Cantidad | Archivo |
|---|---|---|
| Unitarias (Modelo) | 4 | `tests/unit/droneModel.test.js` |
| Unitarias (Servicio, con mocks/spies) | 6 | `tests/unit/droneService.test.js` |
| Integración Top-Down | 3 | `tests/integration/topDown.test.js` |
| Integración Bottom-Up | 3 | `tests/integration/bottomUp.test.js` |
| Integración Big Bang | 3 | `tests/integration/bigBang.test.js` |
| Regresión | 2 | `tests/regression/regression.test.js` |

### Cómo diferenciar los 3 enfoques de integración (te lo van a preguntar)

- **Top-Down** (`topDown.test.js`): entro por la ruta HTTP (`app.get/post`) y
  **mockeo** `DroneService` y `DroneModel` con `jest.mock(...)`. Así pruebo que
  el controlador y las rutas "cablean" bien las peticiones, sin depender de
  que la lógica de negocio de abajo esté terminada. Es como probar el
  "esqueleto" de arriba hacia abajo, simulando los cimientos.

- **Bottom-Up** (`bottomUp.test.js`): al revés. Uso el `DroneModel` y el
  `DroneService` **reales** (sin mocks), los pruebo integrados entre sí, y
  luego subo un nivel más invocando el `DroneController` directamente con
  objetos `req/res` simulados a mano (sin levantar un servidor HTTP real).
  Construyo de abajo hacia arriba.

- **Big Bang** (`bigBang.test.js`): pruebo **todo junto**, de una sola vez,
  con una petición HTTP real (`supertest` contra `app`) y sin ningún mock.
  Verifico tanto la respuesta HTTP como que el estado haya quedado persistido
  en el modelo (`DroneModel.findById(...)`) — el sistema completo funcionando
  como lo usaría un cliente real.

### Uso de Mocks/Spies (pedido explícitamente en la guía)
En `droneService.test.js` uso `jest.mock('../../src/models/droneModel')` para
aislar completamente la lógica de negocio del acceso a datos, y
`jest.spyOn(DroneModel, 'findById')` en un caso puntual para verificar además
que la función fue llamada con el argumento correcto (`toHaveBeenCalledWith`).

### Pruebas de Regresión
Ambas atacan directamente los dos bugs:
1. Demuestra matemáticamente que 10km siempre consumen 20% de batería
   (`100 - dron.battery === 20`), nunca el 10% que daba el bug.
2. Demuestra que, tras un despacho, el dron queda bloqueado para nuevas
   asignaciones (`dispatch` lanza `'Dron no disponible'` en el segundo intento).

---

## 4. Guion sugerido para la sustentación (1 min por punto)

1. **"Recibimos un backend de gestión de flota de drones. Antes de escribir
   pruebas, revisamos el código y detectamos 2 bugs intencionales."** →
   explica los 2 bugs (sección 2).
2. **"Para poder mockear cada capa de forma limpia, separamos el archivo
   monolítico en Modelo / Servicio / Controlador / Rutas."**
3. **"Escribimos 10 pruebas unitarias: 4 sobre el modelo (búsqueda y
   filtrado) y 6 sobre el servicio, aislando el servicio del modelo con
   jest.mock y jest.spyOn."** → corre `npx jest tests/unit`.
4. **"Para integración usamos 3 enfoques distintos"** → explica Top-Down vs
   Bottom-Up vs Big Bang con la tabla de arriba → corre
   `npx jest tests/integration`.
5. **"Finalmente, 2 pruebas de regresión garantizan matemáticamente que estos
   bugs nunca vuelvan a aparecer."** → corre `npx jest tests/regression`.
6. Cierra corriendo `npm test` completo mostrando **21/21 verdes**.
