# Guía: Colisiones con Tiled y Phaser 3

Esta guía explica cómo crear un mapa en Tiled, definir qué objetos son sólidos y hacer que Phaser 3 bloquee el paso del jugador.

## 1. Configuración en Tiled

### A. Crear el Tileset
1. Abre Tiled y crea un **Nuevo Tileset**.
2. Selecciona tu imagen `tiles.png`.
3. Establece el tamaño de baldosa a **32x32 px**.

### B. Definir qué baldosas chocan (Propiedades)
Hay dos formas de hacerlo:

#### Opción 1: Propiedad Booleana (Simple)
1. En la ventana de Tilesets, selecciona una baldosa (ej: un muro).
2. En el panel de **Propiedades**, haz clic en el botón `+` y añade una propiedad de tipo `bool` llamada `collides`.
3. Marca la casilla para que sea `true`.
4. Repite esto para todas las baldosas que quieras que sean sólidas.

#### Opción 2: Editor de Colisiones (Preciso)
1. Con el tileset abierto, haz clic en el icono de **Editor de Colisiones** (una pequeña forma de polígono en la barra superior).
2. Selecciona una baldosa.
3. Dibuja un cuadrado o polígono sobre la baldosa. Phaser solo detectará colisión en el área que dibujes. Esto es ideal para mesas o troncos de árboles donde quieres que el jugador pueda pasar "por detrás".

### C. Crear las Capas del Mapa
1. Crea una capa de baldosas llamada `Suelo` (para la hierba o madera).
2. Crea otra capa de baldosas llamada `Paredes` u `Obstaculos`. **Dibuja aquí todo lo que tenga colisiones.**

### D. Exportar
1. Ve a `Archivo -> Exportar como...`
2. Elige el formato **JSON map files (*.json)**.
3. Guárdalo como `map.json` en tu carpeta `client/public/assets/`.

---

## 2. Implementación en Phaser 3 (`MainScene.js`)

### A. Cargar los archivos
En la función `preload()`, carga tanto la imagen como el JSON:

```javascript
preload() {
    this.load.image('tiles', 'assets/tiles.png');
    this.load.tilemapTiledJSON('map', 'assets/map.json');
}
```

### B. Crear el mapa y las colisiones
En la función `create()`, después de crear el mapa, dile a Phaser que use las propiedades de Tiled:

```javascript
create() {
    // 1. Crear el objeto mapa
    const map = this.make.tilemap({ key: 'map' });

    // 2. Vincular la imagen cargada con el tileset del JSON
    // 'Tavern' es el nombre que le diste al tileset DENTRO de Tiled
    const tileset = map.addTilesetImage('Tavern', 'tiles');

    // 3. Crear las capas (el orden importa, la última se ve arriba)
    const floorLayer = map.createLayer('Suelo', tileset, 0, 0);
    const wallLayer = map.createLayer('Paredes', tileset, 0, 0);

    // 4. Activar colisiones en la capa de paredes
    // Esto busca la propiedad 'collides: true' que definimos en Tiled
    wallLayer.setCollisionByProperty({ collides: true });

    // 5. Vincular al jugador con la colisión
    // Asumiendo que tu jugador es 'this.me'
    this.physics.add.collider(this.me, wallLayer);

    // 6. Crear capas que van SOBRE el jugador (ej: Techos)
    // Se crean DESPUÉS del jugador o se les asigna un Depth mayor
    const topLayer = map.createLayer('Techo', tileset, 0, 0);
    topLayer.setDepth(10); // Un número alto para asegurar que tape todo
}
```

## 3. Capas sobre el Jugador (Profundidad)

A veces quieres que el personaje pueda pasar "debajo" de una viga, un candelabro o el borde de un tejado.

### En Tiled:
1. Crea una nueva Capa de Tiles y llámala `Techo` o `Superior`.
2. Dibuja en esta capa solo los objetos que quieres que tapen al jugador.

### En Phaser:
El orden en el que llamas a `createLayer` determina qué se dibuja primero. Sin embargo, lo más seguro es usar el sistema de **Depth** (Profundidad):

*   `Suelo`: No necesita depth (por defecto es 0).
*   `Paredes`: No necesita depth (0).
*   `Jugador`: Puedes ponerle `this.me.setDepth(5)`.
*   `Capa Superior`: Ponle `topLayer.setDepth(10)`.

```javascript
// Ejemplo rápido
this.me.setDepth(5);
topLayer.setDepth(10);
```

---

## 4. Notas Importantes

*   **Nombre del Tileset**: El primer argumento de `addTilesetImage` debe ser EXACTAMENTE igual al nombre que aparece en Tiled (en la pestaña de Tilesets).
*   **Física Arcade**: Asegúrate de que tu escena esté usando `Phaser.Physics.Arcade`.
*   **Debug**: Puedes activar el modo debug en la configuración de Phaser para ver los cuadros de colisión:
    ```javascript
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    }
    ```
