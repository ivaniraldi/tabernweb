# ⚔️ TabernWeb: MMORPG Tavern & Casino

Bienvenido a **TabernWeb**, un RPG multijugador masivo (MMORPG) basado en web donde la aventura comienza en una taberna llena de misterios, comercio y juegos de azar. Explora, interactúa con otros jugadores, mejora tus estadísticas y prueba tu suerte en el casino.

---

## 🛠️ Stack Tecnológico

El proyecto está construido sobre una arquitectura moderna de **Full-Stack JavaScript**, optimizada para la interactividad masiva y la seguridad:

### **Frontend (El Cliente)**
- **React.js**: Gestiona la interfaz de usuario reactiva (HUD, Inventario, Trading, Chat).
- **Phaser 3**: Motor de juego encargado del renderizado 2D, animaciones y físicas.
- **Interpolación de Movimiento**: Sistema de suavizado (lerp) para representar el movimiento multijugador de forma fluida a pesar del tick-rate del servidor.

### **Backend (El Servidor)**
- **Node.js & Express**: API REST robusta para lógica de negocio y persistencia.
- **Socket.io (Tick-Rate 20Hz)**: Comunicación en tiempo real optimizada. El servidor procesa y distribuye el estado del mundo cada 50ms para garantizar escalabilidad.
- **Prisma ORM & PostgreSQL**: Gestión eficiente y segura de la base de datos relacional.
- **LogService**: Sistema centralizado de auditoría para transacciones, juegos de azar y seguridad.

---

## 🛡️ Seguridad y Robustez

### **Sistema Anti-Cheat**
- **Validación de Movimiento**: El servidor verifica la distancia recorrida entre actualizaciones. Si se detecta un intento de teletransporte o speed-hack, el jugador es rebotado a su posición anterior.
- **Lógica Server-Side**: Todas las acciones críticas (compras, apuestas, misiones, distribución de puntos) se validan y ejecutan exclusivamente en el servidor.

### **Escalabilidad de Red**
- **Broadcast por Ticks**: En lugar de enviar mensajes por cada movimiento individual, el servidor agrupa el estado de todos los jugadores y lo envía de forma masiva, reduciendo drásticamente el uso de CPU y ancho de banda.

---

## 🎮 Funcionalidades del Juego

### 🌎 Mundo Multijugador
- **Exploración Sincronizada**: Mapas interactivos con transiciones y objetos dinámicos (cofres, puertas).
- **NPCs Interactivos**: Personajes que ofrecen tiendas, misiones y diálogos.

### 📈 Progresión y Quests
- **Sistema de Misiones (Nuevo)**: Infraestructura completa para misiones diarias y de historia con recompensas progresivas.
- **Evolución de Personaje**: Gana EXP y distribuye **+3 puntos por nivel** en VIT, INT, STR, DEX y LUK.

### 💰 Economía y Casino
- **Trading Seguro**: Interfaz síncrona para el intercambio de ítems y oro entre jugadores.
- **Casino de Alta Fidelidad**: Slots con lógica de azar profesional, influencia de la estadística **LUK** y animaciones secuenciales de rodillos.
- **Auditoría de Economía**: Registro detallado de cada tirada y trade para prevenir fraudes.

---

## ⚙️ Configuración del Proyecto

1. **Backend**:
   - `npm install`
   - Configurar `.env` con `DATABASE_URL`
   - `npx prisma db push`
   - `npm run dev`

2. **Client**:
   - `npm install`
   - `npm run dev`

---

**TabernWeb** - *Seguridad, Escalabilidad y Aventura.*
